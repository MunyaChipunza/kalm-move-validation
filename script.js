const app = document.querySelector("#app");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItemsEl = document.querySelector("[data-cart-items]");
const cartCountEls = document.querySelectorAll("[data-cart-count]");
const cartSubtotalEl = document.querySelector("[data-cart-subtotal]");
const searchPanel = document.querySelector("[data-search-panel]");
const siteSearch = document.querySelector("[data-site-search]");

const state = {
  data: null,
  bag: loadBag(),
  hasRenderedRoute: false,
  homeSectionsTimer: null,
  currentRouteKey: "",
  scrollPositions: new Map()
};

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0
});
const transparentPixel = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'%3E%3C/svg%3E";
const moveAudiences = [
  { id: "women", name: "Women" },
  { id: "men", name: "Men" }
];
const moveCategories = [
  { id: "shorts", name: "Shorts" },
  { id: "tops", name: "Tops" },
  { id: "bottoms", name: "Bottoms" },
  { id: "layers", name: "Layers" },
  { id: "accessories", name: "Accessories" }
];
let deferredImageObserver = null;

init();

async function init() {
  bindChrome();
  try {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const response = await fetch("products.json", { cache: "no-cache" });
    state.data = await response.json();
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
    renderBag();
  } catch (error) {
    app.innerHTML = renderEmptyState("The shop could not load. Refresh the page to try again.");
    console.error(error);
  }
}

function bindChrome() {
  navToggle?.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    nav?.classList.toggle("open", !expanded);
  });

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-to-bag]");
    if (addButton) {
      const productId = addButton.getAttribute("data-add-to-bag");
      const card = addButton.closest("[data-product-scope]");
      const size = card?.querySelector("[data-size-select]")?.value;
      const color = card?.querySelector("[data-color-select]")?.value;
      const error = card?.querySelector("[data-variant-error]");
      if (!size || !color) {
        if (error) error.textContent = "Please choose size and colour.";
        card?.querySelectorAll("[data-size-select], [data-color-select]").forEach((field) => field.setAttribute("aria-invalid", "true"));
        return;
      }
      addToBag(productId, size, color);
      addButton.textContent = "Added";
      window.setTimeout(() => {
        const product = findProduct(productId);
        addButton.textContent = product?.ctaLabel || "Add to bag";
      }, 1200);
    }

    const qtyButton = event.target.closest("[data-qty]");
    if (qtyButton) {
      updateQty(qtyButton.getAttribute("data-key"), Number(qtyButton.getAttribute("data-qty")));
    }

    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      removeFromBag(removeButton.getAttribute("data-remove"));
    }

    if (event.target.closest("[data-cart-open]")) openBag();
    if (event.target.closest("[data-cart-close]")) closeBag();
    if (event.target.closest("[data-search-open]")) openSearch();
    if (event.target.closest("[data-search-close]")) closeSearch();

    const previewButton = event.target.closest("[data-variant-preview]");
    if (previewButton) {
      const scope = previewButton.closest("[data-product-scope]");
      const color = previewButton.getAttribute("data-variant-preview");
      const colorSelect = scope?.querySelector("[data-color-select]");
      if (colorSelect) colorSelect.value = color;
      updateVariantImage(scope, color);
      clearVariantError(scope);
    }

    const galleryButton = event.target.closest("[data-gallery-image]");
    if (galleryButton) {
      const scope = galleryButton.closest("[data-product-scope]");
      updateGalleryImage(scope, galleryButton.getAttribute("data-gallery-image"));
    }
  });

  document.addEventListener("change", (event) => {
    const field = event.target.closest("[data-color-select], [data-size-select]");
    if (!field) return;
    const scope = field.closest("[data-product-scope]");
    clearVariantError(scope);
    if (field.matches("[data-color-select]")) updateVariantImage(scope, field.value);
  });

  searchPanel?.addEventListener("submit", (event) => event.preventDefault());
  siteSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const query = siteSearch.value.trim();
      if (query) window.location.hash = `#/shop?search=${encodeURIComponent(query)}`;
      closeSearch();
    }
  });
}

function renderRoute() {
  if (!state.data) return;
  if (state.currentRouteKey) state.scrollPositions.set(state.currentRouteKey, window.scrollY);
  const route = getRoute();
  const routeKey = window.location.hash || "#/";
  const isFirstRoute = !state.hasRenderedRoute;
  const isHomeRoute = route.path === "/" || route.path === "";
  state.hasRenderedRoute = true;
  state.currentRouteKey = routeKey;
  if (!isHomeRoute) clearHomeSectionSchedule();
  closeBag();
  nav?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
  restoreRouteScroll(route, routeKey);

  if (isHomeRoute) return renderHome({
    preserveHero: isFirstRoute && Boolean(app.querySelector(".hero-shell"))
  });
  if (route.path === "/shop") return renderShop(route.params);
  if (route.path === "/brands") return renderBrands();
  if (route.path.startsWith("/brand/")) return renderBrand(route.path.split("/").pop());
  if (route.path.startsWith("/product/")) return renderProduct(route.path.split("/").pop());
  if (route.path === "/cart") return renderCartPage();
  if (route.path === "/checkout") return renderCheckout();
  if (route.path === "/contact") return renderContact();
  if (route.path === "/policies") {
    renderPolicies();
    scrollToAnchor(route.anchor);
    return;
  }
  if (route.path === "/account") return renderAccount();
  renderNotFound();
}

function restoreRouteScroll(route, routeKey) {
  if (route.path === "/policies" && route.anchor) return;
  const targetY = route.path.startsWith("/product/")
    ? 0
    : state.scrollPositions.get(routeKey) || 0;
  window.scrollTo(0, targetY);
  window.requestAnimationFrame(() => {
    window.scrollTo(0, targetY);
    window.requestAnimationFrame(() => window.scrollTo(0, targetY));
  });
}

function getRoute() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathPart, query = ""] = raw.split("?");
  const [path, anchor = ""] = pathPart.split("#");
  return {
    path,
    params: new URLSearchParams(query),
    anchor
  };
}

function scrollToAnchor(anchor) {
  if (!anchor) return;
  window.setTimeout(() => {
    document.getElementById(anchor)?.scrollIntoView({ block: "start" });
  }, 0);
}

function setDocumentMeta(title, description) {
  document.title = title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && description) metaDescription.setAttribute("content", description);
}

function hydrateDeferredImages(root = document) {
  const images = [...root.querySelectorAll("img[data-src]")];
  if (!images.length) return;
  const loadImage = (image) => {
    const source = image.getAttribute("data-src");
    if (!source) return;
    image.src = source;
    image.removeAttribute("data-src");
  };
  if (!("IntersectionObserver" in window)) {
    images.forEach(loadImage);
    return;
  }
  if (!deferredImageObserver) {
    deferredImageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        deferredImageObserver.unobserve(entry.target);
        loadImage(entry.target);
      });
    }, { rootMargin: "220px 0px" });
  }
  images.forEach((image) => deferredImageObserver.observe(image));
}

function clearHomeSectionSchedule() {
  if (state.homeSectionsTimer) {
    window.clearTimeout(state.homeSectionsTimer);
    state.homeSectionsTimer = null;
  }
}

function scheduleHomeSections(sections) {
  clearHomeSectionSchedule();
  let loaded = false;
  const loadSections = () => {
    if (loaded) return;
    loaded = true;
    clearHomeSectionSchedule();
    window.removeEventListener("scroll", loadSections);
    window.removeEventListener("pointerdown", loadSections);
    const route = getRoute();
    if (route.path !== "/" && route.path !== "") return;
    if (app.querySelector("[data-home-sections]")) return;
    app.insertAdjacentHTML("beforeend", `<div data-home-sections>${sections}</div>`);
    bindNetlifyForms(app);
    hydrateDeferredImages(app);
  };
  window.addEventListener("scroll", loadSections, { once: true, passive: true });
  window.addEventListener("pointerdown", loadSections, { once: true });
  state.homeSectionsTimer = window.setTimeout(loadSections, 7000);
}

function renderHome({ preserveHero = false } = {}) {
  const { meta, brands, categories, products } = state.data;
  setDocumentMeta(
    "KALM Collective | Premium Movement, Outdoor, Wellness and Home",
    "Shop KALM Collective across KS Active, KALM Move, KALM Outdoor, KALM Wellness and KALM Home."
  );
  const arrivals = products.filter((product) => product.tags.includes("new-in")).slice(0, 8);
  const outdoorCooking = products.filter((product) => product.tags.includes("outdoor-cooking")).slice(0, 3);
  const bestSellers = [
    products.find((product) => product.id === "ks-high-waist-seamless-leggings"),
    products.find((product) => product.id === "kalm-move-studio-starter-set"),
    products.find((product) => product.id === "kalm-outdoor-ember-16-gas-pizza-oven"),
    products.find((product) => product.id === "kalm-home-white-cotton-bedding-set")
  ].filter(Boolean);
  const saleEdit = products.filter((product) => product.compareAtPrice).slice(0, 4);
  const featured = [
    products.find((product) => product.id === "kalm-move-studio-starter-set"),
    products.find((product) => product.id === "kalm-home-white-cotton-bedding-set"),
    products.find((product) => product.id === "kalm-outdoor-weather-ready-picnic-blanket")
  ].filter(Boolean);

  const hero = `
    <section class="hero-shell">
      <div class="hero-copy">
        <p class="eyebrow">KALM Collective</p>
        <h1>Premium essentials for movement, outdoor routines and everyday living.</h1>
        <p>Shop activewear, outdoor staples, wellness accessories and home essentials from the KALM brand family.</p>
        <div class="hero-actions">
          <a class="button primary" href="#/shop?category=new-in">Shop new arrivals</a>
          <a class="button secondary" href="#/brands">Explore brands</a>
        </div>
      </div>
      <a class="hero-media" href="#/shop" aria-label="Shop KALM Collective">
        <picture>
          <source media="(max-width: 760px)" srcset="assets/images/home-hero-shop-760.webp 760w, assets/images/home-hero-shop-900.webp 900w" sizes="100vw">
          <img src="assets/images/home-hero-shop-1200.webp" srcset="assets/images/home-hero-shop-760.webp 760w, assets/images/home-hero-shop-900.webp 900w, assets/images/home-hero-shop-1200.webp 1200w, ${escapeHtml(meta.heroImage)} 1800w" sizes="(max-width: 760px) 100vw, 63vw" alt="KALM Collective activewear and lifestyle products" width="1200" height="900" fetchpriority="high" decoding="async">
        </picture>
      </a>
    </section>`;

  const sections = `
    <section class="section-block category-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Shop by category</p>
          <h2>Find your edit</h2>
        </div>
        <a class="text-link" href="#/shop">Shop all</a>
      </div>
      <div class="category-grid">
        ${categories.filter((category) => ["activewear", "wellness", "home", "outdoor"].includes(category.id)).map(renderCategoryTile).join("")}
      </div>
    </section>

    <section class="brand-ribbon" aria-label="Featured brands">
      ${brands.map(renderBrandLogoCard).join("")}
    </section>

    ${renderProductRail("New Arrivals", arrivals, "#/shop?category=new-in")}
    ${renderOutdoorCookingFeature(outdoorCooking)}

    ${renderEditorialEdits()}

    <section class="feature-band">
      <div>
        <p class="eyebrow">Featured collection</p>
        <h2>Core pieces for calm routines.</h2>
        <p>Build a clean everyday rotation across training, outdoor plans, recovery and home essentials.</p>
        <a class="button primary" href="#/shop">Shop the edit</a>
      </div>
      <img src="${transparentPixel}" data-src="${escapeHtml(meta.featureImage)}" alt="KALM Collective featured products" width="1200" height="760" loading="lazy" decoding="async" fetchpriority="low">
    </section>

    ${renderProductRail("Best Sellers", bestSellers, "#/shop")}
    ${renderProductRail("Archive Sale", saleEdit, "#/shop?category=sale")}
    ${renderProductRail("Most Wanted", featured, "#/shop")}

    ${renderTrustStrip()}

    <section class="newsletter-panel">
      <div>
        <h2>Join the KALM Collective.</h2>
        <p>Receive new arrivals, care notes and private offers from the brand family.</p>
      </div>
      <form name="kalm-collective-newsletter" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-newsletter-form data-netlify-ajax data-success-message="You are subscribed to KALM Collective updates.">
        <input type="hidden" name="form-name" value="kalm-collective-newsletter">
        <input type="hidden" name="bot-field">
        <input type="hidden" name="source" value="homepage">
        <label class="sr-only" for="newsletter-email">Email address</label>
        <input id="newsletter-email" name="email" type="email" autocomplete="email" required>
        <button class="button primary" type="submit">Subscribe</button>
        <label class="consent newsletter-consent"><input type="checkbox" name="popia_consent" value="yes" required> <span>I agree to receive KALM Collective updates.</span></label>
        <p class="form-status" data-newsletter-status></p>
      </form>
    </section>

    ${renderFooter()}
  `;

  if (preserveHero) {
    const initialHero = app.querySelector(".hero-shell");
    if (initialHero) {
      scheduleHomeSections(sections);
    } else {
      app.innerHTML = `${hero}${sections}`;
      bindNetlifyForms(app);
      hydrateDeferredImages(app);
    }
  } else {
    clearHomeSectionSchedule();
    app.innerHTML = `${hero}${sections}`;
    bindNetlifyForms(app);
    hydrateDeferredImages(app);
  }
}

function renderEditorialEdits() {
  const edits = [
    {
      title: "Everyday movement",
      copy: "Soft active staples for school runs, studio sessions and slow weekend plans.",
      image: "assets/images/generated/brand-tiles/kalm-move-tile.webp",
      href: "#/shop?category=activewear"
    },
    {
      title: "Calm home essentials",
      copy: "Clean bedding, towels, ceramics and storage for a quieter daily rhythm.",
      image: "assets/images/generated/brand-tiles/kalm-home-tile.webp",
      href: "#/shop?category=home"
    },
    {
      title: "Outdoor living, simplified",
      copy: "Patio, picnic and day-trip pieces with a polished monochrome feel.",
      image: "assets/images/generated/brand-tiles/kalm-outdoor-tile.webp",
      href: "#/shop?category=outdoor"
    }
  ];
  return `
    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">Featured edit</p>
          <h2>Built for the way you live.</h2>
        </div>
      </div>
      <div class="edit-grid">
        ${edits.map((edit) => `
          <a class="edit-card" href="${edit.href}">
            <img src="${transparentPixel}" data-src="${escapeHtml(edit.image)}" alt="${escapeAttribute(edit.title)}" width="900" height="1040" loading="lazy" decoding="async" fetchpriority="low">
            <span>${escapeHtml(edit.title)}</span>
            <p>${escapeHtml(edit.copy)}</p>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderTrustStrip() {
  return `
    <section class="trust-strip" aria-label="Customer support">
      <a href="#/policies#delivery"><strong>Delivery</strong><span>Courier options across South Africa</span></a>
      <a href="#/policies#returns"><strong>Returns</strong><span>30-day returns on eligible items</span></a>
      <a href="#/contact"><strong>Contact</strong><span>Customer care weekdays</span></a>
      <a href="#/contact"><strong>Order help</strong><span>Support for sizing, products and delivery</span></a>
    </section>
  `;
}

function renderProductRail(title, products, href) {
  if (!products.length) return "";
  return `
    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">KALM Collective</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <a class="text-link" href="${href}">View all</a>
      </div>
      <div class="product-grid rail-grid">
        ${products.map((product, index) => renderProductCard(product, { eager: index < 4 })).join("")}
      </div>
    </section>
  `;
}

function renderOutdoorCookingFeature(products) {
  if (!products.length) return "";
  const heroProduct = products[0];
  return `
    <section class="outdoor-cooking-band">
      <a class="outdoor-cooking-media" href="#/product/${heroProduct.slug}">
        <img src="${transparentPixel}" data-src="${escapeHtml(heroProduct.gallery?.[4] || heroProduct.image)}" alt="${escapeAttribute(heroProduct.title)} outdoor cooking scene" width="1200" height="1500" loading="lazy" decoding="async" fetchpriority="low">
      </a>
      <div class="outdoor-cooking-copy">
        <p class="eyebrow">KALM Outdoor Cooking</p>
        <h2>Original pieces for open-air meals.</h2>
        <p>Original gas pizza, flat-top and braai products designed for patio counters, weekend hosting and premium outdoor routines.</p>
        <a class="button primary" href="#/shop?category=outdoor">Shop outdoor cooking</a>
      </div>
      <div class="outdoor-cooking-products">
        ${products.map((product) => `
          <a href="#/product/${product.slug}">
            <img src="${transparentPixel}" data-src="${escapeHtml(product.image)}" alt="${escapeAttribute(product.title)}" width="360" height="450" loading="lazy" decoding="async" fetchpriority="low">
            <span>${escapeHtml(product.title)}</span>
            <strong>${formatPrice(product.price)}</strong>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderShop(params = new URLSearchParams()) {
  const brand = params.get("brand") || "all";
  const category = params.get("category") || "all";
  const audience = params.get("audience") || "all";
  const moveCategory = params.get("moveCategory") || "all";
  const sort = params.get("sort") || "featured";
  const search = params.get("search") || "";
  const products = sortProducts(filterProducts({ brand, category, audience, moveCategory, search }), sort);
  const heading = shopHeading({ brand, category, audience, moveCategory, search });
  setDocumentMeta(
    `${heading} | KALM Collective`,
    "Shop KALM Collective essentials across activewear, outdoor cooking, wellness, home and archive activewear."
  );

  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Shop</p>
      <h1>${escapeHtml(heading)}</h1>
      <p>Curated essentials for movement, wellness, home and outdoor living.</p>
    </section>

    <section class="shop-layout">
      <aside class="filter-panel" aria-label="Shop filters">
        <form data-filter-form>
          <label>Brand
            <select name="brand">
              <option value="all">All brands</option>
              ${state.data.brands.map((item) => `<option value="${item.id}" ${brand === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </label>
          <label>Category
            <select name="category">
              <option value="all">All categories</option>
              ${state.data.categories.map((item) => `<option value="${item.id}" ${category === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </label>
          ${brand === "kalm-move" ? `
            <label>KALM Move
              <select name="audience">
                <option value="all">Women and men</option>
                ${moveAudiences.map((item) => `<option value="${item.id}" ${audience === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <label>Move category
              <select name="moveCategory">
                <option value="all">All KALM Move</option>
                ${moveCategories.map((item) => `<option value="${item.id}" ${moveCategory === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
          ` : ""}
          <label>Sort
            <select name="sort">
              <option value="featured" ${sort === "featured" ? "selected" : ""}>Featured</option>
              <option value="newest" ${sort === "newest" ? "selected" : ""}>Newest</option>
              <option value="price-asc" ${sort === "price-asc" ? "selected" : ""}>Price low to high</option>
              <option value="price-desc" ${sort === "price-desc" ? "selected" : ""}>Price high to low</option>
            </select>
          </label>
          <label>Search
            <input name="search" value="${escapeAttribute(search)}">
          </label>
        </form>
      </aside>
      <div>
        <div class="shop-toolbar">
          <span>${products.length} styles</span>
          <a href="#/shop">Clear filters</a>
        </div>
        <div class="product-grid">
          ${products.length ? products.map((product, index) => renderProductCard(product, { eager: index < 12 })).join("") : renderEmptyState("No products match those filters.")}
        </div>
      </div>
    </section>

    ${renderFooter()}
  `;

  document.querySelector("[data-filter-form]")?.addEventListener("change", updateShopFromForm);
  document.querySelector("[data-filter-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    updateShopFromForm(event);
  });
  hydrateDeferredImages(app);
}

function renderBrands() {
  setDocumentMeta(
    "Brands | KALM Collective",
    "Explore KS Active, KALM Move, KALM Outdoor, KALM Wellness and KALM Home."
  );
  app.innerHTML = `
    <section class="page-hero">
      <p class="eyebrow">Brands</p>
      <h1>The KALM Collective family.</h1>
      <p>Five connected brands, each built around simple essentials for movement, outdoor routines, wellness and home.</p>
    </section>

    <section class="brand-grid">
      ${state.data.brands.map((brand, index) => `
        <article class="brand-card-large">
          <a href="#/brand/${brand.id}">
            <img class="brand-image" ${index < 2 ? `src="${escapeHtml(brand.heroImage)}"` : `src="${transparentPixel}" data-src="${escapeHtml(brand.heroImage)}"`} alt="${escapeAttribute(brand.name)} products" width="900" height="660" ${index < 2 ? 'decoding="async"' : 'loading="lazy" decoding="async" fetchpriority="low"'}>
            <div class="brand-content">
              <p>${escapeHtml(brand.role)}</p>
              <h2>${escapeHtml(brand.name)}</h2>
              <span class="text-link">Shop brand</span>
            </div>
          </a>
        </article>
      `).join("")}
    </section>

    ${renderFooter()}
  `;
  hydrateDeferredImages(app);
}

function renderBrand(brandId) {
  const brand = state.data.brands.find((item) => item.id === brandId);
  if (!brand) return renderNotFound();
  const products = state.data.products.filter((product) => product.brandId === brand.id);
  setDocumentMeta(`${brand.name} | KALM Collective`, brand.summary);
  app.innerHTML = `
    <section class="brand-hero">
      <div>
        <img class="brand-hero-logo" src="${escapeHtml(getBrandLogo(brand))}" alt="${escapeAttribute(brand.logoAlt || brand.name)}" width="1254" height="1254">
        <p class="eyebrow">${escapeHtml(brand.role)}</p>
        <h1>${escapeHtml(brand.name)}</h1>
        <p>${escapeHtml(brand.summary)}</p>
        <a class="button primary" href="#/shop?brand=${brand.id}">Shop ${escapeHtml(brand.name)}</a>
      </div>
      <img src="${escapeHtml(brand.heroImage)}" alt="${escapeAttribute(brand.name)} edit" width="1200" height="900">
    </section>

    ${brand.id === "kalm-move" ? renderKalmMoveSubcategories() : ""}

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">${escapeHtml(brand.name)}</p>
          <h2>Shop the edit</h2>
        </div>
      </div>
      <div class="product-grid">
        ${products.map((product, index) => renderProductCard(product, { eager: index < 20 })).join("")}
      </div>
    </section>

    ${renderFooter()}
  `;
  hydrateDeferredImages(app);
}

function renderKalmMoveSubcategories() {
  const menCategoryLinks = moveCategories.map((category) => `
    <a href="#/shop?brand=kalm-move&audience=men&moveCategory=${category.id}">${escapeHtml(category.name)}</a>
  `).join("");
  return `
    <section class="section-block move-subcategories">
      <div class="section-head">
        <div>
          <p class="eyebrow">KALM Move</p>
          <h2>Choose your fit</h2>
        </div>
      </div>
      <div class="move-audience-grid">
        <a class="move-audience-card" href="#/shop?brand=kalm-move&audience=women">
          <span>Women</span>
          <p>Studio layers, active sets and everyday movement accessories.</p>
        </a>
        <a class="move-audience-card" href="#/shop?brand=kalm-move&audience=men">
          <span>Men</span>
          <p>Clean performance staples across shorts, tops, layers and accessories.</p>
        </a>
      </div>
      <div class="move-category-links" aria-label="KALM Move men categories">
        ${menCategoryLinks}
        <a href="#/shop?brand=kalm-move&audience=women&moveCategory=accessories">Women Accessories</a>
      </div>
    </section>
  `;
}

function renderProduct(slug) {
  const product = state.data.products.find((item) => item.slug === slug);
  if (!product) return renderNotFound();
  const manualRelated = (product.relatedProducts || [])
    .map((productId) => findProduct(productId))
    .filter(Boolean);
  const related = (manualRelated.length ? manualRelated : state.data.products
    .filter((item) => item.brandId === product.brandId && item.id !== product.id))
    .slice(0, 4);
  const details = product.features || product.detailBullets || [];
  setDocumentMeta(product.metaTitle || `${product.title} | ${product.brand}`, product.metaDescription || product.description);

  app.innerHTML = `
    <section class="product-detail" data-product-scope data-product-id="${product.id}">
      <div class="product-gallery">
        <img src="${escapeHtml(product.image)}" alt="${escapeAttribute(product.title)}" width="900" height="1125" data-product-image>
        ${renderProductGallery(product)}
      </div>
      <div class="product-info">
        <a class="eyebrow" href="#/brand/${product.brandId}">${escapeHtml(product.brand)}</a>
        <h1>${escapeHtml(product.title)}</h1>
        <div class="price-line">${renderPrice(product)}</div>

        <div class="selector-row">
          <label>Colour
            <select data-color-select>
              <option value="">Choose colour</option>
              ${product.colors.map((color) => `<option value="${escapeAttribute(color)}">${escapeHtml(color)}</option>`).join("")}
            </select>
          </label>
          <label>Size
            <select data-size-select>
              <option value="">Choose size</option>
              ${product.sizes.map((size) => `<option value="${escapeAttribute(size)}">${escapeHtml(size)}</option>`).join("")}
            </select>
          </label>
        </div>
        ${renderVariantPreviews(product)}
        <p class="variant-error" data-variant-error role="status" aria-live="polite"></p>

        <button class="button primary full" type="button" data-add-to-bag="${product.id}">${escapeHtml(product.ctaLabel)}</button>

        <p class="stock-line">${escapeHtml(product.stockLabel)}</p>
        ${product.sku ? `<p class="sku-line">SKU: ${escapeHtml(product.sku)}</p>` : ""}
        <p>${escapeHtml(product.longDescription || product.description)}</p>

        <div class="accordion-list">
          <details open>
            <summary>Product details</summary>
            <ul>${details.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </details>
          ${product.specifications?.length ? `
            <details>
              <summary>Specifications</summary>
              ${renderSpecifications(product.specifications)}
            </details>
          ` : ""}
          <details>
            <summary>Fit and fabric</summary>
            <p>${escapeHtml(product.fitNotes)}</p>
            <p>${escapeHtml(product.fabric)}</p>
          </details>
          <details>
            <summary>Care</summary>
            <p>${escapeHtml(product.care)}</p>
          </details>
          <details>
            <summary>Product help</summary>
            <form class="inline-help-form" name="kalm-collective-product-help" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-netlify-ajax data-success-message="Thanks. Customer care will reply to your product question.">
              <input type="hidden" name="form-name" value="kalm-collective-product-help">
              <input type="hidden" name="bot-field">
              <input type="hidden" name="product" value="${escapeAttribute(product.brand + " " + product.title)}">
              <label>Name<input name="name" autocomplete="name" required></label>
              <label>Email<input name="email" type="email" autocomplete="email" required></label>
              <label>Message<textarea name="message" rows="3" required></textarea></label>
              <label class="consent"><input type="checkbox" name="popia_consent" value="yes" required> <span>I agree that KALM Collective may use my details to respond.</span></label>
              <button class="button secondary full" type="submit">Request help</button>
              <p class="form-status"></p>
            </form>
          </details>
        </div>
      </div>
    </section>

    ${renderProductRail("More from " + product.brand, related, "#/shop?brand=" + product.brandId)}
    ${renderFooter()}
  `;
  bindNetlifyForms(app);
  hydrateDeferredImages(app);
}

function renderCartPage() {
  setDocumentMeta("Shopping Bag | KALM Collective", "Review selected KALM Collective products before checkout.");
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Your bag</p>
      <h1>Shopping Bag</h1>
      <p>Review your items before checkout.</p>
    </section>
    <section class="cart-page">
      <div class="panel">
        ${state.bag.length ? state.bag.map(renderBagLine).join("") : renderEmptyState("Your bag is empty.")}
      </div>
      <aside class="checkout-card">
        <h2>Order Summary</h2>
        <div class="summary-row"><span>Subtotal</span><strong>${formatPrice(getSubtotal())}</strong></div>
        <div class="summary-row"><span>Delivery</span><strong>Calculated at checkout</strong></div>
        <a class="button primary full" href="#/checkout">Checkout</a>
        <a class="button secondary full" href="#/shop">Continue shopping</a>
      </aside>
    </section>
    ${renderFooter()}
  `;
  hydrateDeferredImages(app);
}

function renderCheckout() {
  const subtotal = getSubtotal();
  setDocumentMeta("Checkout | KALM Collective", "Complete your KALM Collective order with delivery details, order notes and payment selection.");
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Checkout</p>
      <h1>Complete your order.</h1>
      <p>Enter your details, choose delivery and select a payment method. Payment instructions will be confirmed after order review.</p>
    </section>

    <section class="checkout-layout">
      <form class="checkout-form panel" name="kalm-collective-order" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-order-form data-netlify-ajax data-clear-bag="true" data-redirect="/thanks.html" data-success-message="Order received.">
        <input type="hidden" name="form-name" value="kalm-collective-order">
        <input type="hidden" name="bot-field">
        <input type="hidden" name="cart_summary" value="${escapeAttribute(getCartSummary())}">
        <input type="hidden" name="order_total" value="${subtotal}">

        <h2>Contact details</h2>
        <div class="form-grid two">
          <label>Full name<input name="name" autocomplete="name" required></label>
          <label>Email address<input name="email" type="email" autocomplete="email" required></label>
          <label>Phone number<input name="phone" autocomplete="tel" inputmode="tel" required></label>
        </div>

        <h2>Delivery address</h2>
        <div class="form-grid two">
          <label class="wide">Address<input name="address" autocomplete="street-address" required></label>
          <label>Suburb<input name="suburb" required></label>
          <label>City<input name="city" autocomplete="address-level2" required></label>
          <label>Province<input name="province" autocomplete="address-level1" required></label>
          <label>Postal code<input name="postal_code" autocomplete="postal-code" inputmode="numeric" required></label>
        </div>

        <h2>Shipping method</h2>
        <div class="option-grid">
          <label class="option-card"><input type="radio" name="shipping_method" value="Standard courier" checked><span><strong>Standard courier</strong><small>2 to 5 business days</small></span></label>
          <label class="option-card"><input type="radio" name="shipping_method" value="Express courier"><span><strong>Express courier</strong><small>1 to 2 business days</small></span></label>
          <label class="option-card"><input type="radio" name="shipping_method" value="Collection"><span><strong>Collection</strong><small>Store pickup arrangement</small></span></label>
        </div>

        <h2>Payment method</h2>
        <div class="option-grid">
          <label class="option-card"><input type="radio" name="payment_method" value="PayFast" checked><span><strong>PayFast</strong><small>Card and instant EFT</small></span></label>
          <label class="option-card"><input type="radio" name="payment_method" value="Ozow"><span><strong>Ozow</strong><small>Instant EFT</small></span></label>
          <label class="option-card"><input type="radio" name="payment_method" value="EFT"><span><strong>EFT</strong><small>Bank transfer</small></span></label>
        </div>
        <p class="payment-note">Payment instructions will be confirmed after order review. Card details are not collected on this page.</p>

        <label>Order notes<textarea name="notes" rows="4"></textarea></label>
        <label class="consent"><input type="checkbox" name="popia_consent" value="yes" required> <span>I agree that KALM Collective may process my details to complete this order and provide customer care.</span></label>
        <p class="form-status" data-order-status></p>
        <button class="button primary full" type="submit">Place order</button>
      </form>

      <aside class="checkout-card">
        <h2>Order Summary</h2>
        <div class="order-list">${state.bag.length ? state.bag.map(renderOrderLine).join("") : renderEmptyState("Your bag is empty.")}</div>
        <div class="summary-row"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>
        <a class="text-link" href="#/cart">Edit bag</a>
      </aside>
    </section>
    ${renderFooter()}
  `;

  document.querySelector("[data-order-form]")?.addEventListener("submit", (event) => {
    const status = document.querySelector("[data-order-status]");
    if (!state.bag.length) {
      event.preventDefault();
      status.textContent = "Add at least one item to your bag before checkout.";
      return;
    }
    event.currentTarget.cart_summary.value = getCartSummary();
    event.currentTarget.order_total.value = String(getSubtotal());
  });
  bindNetlifyForms(app);
  hydrateDeferredImages(app);
}

function renderContact() {
  setDocumentMeta("Customer Care | KALM Collective", "Contact KALM Collective for product, order, delivery and brand support.");
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Customer care</p>
      <h1>How can we help?</h1>
      <p>For product, order, delivery and brand questions, send a note to the KALM Collective team.</p>
    </section>
    <section class="contact-layout">
      <form class="panel checkout-form" name="kalm-collective-contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-netlify-ajax data-success-message="Thanks. Customer care will reply as soon as possible.">
        <input type="hidden" name="form-name" value="kalm-collective-contact">
        <input type="hidden" name="bot-field">
        <div class="form-grid two">
          <label>Full name<input name="name" autocomplete="name" required></label>
          <label>Email address<input name="email" type="email" autocomplete="email" required></label>
          <label>Phone number<input name="phone" autocomplete="tel" inputmode="tel"></label>
          <label>Topic
            <select name="topic">
              <option>Order care</option>
              <option>Sizing</option>
              <option>Delivery</option>
              <option>Returns</option>
              <option>Brand partnerships</option>
            </select>
          </label>
        </div>
        <label>Message<textarea name="message" rows="5" required></textarea></label>
        <label class="consent"><input type="checkbox" name="popia_consent" value="yes" required> <span>I agree that KALM Collective may use my details to respond to my message.</span></label>
        <p class="form-status"></p>
        <button class="button primary" type="submit">Send message</button>
      </form>
      <aside class="care-panel">
        <h2>Customer Care</h2>
        <p>Email: hello@kalmcollective.co.za</p>
        <p>Hours: Monday to Friday, 09:00 to 17:00 SAST.</p>
        <p>Follow: @kalmcollective</p>
      </aside>
    </section>
    ${renderFooter()}
  `;
  bindNetlifyForms(app);
  hydrateDeferredImages(app);
}

function renderPolicies() {
  setDocumentMeta("Policies | KALM Collective", "Delivery, returns, payment and privacy information for KALM Collective customers.");
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Policies</p>
      <h1>Customer information.</h1>
      <p>Delivery, returns, payment and privacy details for shopping with KALM Collective.</p>
    </section>
    <section class="policy-grid">
      <article class="policy-card" id="delivery"><h2>Delivery</h2><p>Courier delivery is available across South Africa. Standard delivery takes 2 to 5 business days after order confirmation, with express delivery available in selected areas.</p></article>
      <article class="policy-card" id="returns"><h2>Returns</h2><p>Returns are accepted within 30 days on unworn apparel and unused home or wellness items in their original condition and packaging.</p></article>
      <article class="policy-card"><h2>Payment</h2><p>Checkout supports PayFast, Ozow and EFT selections. Payment instructions are confirmed after order review, and card details are not collected on this page.</p></article>
      <article class="policy-card"><h2>Privacy</h2><p>KALM Collective processes customer information for orders, delivery, customer care and opt-in marketing in line with POPIA.</p></article>
    </section>
    ${renderFooter()}
  `;
  hydrateDeferredImages(app);
}

function renderAccount() {
  setDocumentMeta("Account | KALM Collective", "Use your email for KALM Collective order updates, product care and private offers.");
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Account</p>
      <h1>Customer account.</h1>
      <p>Use your email for order updates, product care and private offers.</p>
    </section>
    <section class="contact-layout">
      <form class="panel checkout-form" name="kalm-collective-account-updates" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-netlify-ajax data-success-message="Your details have been saved for KALM Collective updates.">
        <input type="hidden" name="form-name" value="kalm-collective-account-updates">
        <input type="hidden" name="bot-field">
        <label>Full name<input name="name" autocomplete="name" required></label>
        <label>Email address<input name="email" type="email" autocomplete="email" required></label>
        <label class="consent"><input type="checkbox" name="popia_consent" value="yes" required> <span>I agree to receive KALM Collective order and product updates.</span></label>
        <p class="form-status"></p>
        <button class="button primary" type="submit">Continue</button>
      </form>
      <aside class="care-panel">
        <h2>Benefits</h2>
        <p>Order updates, faster checkout details and early access to KALM Collective edits.</p>
      </aside>
    </section>
    ${renderFooter()}
  `;
  bindNetlifyForms(app);
  hydrateDeferredImages(app);
}

function renderNotFound() {
  setDocumentMeta("Page Not Found | KALM Collective", "Return to the KALM Collective shop or explore the brand family.");
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">KALM Collective</p>
      <h1>Page not found.</h1>
      <p>Return to the shop or explore the brand family.</p>
      <a class="button primary" href="#/shop">Shop now</a>
    </section>
    ${renderFooter()}
  `;
  hydrateDeferredImages(app);
}

function renderBrandLogoCard(brand) {
  return `
    <a class="brand-logo-card" href="#/brand/${brand.id}">
      <img class="brand-logo" src="${transparentPixel}" data-src="${escapeHtml(getBrandLogo(brand))}" alt="${escapeAttribute(brand.logoAlt || brand.name)}" width="1254" height="1254" loading="lazy" decoding="async" fetchpriority="low">
      <span class="sr-only">Shop ${escapeHtml(brand.name)}</span>
    </a>
  `;
}

function getBrandLogo(brand) {
  return brand?.approvedLogo || brand?.logo || "";
}

function renderCategoryTile(category) {
  return `
    <a class="category-tile" href="#/shop?category=${category.id}">
      <img src="${transparentPixel}" data-src="${escapeHtml(category.image)}" alt="${escapeAttribute(category.name)}" width="640" height="736" loading="lazy" decoding="async" fetchpriority="low">
      <span>${escapeHtml(category.name)}</span>
    </a>
  `;
}

function renderVariantPreviews(product) {
  if (!product.colors.length) return "";
  return `
    <div class="variant-previews" aria-label="Colour previews">
      ${product.colors.map((color) => `
        <button type="button" data-variant-preview="${escapeAttribute(color)}" aria-label="Preview ${escapeAttribute(color)}">
          <img src="${transparentPixel}" data-src="${escapeHtml(getVariantImage(product, color))}" alt="${escapeAttribute(product.title)} in ${escapeAttribute(color)}" width="116" height="136" loading="lazy" decoding="async" fetchpriority="low">
        </button>
      `).join("")}
    </div>
  `;
}

function renderProductGallery(product) {
  const images = getProductGalleryImages(product);
  if (images.length <= 1) return "";
  return `
    <div class="gallery-thumbs" aria-label="Product images">
      ${images.map((image, index) => `
        <button type="button" data-gallery-image="${escapeAttribute(image)}" aria-label="View image ${index + 1} for ${escapeAttribute(product.title)}" ${index === 0 ? 'aria-current="true"' : ""}>
          <img src="${transparentPixel}" data-src="${escapeHtml(image)}" alt="${escapeAttribute(product.title)} image ${index + 1}" width="116" height="136" loading="lazy" decoding="async" fetchpriority="low">
        </button>
      `).join("")}
    </div>
  `;
}

function renderSpecifications(specifications) {
  return `
    <dl class="spec-list">
      ${specifications.map((item) => `
        <div>
          <dt>${escapeHtml(item.label)}</dt>
          <dd>${escapeHtml(item.value)}</dd>
        </div>
      `).join("")}
    </dl>
  `;
}

function renderProductCard(product, options = {}) {
  const imageMarkup = options.eager
    ? `src="${escapeHtml(product.image)}" decoding="async"`
    : `src="${transparentPixel}" data-src="${escapeHtml(product.image)}" loading="lazy" decoding="async" fetchpriority="low"`;
  return `
    <article class="product-card" data-product-scope data-product-id="${product.id}">
      <a class="product-media" href="#/product/${product.slug}" aria-label="${escapeAttribute(product.title)}">
        ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
        <img ${imageMarkup} alt="${escapeAttribute(product.title)}" width="640" height="800" data-product-image>
      </a>
      <div class="product-card-body">
        <a class="product-brand" href="#/brand/${product.brandId}">${escapeHtml(product.brand)}</a>
        <h3><a href="#/product/${product.slug}">${escapeHtml(product.title)}</a></h3>
        <div class="price-line">${renderPrice(product)}</div>
        <div class="swatches" aria-label="Available colours">
          ${product.colors.slice(0, 4).map((color) => `<button type="button" data-variant-preview="${escapeAttribute(color)}" title="${escapeAttribute(color)}" aria-label="Preview ${escapeAttribute(color)}" style="--swatch:${swatch(color)}"></button>`).join("")}
        </div>
        <div class="quick-selectors">
          <label><span class="sr-only">Colour</span>
            <select data-color-select aria-label="Choose colour for ${escapeAttribute(product.title)}">
              <option value="">Colour</option>
              ${product.colors.map((color) => `<option value="${escapeAttribute(color)}">${escapeHtml(color)}</option>`).join("")}
            </select>
          </label>
          <label><span class="sr-only">Size</span>
            <select data-size-select aria-label="Choose size for ${escapeAttribute(product.title)}">
              <option value="">Size</option>
              ${product.sizes.map((size) => `<option value="${escapeAttribute(size)}">${escapeHtml(size)}</option>`).join("")}
            </select>
          </label>
        </div>
        <p class="variant-error" data-variant-error role="status" aria-live="polite"></p>
        <button class="button secondary full" type="button" data-add-to-bag="${product.id}">${escapeHtml(product.ctaLabel)}</button>
      </div>
    </article>
  `;
}

function renderPrice(product) {
  return `
    <strong>${formatPrice(product.price)}</strong>
    ${product.compareAtPrice ? `<s>${formatPrice(product.compareAtPrice)}</s>` : ""}
  `;
}

function updateVariantImage(scope, color) {
  const product = findProduct(scope?.getAttribute("data-product-id"));
  const image = scope?.querySelector("[data-product-image]");
  if (!product || !image) return;
  const imagePath = color ? getVariantImage(product, color) : product.image;
  const altText = color ? `${product.title} in ${color}` : product.title;
  setProductImage(image, imagePath, altText);
  setActiveGalleryImage(scope, imagePath);
}

function updateGalleryImage(scope, imagePath) {
  const product = findProduct(scope?.getAttribute("data-product-id"));
  const image = scope?.querySelector("[data-product-image]");
  if (!product || !image || !imagePath) return;
  setProductImage(image, imagePath, product.title);
  setActiveGalleryImage(scope, imagePath);
}

function setProductImage(image, imagePath, altText) {
  image.src = imagePath;
  image.removeAttribute("data-src");
  image.alt = altText;
}

function clearVariantError(scope) {
  if (!scope) return;
  const error = scope.querySelector("[data-variant-error]");
  if (error) error.textContent = "";
  scope.querySelectorAll("[data-size-select], [data-color-select]").forEach((field) => field.removeAttribute("aria-invalid"));
}

function getVariantImage(product, color) {
  return getVariantImages(product, color)[0] || product?.image || "";
}

function getVariantImages(product, color) {
  if (!product) return [];
  const fromMap = color && product.variantImages?.[color];
  if (fromMap) return normalizeImageList(fromMap);
  const fromVariant = product.variants?.find((variant) => variant.colour === color || variant.color === color)?.image;
  return normalizeImageList(fromVariant || product.image);
}

function getProductGalleryImages(product) {
  const images = [
    product?.image,
    ...(product?.gallery || []),
    ...Object.values(product?.variantImages || {}).flatMap(normalizeImageList)
  ];
  return Array.from(new Set(images)).filter(Boolean);
}

function normalizeImageList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

function setActiveGalleryImage(scope, imagePath) {
  if (!scope || !imagePath) return;
  scope.querySelectorAll("[data-gallery-image]").forEach((button) => {
    if (button.getAttribute("data-gallery-image") === imagePath) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
}

function renderBagLine(item) {
  const product = findProduct(item.productId);
  if (!product) return "";
  const image = item.image || getVariantImage(product, item.color);
  return `
    <div class="bag-line">
      <img src="${escapeHtml(image)}" alt="${escapeAttribute(product.title)} in ${escapeAttribute(item.color)}" width="184" height="224">
      <div>
        <a href="#/product/${product.slug}">${escapeHtml(product.title)}</a>
        <p class="bag-brand">${escapeHtml(product.brand)}</p>
        <p>Colour: ${escapeHtml(item.color)} / Size: ${escapeHtml(item.size)}</p>
        <strong>${formatPrice(product.price * item.qty)}</strong>
        <div class="qty-row">
          <button type="button" data-key="${item.key}" data-qty="-1" aria-label="Decrease quantity">-</button>
          <span>${item.qty}</span>
          <button type="button" data-key="${item.key}" data-qty="1" aria-label="Increase quantity">+</button>
          <button type="button" data-remove="${item.key}">Remove</button>
        </div>
      </div>
    </div>
  `;
}

function renderOrderLine(item) {
  const product = findProduct(item.productId);
  if (!product) return "";
  const image = item.image || getVariantImage(product, item.color);
  return `
    <div class="order-line">
      <img src="${escapeHtml(image)}" alt="${escapeAttribute(product.title)} in ${escapeAttribute(item.color)}" width="136" height="164">
      <div>
        <strong>${escapeHtml(product.title)}</strong>
        <span>${escapeHtml(product.brand)}</span>
        <span>${item.qty} x ${escapeHtml(item.color)} / ${escapeHtml(item.size)}</span>
      </div>
      <b>${formatPrice(product.price * item.qty)}</b>
    </div>
  `;
}

function renderBag() {
  const count = state.bag.reduce((sum, item) => sum + item.qty, 0);
  cartCountEls.forEach((el) => { el.textContent = String(count); });
  if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(getSubtotal());
  if (!cartItemsEl) return;
  cartItemsEl.innerHTML = state.bag.length ? state.bag.map(renderBagLine).join("") : renderEmptyState("Your bag is empty.");
}

function addToBag(productId, selectedSize, selectedColor) {
  const product = findProduct(productId);
  if (!product) return;
  if (!selectedSize || !selectedColor) return;
  const size = selectedSize;
  const color = selectedColor;
  const image = getVariantImage(product, color);
  const key = `${productId}::${size}::${color}`;
  const item = state.bag.find((entry) => entry.key === key);
  if (item) {
    item.qty += 1;
    item.image = image;
  } else {
    state.bag.push({ key, productId, size, color, image, qty: 1 });
  }
  saveBag();
  renderBag();
  openBag();
}

function updateQty(key, delta) {
  const item = state.bag.find((entry) => entry.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromBag(key);
  else {
    saveBag();
    renderBag();
    if (getRoute().path === "/cart") renderCartPage();
    if (getRoute().path === "/checkout") renderCheckout();
  }
}

function removeFromBag(key) {
  state.bag = state.bag.filter((item) => item.key !== key);
  saveBag();
  renderBag();
  if (getRoute().path === "/cart") renderCartPage();
  if (getRoute().path === "/checkout") renderCheckout();
}

function openBag() {
  cartDrawer?.setAttribute("aria-hidden", "false");
  cartDrawer?.removeAttribute("inert");
  document.body.classList.add("bag-open");
}

function closeBag() {
  cartDrawer?.setAttribute("aria-hidden", "true");
  cartDrawer?.setAttribute("inert", "");
  document.body.classList.remove("bag-open");
}

function openSearch() {
  searchPanel.hidden = false;
  siteSearch?.focus();
}

function closeSearch() {
  searchPanel.hidden = true;
}

function filterProducts({ brand = "all", category = "all", audience = "all", moveCategory = "all", search = "" }) {
  const term = search.trim().toLowerCase();
  return state.data.products.filter((product) => {
    const brandMatch = brand === "all" || product.brandId === brand;
    const categoryMatch = category === "all"
      || product.category === category
      || product.tags.includes(category)
      || (category === "sale" && product.compareAtPrice)
      || (category === "new-in" && product.tags.includes("new-in"));
    const audienceMatch = audience === "all" || product.audience === audience;
    const moveCategoryMatch = moveCategory === "all"
      || product.moveCategory === moveCategory
      || product.tags.includes(moveCategory);
    const searchMatch = !term || [
      product.title,
      product.brand,
      product.collection,
      product.type,
      product.description,
      product.shortDescription,
      product.longDescription,
      product.sku,
      (product.features || []).join(" "),
      (product.specifications || []).map((item) => `${item.label} ${item.value}`).join(" "),
      product.tags.join(" ")
    ].join(" ").toLowerCase().includes(term);
    return brandMatch && categoryMatch && audienceMatch && moveCategoryMatch && searchMatch;
  });
}

function sortProducts(products, sort) {
  const items = [...products];
  if (sort === "price-asc") return items.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return items.sort((a, b) => b.price - a.price);
  if (sort === "newest") return items.sort((a, b) => Number(b.tags.includes("new-in")) - Number(a.tags.includes("new-in")));
  return items;
}

function updateShopFromForm(event) {
  const form = event.currentTarget.closest("form") || event.currentTarget;
  const values = new FormData(form);
  const params = new URLSearchParams();
  for (const key of ["brand", "category", "audience", "moveCategory", "sort", "search"]) {
    const value = values.get(key);
    if (value && value !== "all" && value !== "featured") params.set(key, value);
  }
  window.location.hash = `#/shop${params.toString() ? "?" + params.toString() : ""}`;
}

function shopHeading({ brand, category, audience, moveCategory, search }) {
  if (search) return `Search results for "${search}"`;
  if (brand === "kalm-move" && audience !== "all" && moveCategory !== "all") {
    return `KALM Move ${moveAudienceName(audience)} ${moveCategoryName(moveCategory)}`.trim();
  }
  if (brand === "kalm-move" && audience !== "all") return `KALM Move ${moveAudienceName(audience)}`;
  if (brand === "kalm-move" && moveCategory !== "all") return `KALM Move ${moveCategoryName(moveCategory)}`;
  if (brand && brand !== "all") return state.data.brands.find((item) => item.id === brand)?.name || "Shop";
  if (category && category !== "all") return state.data.categories.find((item) => item.id === category)?.name || "Shop";
  return "Shop All";
}

function moveAudienceName(id) {
  return moveAudiences.find((item) => item.id === id)?.name || "";
}

function moveCategoryName(id) {
  return moveCategories.find((item) => item.id === id)?.name || "";
}

function bindNetlifyForms(root = document) {
  root.querySelectorAll("[data-netlify-ajax]").forEach((form) => {
    if (form.dataset.netlifyBound === "true") return;
    form.dataset.netlifyBound = "true";
    form.addEventListener("submit", submitNetlifyForm);
  });
}

async function submitNetlifyForm(event) {
  if (event.defaultPrevented) return;
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  const button = form.querySelector("button[type='submit']");
  const originalLabel = button?.textContent || "";
  const successMessage = form.dataset.successMessage || "Thanks. Your message has been received.";

  if (status) status.textContent = "Sending...";
  if (button) {
    button.disabled = true;
    button.textContent = "Sending";
  }

  try {
    const formData = new FormData(form);
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    });
    if (!response.ok) throw new Error(`Form post failed with ${response.status}`);
    if (status) status.textContent = successMessage;
    if (form.dataset.clearBag === "true") {
      state.bag = [];
      saveBag();
      renderBag();
    }
    form.reset();
    if (form.dataset.redirect) window.location.href = form.dataset.redirect;
  } catch (error) {
    console.warn(error);
    if (status) status.textContent = "The form could not send in this browser session. Opening the standard form submission.";
    HTMLFormElement.prototype.submit.call(form);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

function findProduct(productId) {
  return state.data?.products.find((product) => product.id === productId);
}

function getSubtotal() {
  return state.bag.reduce((sum, item) => {
    const product = findProduct(item.productId);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function getCartSummary() {
  return state.bag.map((item) => {
    const product = findProduct(item.productId);
    return product ? `${item.qty} x ${product.brand} ${product.title} (Colour: ${item.color}, Size: ${item.size})` : "";
  }).filter(Boolean).join("; ");
}

function loadBag() {
  try {
    return JSON.parse(localStorage.getItem("kalmCollectiveBag") || "[]");
  } catch {
    return [];
  }
}

function saveBag() {
  localStorage.setItem("kalmCollectiveBag", JSON.stringify(state.bag));
}

function formatPrice(value) {
  return currency.format(value).replace("ZAR", "R").replace(/\s/g, "");
}

function swatch(color) {
  const value = color.toLowerCase();
  if (value.includes("black")) return "#111111";
  if (value.includes("white") || value.includes("ivory")) return "#f8f5ef";
  if (value.includes("olive")) return "#596044";
  if (value.includes("grey") || value.includes("charcoal") || value.includes("smoke")) return "#5c5c5c";
  if (value.includes("wine") || value.includes("plum")) return "#5b254b";
  if (value.includes("blue")) return "#244f9e";
  if (value.includes("oat") || value.includes("natural") || value.includes("stone") || value.includes("taupe")) return "#c8b99f";
  if (value.includes("cork")) return "#b98d57";
  return "#d8d2c7";
}

function renderFooter() {
  const logo = state.data.meta.logo || "assets/branding/kalm-collective/kalm-collective-logo.png";
  const logoAlt = state.data.meta.logoAlt || "KALM Collective logo";
  return `
    <footer class="site-footer">
      <div class="footer-service">
        <span>Free delivery over R800</span>
        <span>30-day returns</span>
        <span>Secure payment choices</span>
        <span>Customer care weekdays</span>
      </div>
      <div class="footer-grid">
        <div>
          <img src="${transparentPixel}" data-src="${escapeHtml(logo)}" alt="${escapeAttribute(logoAlt)}" width="1563" height="1563" loading="lazy" decoding="async" fetchpriority="low">
          <p>Premium essentials for movement, outdoor routines and everyday living.</p>
        </div>
        <div>
          <h3>Shop</h3>
          <a href="#/shop?category=new-in">New In</a>
          <a href="#/shop?category=activewear">Activewear</a>
          <a href="#/shop?category=wellness">Wellness</a>
          <a href="#/shop?category=home">Home</a>
          <a href="#/shop?category=outdoor">Outdoor</a>
          <a href="#/shop?category=sale">Sale</a>
        </div>
        <div>
          <h3>Brands</h3>
          ${state.data.brands.map((brand) => `<a href="#/brand/${brand.id}">${escapeHtml(brand.name)}</a>`).join("")}
        </div>
        <div>
          <h3>Customer care</h3>
          <a href="#/contact">Help</a>
          <a href="#/policies#delivery">Delivery</a>
          <a href="#/policies#returns">Returns</a>
          <a href="#/policies">Privacy</a>
        </div>
        <div>
          <h3>Follow</h3>
          <p>@kalmcollective</p>
          <p>kalmcollective.co.za</p>
        </div>
      </div>
      <p class="copyright">© 2026 KALM Collective. All rights reserved.</p>
    </footer>
  `;
}

function renderEmptyState(message) {
  return `<div class="empty-state"><p>${escapeHtml(message)}</p></div>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
