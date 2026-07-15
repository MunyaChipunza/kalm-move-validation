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
  scrollPositions: new Map(),
  activeLightbox: null,
  waitlistSubmissions: new Set(),
  movePreviewPrices: new Map(),
  moveWishlist: loadMoveWishlist(),
  moveDemandEvents: loadMoveDemandEvents(),
  moveNotifySubmissions: new Set()
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
  { id: "new-in", name: "New In" },
  { id: "sets", name: "Sets" },
  { id: "leggings", name: "Leggings" },
  { id: "sports-bras", name: "Sports Bras" },
  { id: "shorts", name: "Shorts" },
  { id: "tops", name: "Tops" },
  { id: "bottoms", name: "Bottoms" },
  { id: "layers", name: "Jackets & Layers" },
  { id: "jumpsuits-rompers", name: "Jumpsuits & Rompers" },
  { id: "accessories", name: "Accessories" }
];
let deferredImageObserver = null;

init();

async function init() {
  bindChrome();
  try {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const [catalogueResponse, movePriceResponse] = await Promise.all([
      fetch("products.json", { cache: "no-cache" }),
      fetch("data/kalm-move-preview-prices.json", { cache: "no-cache" })
    ]);
    if (!catalogueResponse.ok || !movePriceResponse.ok) throw new Error("The KALM Move preview catalogue could not load.");
    state.data = await catalogueResponse.json();
    const movePriceEntries = await movePriceResponse.json();
    state.movePreviewPrices = new Map(movePriceEntries.map((entry) => [entry.productId, entry]));
    sanitizeMoveProductsFromBag();
    window.addEventListener("hashchange", renderRoute);
    window.addEventListener("popstate", renderRoute);
    renderRoute();
    renderBag();
  } catch (error) {
    document.documentElement.dataset.routeRendered = "true";
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
    const internalLink = event.target.closest("a[href]");
    if (internalLink && shouldHandleClientNavigation(event, internalLink)) {
      event.preventDefault();
      navigateTo(internalLink.getAttribute("href"));
      return;
    }

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
      const result = addToBag(productId, size, color);
      if (!result.ok) {
        if (error) error.textContent = result.message;
        return;
      }
      addButton.textContent = "Added";
      window.setTimeout(() => {
        const product = findProduct(productId);
        addButton.textContent = product?.ctaLabel || "Add to bag";
      }, 1200);
    }

    const moveWishlistButton = event.target.closest("[data-move-wishlist-save]");
    if (moveWishlistButton) {
      const scope = moveWishlistButton.closest("[data-product-scope]");
      saveMoveWishlistFromScope(scope, moveWishlistButton);
    }

    const moveCardWishlistButton = event.target.closest("[data-move-card-wishlist]");
    if (moveCardWishlistButton) {
      const product = findProduct(moveCardWishlistButton.getAttribute("data-move-card-wishlist"));
      if (product) {
        const colour = moveCardWishlistButton.getAttribute("data-display-colour") || getDefaultColor(product);
        const size = product.sizes?.[0] || "One size";
        saveMoveWishlist(product, colour, size, "card_default", moveCardWishlistButton);
      }
    }

    const moveNotifyToggle = event.target.closest("[data-move-notify-toggle]");
    if (moveNotifyToggle) {
      const scope = moveNotifyToggle.closest("[data-product-scope]");
      const form = scope?.querySelector("[data-move-notify-form]");
      if (form) {
        form.hidden = false;
        syncMoveInterestForm(form, scope);
        form.querySelector("input[type='email']")?.focus();
      }
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

    const galleryDot = event.target.closest("[data-gallery-index]");
    if (galleryDot) {
      const scope = galleryDot.closest("[data-product-scope]");
      updateGalleryByIndex(scope, Number(galleryDot.getAttribute("data-gallery-index")));
    }

    if (event.target.closest("[data-filter-toggle]")) {
      const shell = document.querySelector("[data-filter-shell]");
      setFilterSheetOpen(!shell?.classList.contains("filters-open"));
    }

    if (event.target.closest("[data-filter-close]")) {
      setFilterSheetOpen(false);
    }

    const lightboxOpen = event.target.closest("[data-lightbox-open]");
    if (lightboxOpen) {
      const scope = lightboxOpen.closest("[data-product-scope]");
      openLightbox(scope, getActiveGalleryIndex(scope));
    }

    if (event.target.closest("[data-lightbox-close]")) closeLightbox();

    const lightboxNav = event.target.closest("[data-lightbox-nav]");
    if (lightboxNav) {
      moveLightbox(Number(lightboxNav.getAttribute("data-lightbox-nav")));
    }
  });

  document.addEventListener("change", (event) => {
    const field = event.target.closest("[data-color-select], [data-size-select], [data-move-device-consent]");
    if (!field) return;
    const scope = field.closest("[data-product-scope]");
    const notifyForm = scope?.querySelector("[data-move-notify-form]");
    if (notifyForm) syncMoveInterestForm(notifyForm, scope);
    clearVariantError(scope);
    if (field.matches("[data-color-select]")) updateVariantImage(scope, field.value);
    updateProductAvailabilityState(scope);
    updateMoveWishlistControls(scope);
  });

  document.addEventListener("keydown", (event) => {
    if (state.activeLightbox) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") moveLightbox(1);
      if (event.key === "ArrowLeft") moveLightbox(-1);
      return;
    }
    const track = event.target.closest?.("[data-product-gallery-track]");
    if (!track) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateGalleryByIndex(track.closest("[data-product-scope]"), getActiveGalleryIndex(track.closest("[data-product-scope]")) + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateGalleryByIndex(track.closest("[data-product-scope]"), getActiveGalleryIndex(track.closest("[data-product-scope]")) - 1);
    }
  });

  searchPanel?.addEventListener("submit", (event) => event.preventDefault());
  siteSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const query = siteSearch.value.trim();
      if (query) navigateTo(`#/shop?search=${encodeURIComponent(query)}`);
      closeSearch();
    }
  });
}

function shouldHandleClientNavigation(event, link) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (link.target && link.target !== "_self") return false;
  if (link.hasAttribute("download")) return false;
  const href = link.getAttribute("href") || "";
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (href.startsWith("#/")) return true;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  return url.pathname !== window.location.pathname || url.search !== window.location.search || url.hash !== window.location.hash;
}

function navigateTo(href, { replace = false } = {}) {
  const target = href.startsWith("#/")
    ? `${window.location.pathname}${window.location.search}${href}`
    : new URL(href, window.location.href).pathname + new URL(href, window.location.href).search + new URL(href, window.location.href).hash;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (target === current) return;
  if (replace) window.history.replaceState({}, "", target);
  else window.history.pushState({}, "", target);
  renderRoute();
}

function renderRoute() {
  if (!state.data) return;
  if (state.currentRouteKey) state.scrollPositions.set(state.currentRouteKey, window.scrollY);
  const route = getRoute();
  const routeKey = window.location.hash || `${window.location.pathname}${window.location.search}` || "/";
  const isFirstRoute = !state.hasRenderedRoute;
  const isHomeRoute = route.path === "/" || route.path === "";
  state.hasRenderedRoute = true;
  state.currentRouteKey = routeKey;
  if (!isHomeRoute) clearHomeSectionSchedule();
  document.documentElement.dataset.routeRendered = "true";
  document.documentElement.dataset.initialRoute = isHomeRoute ? "home" : "non-home";
  closeBag();
  nav?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
  restoreRouteScroll(route, routeKey);

  if (isHomeRoute) return renderHome();
  if (route.path === "/shop") return renderShop(route.params);
  if (route.path === "/brands") return renderBrands();
  if (route.path.startsWith("/brand/")) {
    renderBrand(route.path.split("/").pop());
    scrollToAnchor(route.anchor);
    return;
  }
  if (route.path.startsWith("/product/")) return renderProduct(route.path.split("/").pop(), route.params);
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
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
    const params = new URLSearchParams(window.location.search);
    if (pathname.startsWith("/products/")) return { path: `/product/${pathname.split("/").pop()}`, params, anchor: "" };
    if (pathname.startsWith("/collections/")) return { path: "/shop", params: new URLSearchParams(`category=${encodeURIComponent(pathname.split("/").pop())}&${params}`), anchor: "" };
    return { path: pathname, params, anchor: "" };
  }
  const raw = hash || "/";
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
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ block: "start" });
    });
  });
}

function setDocumentMeta(title, description, path = window.location.pathname || "/") {
  document.title = title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && description) metaDescription.setAttribute("content", description);
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const canonical = `https://kalmcollective.co.za${canonicalPath}`;
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description || "");
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
}

function absoluteUrl(path = "/") {
  return path.startsWith("http") ? path : `https://kalmcollective.co.za/${path.replace(/^\//, "")}`;
}

function replaceStructuredData(items) {
  let node = document.querySelector("#kalm-structured-data");
  if (!node) {
    node = document.createElement("script");
    node.id = "kalm-structured-data";
    node.type = "application/ld+json";
    document.head.append(node);
  }
  node.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": items });
}

function setStructuredData({ type = "website", product = null, color = "", title = "", entries = [] } = {}) {
  const graph = [
    {
      "@type": "Organization",
      "@id": "https://kalmcollective.co.za/#organization",
      name: "KALM Collective",
      url: "https://kalmcollective.co.za/",
      logo: absoluteUrl("assets/branding/kalm-collective/kalm-collective-logo.png")
    },
    {
      "@type": "WebSite",
      "@id": "https://kalmcollective.co.za/#website",
      name: "KALM Collective",
      url: "https://kalmcollective.co.za/"
    }
  ];
  if (type === "product" && product) {
    const comingSoon = isComingSoonProduct(product);
    const status = getProductAvailability(product);
    const purchasable = !comingSoon && ["in_stock", "low_stock", "preorder"].includes(status) && typeof product.price === "number";
    const item = {
      "@type": "Product",
      "@id": absoluteUrl(productRoute(product)),
      name: product.title,
      description: product.metaDescription || product.description || product.longDescription || "",
      image: absoluteUrl(getVariantImage(product, color || getDefaultColor(product))),
      brand: { "@type": "Brand", name: product.brand }
    };
    if (purchasable) {
      item.offers = {
        "@type": "Offer",
        priceCurrency: "ZAR",
        price: product.price.toFixed(2),
        availability: `https://schema.org/${status === "preorder" ? "PreOrder" : "InStock"}`,
        url: absoluteUrl(productRoute(product, color || getDefaultColor(product)))
      };
    }
    graph.push(item);
  }
  if (type === "collection") {
    graph.push({
      "@type": "CollectionPage",
      "@id": absoluteUrl(window.location.pathname || "/shop"),
      name: title,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: entries.map(({ product, color }, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(productRoute(product, color))
        }))
      }
    });
  }
  replaceStructuredData(graph);
}

function productRoute(product, color = "") {
  const query = color ? `?colour=${encodeURIComponent(color)}` : "";
  return `/products/${encodeURIComponent(product.slug)}${query}`;
}

function collectionRoute(category) {
  return `/collections/${encodeURIComponent(category)}`;
}

function hashShopRoute(params = {}) {
  return `#/shop?${new URLSearchParams(params).toString()}`;
}

function merchandising() {
  return window.KALM_MERCHANDISING || { homepage: {}, collections: {}, campaigns: {} };
}

function getMerchandisingEntries(entries = []) {
  return entries.map((entry) => {
    const product = state.data.products.find((item) => item.id === entry.productId || item.slug === entry.productSlug);
    return product ? { ...entry, color: entry.color || entry.colour || entry.displayColour || "", product } : null;
  }).filter(Boolean);
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
  const { meta } = state.data;
  const config = merchandising();
  setDocumentMeta(
    "KALM Collective | KS Active Archive and KALM Move",
    "Shop the available KS Active Archive and explore KALM Move, launching soon.",
    "/"
  );
  setStructuredData({ type: "website" });
  const archiveProducts = getPublicProducts().filter((product) => product.brandId === "ks-active").slice(0, 4);
  const moveProducts = getPublicProducts().filter(isMoveLaunchingSoonProduct).slice(0, 4);
  const heroCampaign = config.campaigns?.homeHero || {};

  const hero = `
    <section class="hero-shell">
      <div class="hero-copy">
        <img class="hero-brand-logo" src="${escapeHtml(meta.logo)}" alt="${escapeAttribute(meta.logoAlt || "KALM Collective")}" width="1120" height="260" decoding="async">
        <h1>Movement, styled for what comes next.</h1>
        <p>Shop the available KS Active Archive, then explore the next KALM Move collection.</p>
        <div class="hero-actions">
          <a class="button primary" href="${collectionRoute("sale")}">Shop KS Active Archive</a>
          <a class="button secondary" href="/brand/kalm-move">Explore KALM Move</a>
        </div>
      </div>
      <a class="hero-media" href="${collectionRoute("activewear")}" aria-label="Shop KALM Move activewear">
        <picture>
          <source media="(max-width: 640px)" srcset="assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-mobile-perf-20260715.webp">
          <source media="(max-width: 1100px)" srcset="assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-tablet-perf-20260715.webp">
          <img src="assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-desktop-perf-20260715.webp" alt="${escapeAttribute(heroCampaign.alt || "KALM Move adults enjoying a relaxed movement moment")}" width="1600" height="900" fetchpriority="high" decoding="async">
        </picture>
      </a>
    </section>`;

  const sections = `
    ${renderProductRail("KS Active Archive", archiveProducts, collectionRoute("sale"), "Available now")}
    ${renderMoveLaunchTeaser(heroCampaign, moveProducts)}
    ${renderProductRail("KALM Move", moveProducts, "/brand/kalm-move", "Launching soon")}

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

function renderMoveLaunchTeaser(heroCampaign, moveProducts) {
  const image = heroCampaign.desktop || "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-desktop-perf-20260715.webp";
  return `
    <section class="move-launch-teaser">
      <div class="move-launch-copy">
        <p class="eyebrow">KALM MOVE</p>
        <p class="launching-soon-label">LAUNCHING SOON</p>
        <h2>Designed for movement. Made for what comes next.</h2>
        <p>A new chapter in movement is coming. Explore the collection, save your favourites and be the first to know when KALM Move arrives.</p>
        <div class="hero-actions">
          <a class="button primary" href="/brand/kalm-move">EXPLORE THE COLLECTION</a>
          ${moveProducts[0] ? `<a class="button secondary" href="${productRoute(moveProducts[0])}">SAVE TO WISHLIST</a>` : ""}
        </div>
      </div>
      <img src="${transparentPixel}" data-src="${escapeHtml(image)}" alt="${escapeAttribute(heroCampaign.alt || "KALM Move campaign")}" width="1600" height="900" loading="lazy" decoding="async" fetchpriority="low">
    </section>
  `;
}

function renderEditorialEdits(entries = []) {
  const edits = entries.map(({ product, color, title, copy }) => ({
    title,
    copy,
    image: getVariantImage(product, color),
    href: productRoute(product, color),
    product,
    color
  }));
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
          <a class="edit-card" href="${edit.href}" data-product-colour="${escapeAttribute(`${edit.product.id}|${edit.color}`)}">
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

function renderProductRail(title, entries, href, eyebrow = "KALM Collective") {
  if (!entries.length) return "";
  return `
    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <a class="text-link" href="${href}">View all</a>
      </div>
      <div class="product-grid rail-grid">
        ${entries.map((entry, index) => renderProductCard(entry.product || entry, { eager: index < 4, displayColour: entry.color || entry.colour || "" })).join("")}
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
  const size = params.get("size") || "all";
  const color = params.get("color") || "all";
  const availability = params.get("availability") || "all";
  const appliance = params.get("appliance") || "all";
  const sort = params.get("sort") || "featured";
  const search = params.get("search") || "";
  const filterState = { brand, category, audience, moveCategory, size, color, availability, appliance, search };
  const configuredEntries = getMerchandisingEntries(merchandising().collections?.[category]);
  const collectionFilterState = configuredEntries.length ? { ...filterState, category: "all" } : filterState;
  const filteredProducts = filterProducts(collectionFilterState);
  let displayEntries = configuredEntries.length
    ? configuredEntries.filter(({ product, color: displayColour }) => filteredProducts.some((item) => item.id === product.id) && (color === "all" || color === displayColour))
    : filteredProducts.map((product) => ({ product, color: getDefaultColor(product) }));
  if (sort !== "featured") {
    const byProduct = new Map(displayEntries.map((entry) => [entry.product.id, entry]));
    displayEntries = sortProducts(displayEntries.map((entry) => entry.product), sort).map((product) => byProduct.get(product.id)).filter(Boolean);
  }
  const heading = shopHeading({ brand, category, audience, moveCategory, search });
  const relevantProducts = filterProducts({ brand, category, audience, moveCategory, size: "all", color: "all", availability: "all", appliance, search });
  const moveAudience = brand === "kalm-move" ? audience : "all";
  const activeFilters = buildActiveFilters({ brand, category, audience, moveCategory, size, color, availability, appliance, sort, search });
  setDocumentMeta(
    `${heading} | KALM Collective`,
    "Shop KALM Collective essentials across activewear, outdoor cooking, wellness, home and archive activewear.",
    category !== "all" ? collectionRoute(category) : "/shop"
  );
  setStructuredData({ type: "collection", title: heading, entries: displayEntries });

  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Shop</p>
      <h1>${escapeHtml(heading)}</h1>
      <p>Curated essentials for movement, wellness, home and outdoor living.</p>
    </section>

    ${brand === "kalm-move" ? renderMoveShoppingHeader(moveAudience, moveCategory) : ""}

    <section class="shop-layout" data-filter-shell>
      <div class="mobile-filter-bar">
        <button class="button secondary" type="button" data-filter-toggle aria-expanded="false" aria-controls="shop-filters">Filter and sort</button>
        <span>${displayEntries.length} styles</span>
      </div>
      <aside id="shop-filters" class="filter-panel" aria-label="Shop filters">
        <div class="filter-panel-head">
          <strong>Filter</strong>
          <button type="button" data-filter-close aria-label="Close filters">Close</button>
        </div>
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
                ${getMoveCategoryOptions(audience).map((item) => `<option value="${item.id}" ${moveCategory === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
          ` : ""}
          ${brand === "kalm-outdoor" ? renderOutdoorApplianceFilter(appliance) : ""}
          ${renderFilterSelect("size", "Size", size, getAvailableSizes(relevantProducts), "All sizes")}
          ${renderFilterSelect("color", "Colour", color, getAvailableColors(relevantProducts), "All colours")}
          <label>Availability
            <select name="availability">
              <option value="all">All availability</option>
              <option value="in_stock" ${availability === "in_stock" ? "selected" : ""}>In stock</option>
              <option value="low_stock" ${availability === "low_stock" ? "selected" : ""}>Low stock</option>
              <option value="out_of_stock" ${availability === "out_of_stock" ? "selected" : ""}>Sold out</option>
              <option value="preorder" ${availability === "preorder" ? "selected" : ""}>Preorder</option>
              <option value="coming_soon" ${availability === "coming_soon" ? "selected" : ""}>Coming soon</option>
            </select>
          </label>
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
          <span>${displayEntries.length} styles</span>
          <a href="#/shop">Clear filters</a>
        </div>
        ${activeFilters.length ? `<div class="active-filter-row">${activeFilters.map((item) => `<a href="${item.href}">${escapeHtml(item.label)} x</a>`).join("")}</div>` : ""}
        <div class="product-grid">
          ${displayEntries.length ? displayEntries.map((entry, index) => renderProductCard(entry.product, { eager: index < 12, displayColour: entry.color })).join("") : renderEmptyState("No products match those filters.")}
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
      ${state.data.brands.map((brand) => {
        const content = `
          <div class="brand-content">
            <img class="brand-card-logo" src="${escapeHtml(getBrandLogo(brand))}" alt="${escapeAttribute(brand.logoAlt || `${brand.name} logo`)}" width="1254" height="1254" loading="eager" decoding="async">
            <p>${escapeHtml(brand.summary || brand.description || "Explore the collection.")}</p>
          </div>`;
        return `
          <article class="brand-card-large">
            <a href="#/brand/${brand.id}" aria-label="Shop ${escapeAttribute(brand.name)}">
              <img class="brand-image" src="${escapeHtml(brand.heroImage)}" alt="${escapeAttribute(brand.name)} lifestyle" width="900" height="660" loading="eager" decoding="async" fetchpriority="high">
              ${content}
            </a>
          </article>`;
      }).join("")}
    </section>

    ${renderFooter()}
  `;
  hydrateDeferredImages(app);
}

function renderBrand(brandId) {
  const brand = state.data.brands.find((item) => item.id === brandId);
  if (!brand) return renderNotFound();
  if (!["ks-active", "kalm-move"].includes(brand.id)) return renderNotFound();
  if (brand.id === "kalm-outdoor") return renderKalmOutdoorExperience(brand);
  if (brand.id === "kalm-move") return renderKalmMoveLaunchCollection(brand);
  const products = getPublicProducts().filter((product) => product.brandId === brand.id);
  setDocumentMeta(`${brand.name} | KALM Collective`, brand.summary);
  app.innerHTML = `
    <section class="brand-hero">
      <div>
        <img class="brand-hero-logo" src="${escapeHtml(getBrandLogo(brand))}" alt="${escapeAttribute(brand.logoAlt || brand.name)}" width="1254" height="1254">
        <h1 class="sr-only">${escapeHtml(brand.name)}</h1>
        <p>${escapeHtml(brand.summary)}</p>
        <a class="button primary" href="#/shop?brand=${brand.id}">Shop now</a>
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

function renderKalmMoveLaunchCollection(brand) {
  const products = getPublicProducts().filter(isMoveLaunchingSoonProduct);
  setDocumentMeta(
    "KALM Move | Launching Soon",
    "A new chapter in movement is coming. Explore KALM Move, save your favourites and be the first to know when it arrives.",
    "/brand/kalm-move"
  );
  setStructuredData({ type: "collection", title: "KALM Move | Launching Soon", entries: products.map((product) => ({ product, color: getDefaultColor(product) })) });
  app.innerHTML = `
    <section class="move-launch-hero">
      <div>
        <img class="brand-hero-logo" src="${escapeHtml(getBrandLogo(brand))}" alt="${escapeAttribute(brand.logoAlt || brand.name)}" width="1254" height="1254">
        <p class="launching-soon-label">LAUNCHING SOON</p>
        <h1>KALM MOVE</h1>
        <p>A new chapter in movement is coming.</p>
        <p>Explore the collection, save your favourites and be the first to know when KALM Move arrives.</p>
        <a class="button primary" href="#kalm-move-collection">EXPLORE THE COLLECTION</a>
      </div>
      <img src="assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-desktop-perf-20260715.webp" alt="KALM Move campaign" width="1600" height="900" decoding="async" fetchpriority="high">
    </section>

    ${renderKalmMoveSubcategories()}

    <section id="kalm-move-collection" class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">KALM Move</p>
          <h2>Explore the collection</h2>
        </div>
      </div>
      <div class="product-grid">
        ${products.map((product, index) => renderProductCard(product, { eager: index < 12 })).join("")}
      </div>
    </section>

    ${renderFooter()}
  `;
  hydrateDeferredImages(app);
}

function getOutdoorAnchorProducts() {
  const anchorIds = [
    "kalm-outdoor-ember-16-gas-pizza-oven",
    "kalm-outdoor-forge-2-portable-gas-griddle",
    "kalm-outdoor-ridge-4-stainless-gas-braai"
  ];
  return anchorIds.map((id) => findProduct(id)).filter((product) => product && isProductPublic(product));
}

function applianceName(applianceId) {
  return findProduct(applianceId)?.title || "Compatible appliance to be confirmed";
}

function renderKalmOutdoorExperience(brand) {
  const anchors = getOutdoorAnchorProducts();
  setDocumentMeta(
    "KALM Outdoor | Premium outdoor cooking appliances",
    "Discover KALM Outdoor appliances for considered cooking and open-air gatherings."
  );
  app.innerHTML = `
    <section class="outdoor-collection-intro">
      <img class="outdoor-collection-logo" src="${escapeHtml(getBrandLogo(brand))}" alt="${escapeAttribute(brand.logoAlt || brand.name)}" width="1254" height="1254">
      <div>
        <h1 class="sr-only">${escapeHtml(brand.name)}</h1>
        <p>Considered appliances for pizza nights, everyday grilling and open-air hosting.</p>
      </div>
    </section>

    <section class="section-block outdoor-appliance-collection" aria-labelledby="outdoor-appliances-title">
      <div class="section-head">
        <div>
          <p class="eyebrow">Outdoor cooking</p>
          <h2 id="outdoor-appliances-title">Appliances</h2>
        </div>
      </div>
      <div class="product-grid">
        ${anchors.map((product, index) => renderProductCard(product, { eager: index < 3 })).join("")}
      </div>
    </section>

    ${renderFooter()}
  `;
  hydrateDeferredImages(app);
}

function getOutdoorWaitlistChoices() {
  return [
    ...(state.data.outdoorBundles || []).map((bundle) => ({ label: bundle.title, applianceId: bundle.compatibleAppliance || "" }))
  ];
}

function renderOutdoorWaitlistForm({ interest = "", applianceId = "", source = "outdoor-brand-page" } = {}) {
  const choices = getOutdoorWaitlistChoices();
  const anchors = getOutdoorAnchorProducts();
  const selectedInterest = interest || choices[0]?.label || "";
  const selectedAppliance = applianceId || choices.find((choice) => choice.label === selectedInterest)?.applianceId || anchors[0]?.id || "";
  const fieldId = `outdoor-waitlist-${source.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
  const interestField = interest
    ? `<input type="hidden" name="accessory_or_bundle" value="${escapeAttribute(selectedInterest)}"><p class="waitlist-interest">Interest: <strong>${escapeHtml(selectedInterest)}</strong></p>`
    : `<label for="${fieldId}-interest">Accessory or bundle<select id="${fieldId}-interest" name="accessory_or_bundle" data-waitlist-interest-select required>${choices.map((choice) => `<option value="${escapeAttribute(choice.label)}" data-appliance-id="${escapeAttribute(choice.applianceId)}" ${choice.label === selectedInterest ? "selected" : ""}>${escapeHtml(choice.label)}</option>`).join("")}</select></label>`;
  const applianceField = applianceId
    ? `<input type="hidden" name="compatible_appliance" value="${escapeAttribute(applianceName(selectedAppliance))}"><input type="hidden" name="compatible_appliance_id" value="${escapeAttribute(selectedAppliance)}"><p class="waitlist-interest">Compatible appliance: <strong>${escapeHtml(applianceName(selectedAppliance))}</strong></p>`
    : `<label for="${fieldId}-appliance">Compatible appliance<select id="${fieldId}-appliance" name="compatible_appliance" data-waitlist-appliance-select required>${anchors.map((anchor) => `<option value="${escapeAttribute(anchor.title)}" data-appliance-id="${escapeAttribute(anchor.id)}" ${anchor.id === selectedAppliance ? "selected" : ""}>${escapeHtml(anchor.title)}</option>`).join("")}</select></label>`;
  return `
    <form class="outdoor-waitlist-form" name="kalm-outdoor-accessory-waitlist" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-netlify-ajax data-waitlist-form data-success-message="You are on the KALM Outdoor waitlist. We will share launch and compatibility updates when they are confirmed.">
      <input type="hidden" name="form-name" value="kalm-outdoor-accessory-waitlist">
      <input type="hidden" name="bot-field">
      <input type="hidden" name="source" value="${escapeAttribute(source)}">
      <div class="form-grid two">
        <label for="${fieldId}-name">Name<input id="${fieldId}-name" name="name" autocomplete="name" required></label>
        <label for="${fieldId}-email">Email<input id="${fieldId}-email" name="email" type="email" autocomplete="email" required></label>
        <label for="${fieldId}-phone">Phone <span class="optional">(optional)</span><input id="${fieldId}-phone" name="phone" type="tel" autocomplete="tel"></label>
        ${interestField}
        ${applianceField}
      </div>
      <fieldset class="waitlist-ownership">
        <legend>Do you already own the compatible appliance?</legend>
        <label><input type="radio" name="owns_compatible_appliance" value="yes" required> Yes</label>
        <label><input type="radio" name="owns_compatible_appliance" value="no"> No</label>
        <label><input type="radio" name="owns_compatible_appliance" value="planning"> I am planning my setup</label>
      </fieldset>
      <label class="consent"><input type="checkbox" name="consent" value="yes" required> <span>I consent to KALM Collective using my details for KALM Outdoor launch and compatibility updates.</span></label>
      <p class="form-status" role="status" aria-live="polite"></p>
      <button class="button primary full" type="submit">Join waitlist</button>
    </form>
  `;
}

function renderComingSoonMedia(className = "") {
  return `
    <div class="coming-soon-media ${className}" aria-hidden="true">
      <span>Coming soon</span>
    </div>
  `;
}

function renderKalmMoveSubcategories() {
  const women = getPublicProducts().find((product) => product.brandId === "kalm-move" && product.audience === "women");
  const men = getPublicProducts().find((product) => product.brandId === "kalm-move" && product.audience === "men");
  const links = [
    ...getMoveCategoryOptions("women").map((category) => ({ ...category, audience: "women" })),
    ...getMoveCategoryOptions("men").map((category) => ({ ...category, audience: "men" }))
  ];
  return `
    <section class="section-block move-subcategories">
      <div class="section-head">
        <div>
          <p class="eyebrow">KALM Move</p>
          <h2>Choose your edit</h2>
          <p class="section-copy">Purposeful pieces for the way you train, recover and move through the day.</p>
        </div>
      </div>
      <div class="move-audience-grid">
        <a class="move-audience-card visual" href="#/shop?brand=kalm-move&audience=women">
          <img src="${escapeHtml(women?.image || "assets/images/kalm-move-brand-tile.webp")}" alt="KALM Move women edit" width="900" height="1350" loading="lazy" decoding="async">
          <span>Women</span>
          <p>Studio layers, active sets and everyday movement accessories.</p>
        </a>
        <a class="move-audience-card visual" href="#/shop?brand=kalm-move&audience=men">
          <img src="${escapeHtml(men?.image || "assets/images/kalm-move-brand-tile.webp")}" alt="KALM Move men edit" width="1200" height="1500" loading="lazy" decoding="async">
          <span>Men</span>
          <p>Clean performance staples across shorts, tops, layers and accessories.</p>
        </a>
      </div>
      <div class="move-category-links" aria-label="KALM Move categories">
        <a href="#/shop?brand=kalm-move&category=new-in">New In</a>
        <a href="#/shop?brand=kalm-move">Shop All</a>
        ${links.map((category) => `
          <a href="#/shop?brand=kalm-move&audience=${category.audience}&moveCategory=${category.id}">${escapeHtml(moveAudienceName(category.audience))} ${escapeHtml(category.name)}</a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderProduct(slug, params = new URLSearchParams()) {
  const product = state.data.products.find((item) => item.slug === slug);
  if (!product || !isProductPublic(product)) return renderNotFound();
  if (isMoveLaunchingSoonProduct(product)) return renderMoveLaunchingSoonProduct(product, params);
  const comingSoon = isComingSoonProduct(product);
  const comingSoonMessage = product.comingSoonMessage || product.conceptImageDisclosure || product.photographyStatus || "Coming soon.";
  const requestedColor = params.get("colour") || params.get("color") || "";
  const defaultColor = product.colors.includes(requestedColor) && !isColorUnavailable(product, requestedColor)
    ? requestedColor
    : getDefaultColor(product);
  const defaultImages = defaultColor ? getVariantImages(product, defaultColor) : getProductGalleryImages(product);
  const productAvailability = getProductAvailability(product);
  const manualRelated = (product.relatedProducts || [])
    .map((productId) => findProduct(productId))
    .filter((item) => item && isProductPublic(item));
  const related = (manualRelated.length ? manualRelated : state.data.products
    .filter((item) => item.brandId === product.brandId && item.id !== product.id && isProductPublic(item)))
    .slice(0, 4);
  const details = product.features || product.detailBullets || [];
  setDocumentMeta(
    product.metaTitle || `${product.title} | ${product.brand}`,
    product.metaDescription || product.description,
    productRoute(product)
  );
  setStructuredData({ type: "product", product, color: defaultColor });

  app.innerHTML = `
    <section class="product-detail" data-product-scope data-product-id="${product.id}">
      ${comingSoon && !defaultImages.length ? renderComingSoonMedia("product-coming-soon-media") : renderProductGallery(product, defaultImages)}
      <div class="product-info">
        <a class="eyebrow" href="#/brand/${product.brandId}">${escapeHtml(product.brand)}</a>
        <h1>${escapeHtml(product.title)}</h1>
        ${comingSoon ? `
          <div class="coming-soon-detail-status">
            <strong>Coming soon</strong>
            <p>${escapeHtml(comingSoonMessage)}</p>
            ${product.compatibilityNote ? `<p>${escapeHtml(product.compatibilityNote)}</p>` : ""}
            ${product.brandId === "kalm-move" && product.colors.length ? `
              <label>Colour
                <select data-color-select>
                  ${product.colors.map((color) => `<option value="${escapeAttribute(color)}" ${color === defaultColor ? "selected" : ""}>${escapeHtml(color)}</option>`).join("")}
                </select>
              </label>
            ` : ""}
          </div>
        ` : `<div class="price-line">${renderPrice(product)}</div>`}

        ${comingSoon && product.comingSoonCallToAction !== false ? renderOutdoorWaitlistForm({
          interest: product.title,
          applianceId: product.compatibleAppliances?.[0] || "",
          source: `outdoor-product-${product.slug}`
        }) : !comingSoon ? `
          <div class="selector-row">
            <label>Colour
              <select data-color-select>
                ${product.colors.map((color) => `<option value="${escapeAttribute(color)}" ${color === defaultColor ? "selected" : ""} ${isColorUnavailable(product, color) ? "disabled" : ""}>${escapeHtml(color)}${isColorUnavailable(product, color) ? " - sold out" : ""}</option>`).join("")}
              </select>
            </label>
            <label>Size
              <select data-size-select>
                <option value="">Choose size</option>
                ${renderSizeOptions(product, defaultColor)}
              </select>
            </label>
          </div>
          ${renderVariantPreviews(product)}
          <p class="variant-error" data-variant-error role="status" aria-live="polite"></p>
          <button class="button primary full" type="button" data-add-to-bag="${product.id}" ${productAvailability === "out_of_stock" || productAvailability === "discontinued" ? "disabled" : ""}>${escapeHtml(productAvailability === "out_of_stock" || productAvailability === "discontinued" ? "Sold out" : product.ctaLabel)}</button>
          <p class="stock-line" data-stock-status>${escapeHtml(getStockMessage(product, defaultColor))}</p>
        ` : ""}
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
  const scope = app.querySelector("[data-product-scope]");
  bindProductGallery(scope);
  if (!comingSoon) updateProductAvailabilityState(scope);
}

function renderMoveLaunchingSoonProduct(product, params = new URLSearchParams()) {
  const requestedColor = params.get("colour") || params.get("color") || "";
  const defaultColor = product.colors.includes(requestedColor) ? requestedColor : getDefaultColor(product);
  const defaultImages = getVariantImages(product, defaultColor);
  const details = product.features || product.detailBullets || [];
  const related = getPublicProducts().filter((item) => isMoveLaunchingSoonProduct(item) && item.id !== product.id).slice(0, 4);
  setDocumentMeta(
    `${product.title} | KALM Move Launching Soon`,
    product.metaDescription || product.description,
    productRoute(product, defaultColor)
  );
  setStructuredData({ type: "product", product, color: defaultColor });

  app.innerHTML = `
    <section class="product-detail move-launch-product" data-product-scope data-product-id="${product.id}">
      ${renderProductGallery(product, defaultImages)}
      <div class="product-info">
        <a class="eyebrow" href="/brand/kalm-move">KALM Move</a>
        <p class="launching-soon-label">LAUNCHING SOON</p>
        <h1>${escapeHtml(product.title)}</h1>
        <div class="price-line move-launch-price"><strong>${formatPrice(getDisplayPrice(product))}</strong></div>
        <div class="selector-row move-launch-selectors">
          <label>Colour
            <select data-color-select>
              ${product.colors.map((color) => `<option value="${escapeAttribute(color)}" ${color === defaultColor ? "selected" : ""}>${escapeHtml(color)}</option>`).join("")}
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
        <div class="move-launch-actions">
          <button class="button secondary full wishlist-button" type="button" data-move-wishlist-save aria-pressed="false">SAVE TO WISHLIST</button>
          <button class="button primary full" type="button" data-move-notify-toggle>GET LAUNCH ACCESS</button>
        </div>
        ${renderMoveNotifyForm(product)}
        <p>${escapeHtml(product.longDescription || product.description)}</p>
        <div class="accordion-list">
          <details open>
            <summary>Product details</summary>
            <ul>${details.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </details>
          <details>
            <summary>Fit and fabric</summary>
            <p>${escapeHtml(product.fitNotes || "Details will be shared with the launch collection.")}</p>
            <p>${escapeHtml(product.fabric || "")}</p>
          </details>
          <details>
            <summary>Care</summary>
            <p>${escapeHtml(product.care || "Care guidance will be included with the collection.")}</p>
          </details>
        </div>
      </div>
    </section>
    ${renderProductRail("More from KALM Move", related, "/brand/kalm-move", "Launching soon")}
    ${renderFooter()}
  `;
  bindNetlifyForms(app);
  hydrateDeferredImages(app);
  const scope = app.querySelector("[data-product-scope]");
  bindProductGallery(scope);
  updateMoveWishlistControls(scope);
  recordMoveProductView(product, defaultColor);
}

function renderMoveNotifyForm(product) {
  return `
    <form class="move-notify-form" name="kalm-move-launch-interest" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-netlify-ajax data-move-notify-form hidden>
      <input type="hidden" name="form-name" value="kalm-move-launch-interest">
      <input type="hidden" name="bot-field">
      <input type="hidden" name="event_id">
      <input type="hidden" name="event_type" value="notify_registration">
      <input type="hidden" name="timestamp">
      <input type="hidden" name="anonymous_session_id">
      <input type="hidden" name="customer_id">
      <input type="hidden" name="product_id" value="${escapeAttribute(product.id)}">
      <input type="hidden" name="product_name" value="${escapeAttribute(product.title)}">
      <input type="hidden" name="displayed_price" value="${escapeAttribute(formatPrice(getDisplayPrice(product)))}">
      <input type="hidden" name="preferred_colour">
      <input type="hidden" name="preferred_size">
      <input type="hidden" name="source_page" value="${escapeAttribute(productRoute(product))}">
      <input type="hidden" name="device_category">
      <input type="hidden" name="selection_source" value="product_page">
      <p class="form-intro">Get launch access</p>
      <label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label class="consent"><input type="checkbox" name="notification_consent" value="yes" required> <span>I agree to receive KALM Move launch updates for this product.</span></label>
      <label class="consent"><input type="checkbox" name="device_category_consent" value="yes" data-move-device-consent> <span>Allow KALM Collective to include my device category in anonymous launch-interest reporting.</span></label>
      <label class="consent"><input type="checkbox" name="marketing_consent" value="yes"> <span>I would also like KALM Collective news and offers.</span></label>
      <p class="form-status" role="status" aria-live="polite"></p>
      <button class="button primary full" type="submit">NOTIFY ME</button>
    </form>
  `;
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

function getPublicProducts() {
  return (state.data?.products || []).filter(isProductPublic);
}

function getMovePreviewEntry(product) {
  return product?.brandId === "kalm-move" ? state.movePreviewPrices.get(product.id) || null : null;
}

function isMoveLaunchingSoonProduct(product) {
  return getMovePreviewEntry(product)?.status === "launching-soon";
}

function isMovePreviewExcluded(product) {
  return product?.brandId === "kalm-move" && Boolean(getMovePreviewEntry(product)) && !isMoveLaunchingSoonProduct(product);
}

function getDisplayPrice(product) {
  const preview = getMovePreviewEntry(product);
  return isMoveLaunchingSoonProduct(product) && Number.isFinite(preview?.price) ? preview.price : product?.price;
}

function productMatchesAudience(product, audience = "all") {
  return audience === "all"
    || product?.audience === audience
    || (Array.isArray(product?.audiences) && product.audiences.includes(audience));
}

function isComingSoonProduct(product) {
  return isMoveLaunchingSoonProduct(product) || Boolean(product?.comingSoon) || product?.availability === "coming_soon";
}

function isProductPublic(product) {
  if (!product) return false;
  if (!["ks-active", "kalm-move"].includes(product.brandId)) return false;
  if (isMovePreviewExcluded(product)) return false;
  const status = product.publicationStatus || "published";
  const visibility = product.visibility || "visible";
  return status === "published" && visibility === "visible";
}

function getDefaultColor(product) {
  return (product?.colors || []).find((color) => !isColorUnavailable(product, color)) || product?.colors?.[0] || "";
}

function normalizeGalleryImages(images, product) {
  const normalized = normalizeImageList(images);
  return normalized.length ? normalized : [product?.image].filter(Boolean);
}

function getMoveCategoryOptions(audience = "all") {
  const categories = new Set();
  getPublicProducts()
    .filter((product) => product.brandId === "kalm-move")
    .filter((product) => productMatchesAudience(product, audience))
    .forEach((product) => categories.add(getMoveCategoryId(product)));
  return moveCategories.filter((category) => categories.has(category.id));
}

function getMoveCategoryId(product) {
  const tags = product?.tags || [];
  if (tags.includes("new-in")) return product.moveCategory || "new-in";
  const text = [product?.moveCategory, product?.type, product?.title, ...tags].join(" ").toLowerCase();
  if (text.includes("bottle") || text.includes("bag") || text.includes("cap") || text.includes("sock") || text.includes("accessor")) return "accessories";
  if (text.includes("romper") || text.includes("unitard") || text.includes("jumpsuit")) return "jumpsuits-rompers";
  if (text.includes("sports bra") || text.includes("bra")) return "sports-bras";
  if (text.includes("legging")) return "leggings";
  if (text.includes("short") || text.includes("skort")) return "shorts";
  if (text.includes("hoodie") || text.includes("jacket") || text.includes("layer")) return "layers";
  if (text.includes("pant") || text.includes("jogger") || text.includes("bottom")) return "bottoms";
  if (text.includes("set")) return "sets";
  if (text.includes("tee") || text.includes("tank") || text.includes("top") || text.includes("crop")) return "tops";
  return product?.moveCategory || "accessories";
}

function renderMoveShoppingHeader(audience, moveCategory) {
  const base = "#/shop?brand=kalm-move";
  const activeAudience = audience === "men" || audience === "women" ? audience : "all";
  const categoryAudience = activeAudience === "all" ? "women" : activeAudience;
  const categories = getMoveCategoryOptions(categoryAudience);
  return `
    <section class="move-shop-header">
      <div>
        <p class="eyebrow">KALM Move</p>
        <h2>${activeAudience === "all" ? "Shop movement essentials" : `Shop ${moveAudienceName(activeAudience)}`}</h2>
        <p>Choose women or men, then narrow the edit with real catalogue categories.</p>
      </div>
      <div class="audience-tabs" aria-label="KALM Move audience">
        <a href="${base}" ${activeAudience === "all" ? 'aria-current="true"' : ""}>All</a>
        ${moveAudiences.map((item) => `<a href="${base}&audience=${item.id}" ${activeAudience === item.id ? 'aria-current="true"' : ""}>${escapeHtml(item.name)}</a>`).join("")}
      </div>
      ${categories.length ? `
        <div class="move-category-links compact" aria-label="KALM Move categories">
          ${categories.map((category) => `<a href="${base}&audience=${categoryAudience}&moveCategory=${category.id}" ${moveCategory === category.id ? 'aria-current="true"' : ""}>${escapeHtml(category.name)}</a>`).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function renderOutdoorApplianceFilter(appliance) {
  const anchors = getOutdoorAnchorProducts();
  return `
    <label>Compatible appliance
      <select name="appliance">
        <option value="all">All Outdoor products</option>
        ${anchors.map((anchor) => `<option value="${escapeAttribute(anchor.id)}" ${appliance === anchor.id ? "selected" : ""}>${escapeHtml(anchor.title)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderFilterSelect(name, label, selected, options, emptyLabel) {
  if (!options.length) return "";
  return `
    <label>${escapeHtml(label)}
      <select name="${escapeAttribute(name)}">
        <option value="all">${escapeHtml(emptyLabel)}</option>
        ${options.map((option) => `<option value="${escapeAttribute(option)}" ${selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function getAvailableSizes(products) {
  return [...new Set(products.flatMap((product) => product.sizes || []))].filter(Boolean);
}

function getAvailableColors(products) {
  return [...new Set(products.flatMap((product) => product.colors || []))].filter(Boolean);
}

function buildActiveFilters(filterState) {
  const labels = {
    brand: (value) => state.data.brands.find((item) => item.id === value)?.name || value,
    category: (value) => state.data.categories.find((item) => item.id === value)?.name || value,
    audience: moveAudienceName,
    moveCategory: moveCategoryName,
    appliance: applianceName,
    size: (value) => `Size ${value}`,
    color: (value) => value,
    availability: (value) => value.replaceAll("_", " "),
    sort: (value) => `Sort ${value.replace("-", " ")}`,
    search: (value) => `Search ${value}`
  };
  return Object.entries(filterState)
    .filter(([key, value]) => value && value !== "all" && value !== "featured" && !(key === "search" && !String(value).trim()))
    .map(([key, value]) => {
      const params = new URLSearchParams();
      Object.entries(filterState).forEach(([entryKey, entryValue]) => {
        if (entryKey === key) return;
        if (entryValue && entryValue !== "all" && entryValue !== "featured") params.set(entryKey, entryValue);
      });
      return {
        label: labels[key]?.(value) || value,
        href: `#/shop${params.toString() ? "?" + params.toString() : ""}`
      };
    });
}

function getProductAvailability(product) {
  if (!isProductPublic(product)) return "discontinued";
  if (isComingSoonProduct(product)) return "coming_soon";
  const variants = (product.variants || []).filter((variant) => variant.enabled !== false);
  if (!variants.length) return product.availability || "in_stock";
  const availableVariants = variants.filter(isInventoryEntryAvailable);
  if (!availableVariants.length) return "out_of_stock";
  if (availableVariants.some((variant) => variant.availability === "in_stock")) return "in_stock";
  if (availableVariants.some((variant) => variant.availability === "preorder")) return "preorder";
  if (availableVariants.some((variant) => variant.availability === "low_stock")) return "low_stock";
  return product.availability || "in_stock";
}

function getStockMessage(product, color = "", size = "") {
  const variant = color || size ? findVariant(product, color, size) : null;
  const availability = variant?.availability || getProductAvailability(product);
  if (availability === "coming_soon") return "Coming soon";
  const quantity = variant?.quantity;
  if (availability === "out_of_stock" || availability === "discontinued") return "Sold out";
  if (availability === "preorder") return "Preorder interest";
  if (availability === "low_stock" || (Number.isFinite(quantity) && quantity <= (product.lowStockThreshold || 3))) return "Low stock";
  return product.stockLabel || "In stock";
}

function findVariant(product, color = "", size = "") {
  const variants = product?.variants || [];
  if (!variants.length) return null;
  return variants.find((variant) => {
    const colorMatch = !color || variant.colour === color || variant.color === color;
    const sizeMatch = !size || variant.size === size;
    return variant.enabled !== false && colorMatch && sizeMatch;
  }) || null;
}

function isInventoryEntryAvailable(variant) {
  if (!variant || variant.enabled === false) return false;
  if (["out_of_stock", "discontinued"].includes(variant.availability)) return false;
  if (Number.isFinite(variant.quantity) && variant.quantity <= 0) return false;
  return true;
}

function isVariantAvailable(product, color, size) {
  if (isComingSoonProduct(product)) return false;
  const variants = product?.variants || [];
  if (!variants.length) return !["out_of_stock", "discontinued"].includes(product?.availability || "in_stock");
  const variant = findVariant(product, color, size);
  return isInventoryEntryAvailable(variant);
}

function isColorUnavailable(product, color) {
  const variants = product?.variants || [];
  if (!variants.length) return false;
  const colorVariants = variants.filter((variant) => variant.enabled !== false && (variant.colour === color || variant.color === color));
  return Boolean(colorVariants.length) && colorVariants.every((variant) => !isInventoryEntryAvailable(variant));
}

function renderSizeOptions(product, color = "") {
  return (product?.sizes || []).map((size) => {
    const disabled = !isVariantAvailable(product, color || getDefaultColor(product), size);
    return `<option value="${escapeAttribute(size)}" ${disabled ? "disabled" : ""}>${escapeHtml(size)}${disabled ? " - sold out" : ""}</option>`;
  }).join("");
}

function updateProductAvailabilityState(scope) {
  const product = findProduct(scope?.getAttribute("data-product-id"));
  if (!product || !scope) return;
  const color = scope.querySelector("[data-color-select]")?.value || getDefaultColor(product);
  const size = scope.querySelector("[data-size-select]")?.value || "";
  const sizeSelect = scope.querySelector("[data-size-select]");
  if (isMoveLaunchingSoonProduct(product)) {
    if (sizeSelect && document.activeElement !== sizeSelect) {
      const current = sizeSelect.value;
      sizeSelect.innerHTML = `<option value="">Choose size</option>${product.sizes.map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("")}`;
      if ([...sizeSelect.options].some((option) => option.value === current)) sizeSelect.value = current;
    }
    scope.querySelector("[data-stock-status]")?.replaceChildren();
    return;
  }
  if (sizeSelect && document.activeElement !== sizeSelect) {
    const current = sizeSelect.value;
    sizeSelect.innerHTML = `<option value="">Choose size</option>${renderSizeOptions(product, color)}`;
    if ([...sizeSelect.options].some((option) => option.value === current && !option.disabled)) sizeSelect.value = current;
  }
  const button = scope.querySelector("[data-add-to-bag]");
  const status = scope.querySelector("[data-stock-status]");
  const available = size ? isVariantAvailable(product, color, size) : !["out_of_stock", "discontinued"].includes(getProductAvailability(product));
  if (button) {
    button.disabled = !available;
    button.textContent = available ? product.ctaLabel : "Sold out";
  }
  if (status) status.textContent = getStockMessage(product, color, size);
}

function renderCategoryTile(entry) {
  const product = entry.product || entry;
  const color = entry.color || entry.colour || getDefaultColor(product);
  const title = entry.title || product.category || product.title;
  return `
    <a class="category-tile" href="${productRoute(product, color)}" data-product-colour="${escapeAttribute(`${product.id}|${color}`)}">
      <img src="${transparentPixel}" data-src="${escapeHtml(getVariantImage(product, color))}" alt="${escapeAttribute(`${title}: ${product.title} in ${color}`)}" width="640" height="640" loading="lazy" decoding="async" fetchpriority="low">
      <span><strong>${escapeHtml(title)}</strong><small>Shop ${escapeHtml(product.title)}</small></span>
    </a>
  `;
}

function renderVariantPreviews(product) {
  if (!product.colors.length) return "";
  return `
    <div class="variant-previews" aria-label="Colour previews">
      ${product.colors.map((color) => `
        <button type="button" data-variant-preview="${escapeAttribute(color)}" aria-label="Preview ${escapeAttribute(color)}">
          <img src="${escapeHtml(getVariantImage(product, color))}" alt="${escapeAttribute(product.title)} in ${escapeAttribute(color)}" width="116" height="136" decoding="async">
        </button>
      `).join("")}
    </div>
  `;
}

function renderProductGallery(product, inputImages = getProductGalleryImages(product)) {
  const images = normalizeGalleryImages(inputImages, product);
  const count = images.length || 1;
  return `
    <div class="product-gallery" data-product-gallery data-gallery-current="0" ${mediaPresentationStyle(product, "gallery")}>
      <div class="product-gallery-frame">
        <div class="gallery-track" data-product-gallery-track tabindex="0" aria-label="Swipe product images for ${escapeAttribute(product.title)}">
          ${renderGallerySlides(product, images)}
        </div>
        ${count > 1 ? `<button class="gallery-open" type="button" data-lightbox-open aria-label="Open image viewer">Expand</button>` : ""}
        ${count > 1 ? `<span class="gallery-count" data-gallery-count>1 / ${count}</span>` : ""}
      </div>
      ${count > 1 ? `<div class="gallery-dots" data-gallery-dots>${renderGalleryDots(images)}</div>` : ""}
      ${count > 1 ? `
        <div class="gallery-thumbs" data-product-gallery-thumbs aria-label="Product images">
          ${renderGalleryThumbs(product, images)}
        </div>
      ` : ""}
    </div>
  `;
}

function renderGallerySlides(product, images) {
  return images.map((image, index) => `
    <figure class="gallery-slide" data-gallery-slide data-gallery-image="${escapeAttribute(image)}" aria-label="Image ${index + 1} of ${images.length}">
      <img ${index === 0 ? `src="${escapeHtml(image)}" fetchpriority="high"` : `src="${escapeHtml(image)}" loading="lazy" fetchpriority="low"`} alt="${escapeAttribute(product.title)} image ${index + 1}" width="1200" height="1500" decoding="async" data-product-image>
    </figure>
  `).join("");
}

function renderGalleryDots(images) {
  return images.map((_, index) => `
    <button type="button" data-gallery-index="${index}" aria-label="Show image ${index + 1}" ${index === 0 ? 'aria-current="true"' : ""}></button>
  `).join("");
}

function renderGalleryThumbs(product, images) {
  return images.map((image, index) => `
    <button type="button" data-gallery-image="${escapeAttribute(image)}" aria-label="View image ${index + 1} for ${escapeAttribute(product.title)}" ${index === 0 ? 'aria-current="true"' : ""}>
      <img src="${escapeHtml(image)}" alt="${escapeAttribute(product.title)} image ${index + 1}" width="116" height="136" decoding="async">
    </button>
  `).join("");
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
  if (isMoveLaunchingSoonProduct(product)) return renderMoveLaunchingSoonCard(product, options);
  const comingSoon = isComingSoonProduct(product);
  const availability = getProductAvailability(product);
  const isUnavailable = availability === "out_of_stock" || availability === "discontinued";
  const defaultColour = options.displayColour && product.colors.includes(options.displayColour)
    ? options.displayColour
    : getDefaultColor(product);
  const productHref = productRoute(product, defaultColour);
  const displayImage = getVariantImage(product, defaultColour) || product.image;
  const imageMarkup = options.eager
    ? `src="${escapeHtml(displayImage)}" decoding="async"`
    : `src="${escapeHtml(displayImage)}" loading="lazy" decoding="async" fetchpriority="low"`;
  const responsiveAttributes = renderResponsiveCardAttributes(product, defaultColour);
  return `
    <article class="product-card" data-product-scope data-product-id="${product.id}" data-display-colour="${escapeAttribute(defaultColour)}">
      <a class="product-media" href="${productHref}" aria-label="${escapeAttribute(`${product.title} in ${defaultColour}`)}" data-card-colour="${escapeAttribute(defaultColour)}" ${mediaPresentationStyle(product, "card")}>
        ${isUnavailable ? `<span class="product-badge sold-out">Sold out</span>` : product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
        ${!product.image ? renderComingSoonMedia("card-coming-soon-media") : `<img ${imageMarkup} ${responsiveAttributes} alt="${escapeAttribute(product.title)}" width="640" height="800" data-product-image>`}
      </a>
      <div class="product-card-body">
        <a class="product-brand" href="#/brand/${product.brandId}">${escapeHtml(product.brand)}</a>
        <h3><a href="${productHref}">${escapeHtml(product.title)}</a></h3>
        ${comingSoon ? `
          <p class="card-photo-status">${escapeHtml(product.comingSoonMessage || product.conceptImageDisclosure || product.photographyStatus || "Coming soon.")}</p>
          ${product.compatibleAppliances?.[0] ? `<p class="card-compatibility">${escapeHtml(applianceName(product.compatibleAppliances[0]))}</p>` : ""}
          ${product.comingSoonCallToAction !== false ? `<a class="button secondary full card-view-link" href="${productHref}">Join waitlist</a>` : `<a class="button secondary full card-view-link" href="${productHref}">View product</a>`}
        ` : `
          <div class="price-line">${renderPrice(product)}</div>
          <p class="card-display-colour">Colour: ${escapeHtml(defaultColour)}</p>
          <div class="swatches" aria-label="Available colours">
            ${product.colors.slice(0, 4).map((color) => `<button type="button" data-variant-preview="${escapeAttribute(color)}" title="${escapeAttribute(color)}" aria-label="Preview ${escapeAttribute(color)}" style="--swatch:${swatch(color)}"></button>`).join("")}
          </div>
          <p class="card-stock ${isUnavailable ? "is-sold-out" : ""}">${escapeHtml(getStockMessage(product, defaultColour))}</p>
          <a class="button secondary full card-view-link" href="${productHref}">View product</a>
        `}
      </div>
    </article>
  `;
}

function renderMoveLaunchingSoonCard(product, options = {}) {
  const defaultColour = options.displayColour && product.colors.includes(options.displayColour)
    ? options.displayColour
    : getDefaultColor(product);
  const productHref = productRoute(product, defaultColour);
  const displayImage = getVariantImage(product, defaultColour) || product.image;
  const defaultSize = product.sizes?.[0] || "One size";
  const saved = isMoveWishlisted(product, defaultColour, defaultSize);
  const imageMarkup = options.eager
    ? `src="${escapeHtml(displayImage)}" decoding="async"`
    : `src="${escapeHtml(displayImage)}" loading="lazy" decoding="async" fetchpriority="low"`;
  return `
    <article class="product-card move-launch-card" data-product-scope data-product-id="${product.id}" data-display-colour="${escapeAttribute(defaultColour)}">
      <a class="product-media" href="${productHref}" aria-label="${escapeAttribute(`${product.title} in ${defaultColour}`)}" data-card-colour="${escapeAttribute(defaultColour)}" ${mediaPresentationStyle(product, "card")}>
        <span class="product-badge launching-soon-badge">LAUNCHING SOON</span>
        <img ${imageMarkup} ${renderResponsiveCardAttributes(product, defaultColour)} alt="${escapeAttribute(product.title)}" width="640" height="800" data-product-image>
      </a>
      <div class="product-card-body">
        <a class="product-brand" href="/brand/kalm-move">KALM Move</a>
        <div class="move-card-title-row">
          <h3><a href="${productHref}">${escapeHtml(product.title)}</a></h3>
          <button class="wishlist-heart" type="button" data-move-card-wishlist="${escapeAttribute(product.id)}" data-display-colour="${escapeAttribute(defaultColour)}" aria-label="${escapeAttribute(saved ? `${product.title} is on your wishlist` : `Save ${product.title} to wishlist`)}" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button>
        </div>
        <div class="price-line"><strong>${formatPrice(getDisplayPrice(product))}</strong></div>
        <p class="card-display-colour">Colour: ${escapeHtml(defaultColour)}</p>
        <div class="swatches" aria-label="Available colours">
          ${product.colors.slice(0, 4).map((color) => `<button type="button" data-variant-preview="${escapeAttribute(color)}" title="${escapeAttribute(color)}" aria-label="Preview ${escapeAttribute(color)}" style="--swatch:${swatch(color)}"></button>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderPrice(product) {
  const displayPrice = getDisplayPrice(product);
  if (!isMoveLaunchingSoonProduct(product) && (isComingSoonProduct(product) || typeof displayPrice !== "number")) return "";
  return `
    <strong>${formatPrice(displayPrice)}</strong>
    ${!isMoveLaunchingSoonProduct(product) && product.compareAtPrice ? `<s>${formatPrice(product.compareAtPrice)}</s>` : ""}
  `;
}

function updateVariantImage(scope, color) {
  const product = findProduct(scope?.getAttribute("data-product-id"));
  if (!product || !scope) return;
  const images = color ? getVariantImages(product, color) : getProductGalleryImages(product);
  const imagePath = images[0] || product.image;
  const altText = color ? `${product.title} in ${color}` : product.title;
  const gallery = scope.querySelector("[data-product-gallery]");
  if (gallery) {
    gallery.outerHTML = renderProductGallery(product, images);
    bindProductGallery(scope);
    updateGalleryByIndex(scope, 0);
  } else {
    const image = scope.querySelector("[data-product-image]");
    if (image) setProductImage(image, imagePath, altText, product, color);
  }
  scope.querySelector("[data-move-card-wishlist]")?.setAttribute("data-display-colour", color || getDefaultColor(product));
  updateProductAvailabilityState(scope);
  updateMoveWishlistControls(scope);
}

function setFilterSheetOpen(open) {
  const shell = document.querySelector("[data-filter-shell]");
  const toggle = document.querySelector("[data-filter-toggle]");
  shell?.classList.toggle("filters-open", Boolean(open));
  toggle?.setAttribute("aria-expanded", String(Boolean(open)));
}

function updateGalleryImage(scope, imagePath) {
  const product = findProduct(scope?.getAttribute("data-product-id"));
  if (!product || !scope || !imagePath) return;
  const index = [...scope.querySelectorAll("[data-gallery-slide]")].findIndex((slide) => slide.getAttribute("data-gallery-image") === imagePath);
  if (index >= 0) {
    updateGalleryByIndex(scope, index);
    return;
  }
  const image = scope.querySelector("[data-product-image]");
  if (image) setProductImage(image, imagePath, product.title);
  setActiveGalleryImage(scope, imagePath, index);
}

function setProductImage(image, imagePath, altText, product = null, color = "") {
  image.src = imagePath;
  image.removeAttribute("data-src");
  image.alt = altText;
  const responsive = getResponsiveCardSources(product, color);
  if (responsive.length) {
    image.srcset = responsive.map((source) => `${source.path} ${source.width}w`).join(", ");
    image.sizes = "(max-width: 520px) 50vw, (max-width: 900px) 33vw, 25vw";
  } else {
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
  }
  image.closest("[data-card-colour]")?.setAttribute("data-card-colour", color || getDefaultColor(product));
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
  if (fromMap) {
    const images = normalizeImageList(fromMap);
    if (images.length === 1) return getSiblingGalleryImages(product, images[0]);
    return images;
  }
  const fromVariant = product.variants?.find((variant) => variant.colour === color || variant.color === color)?.image;
  return normalizeImageList(fromVariant || product.image);
}

function getProductGalleryImages(product) {
  if (product?.gallery?.length) return Array.from(new Set(product.gallery)).filter(Boolean);
  const images = [
    product?.image,
    ...Object.values(product?.variantImages || {}).flatMap(normalizeImageList)
  ];
  return Array.from(new Set(images)).filter(Boolean);
}

function getMediaPresentation(product) {
  const source = product?.mediaPresentation || {};
  const fit = (value, fallback) => ["cover", "contain"].includes(value) ? value : fallback;
  const position = (value, fallback) => /^[\d.]+%\s+[\d.]+%$/.test(value || "") ? value : fallback;
  const aspect = (value, fallback) => /^[\d.]+\s*\/\s*[\d.]+$/.test(value || "") ? value : fallback;
  return {
    cardFit: fit(source.cardFit, "cover"),
    cardPosition: position(source.cardPosition, "50% 50%"),
    mobileCardFit: fit(source.mobileCardFit, fit(source.cardFit, "cover")),
    mobileCardPosition: position(source.mobileCardPosition, position(source.cardPosition, "50% 50%")),
    cardAspectRatio: aspect(source.cardAspectRatio, "4 / 5"),
    mobileCardAspectRatio: aspect(source.mobileCardAspectRatio, aspect(source.cardAspectRatio, "4 / 5")),
    galleryFit: fit(source.galleryFit, "contain"),
    galleryPosition: position(source.galleryPosition, "50% 50%"),
    background: /^#[0-9a-f]{3,8}$/i.test(source.background || "") ? source.background : "#f6f5f2"
  };
}

function mediaPresentationStyle(product, surface) {
  const presentation = getMediaPresentation(product);
  if (surface === "gallery") {
    return `style="--gallery-fit:${presentation.galleryFit};--gallery-position:${presentation.galleryPosition};--media-background:${presentation.background}"`;
  }
  return `style="--card-fit:${presentation.cardFit};--card-position:${presentation.cardPosition};--mobile-card-fit:${presentation.mobileCardFit};--mobile-card-position:${presentation.mobileCardPosition};--card-aspect:${presentation.cardAspectRatio};--mobile-card-aspect:${presentation.mobileCardAspectRatio};--media-background:${presentation.background}"`;
}

function getResponsiveCardSources(product, colour) {
  const map = product?.responsiveImages?.card || {};
  const sources = map[colour] || map[getDefaultColor(product)] || [];
  return Array.isArray(sources) ? sources.filter((source) => source?.path && Number(source?.width) > 0) : [];
}

function renderResponsiveCardAttributes(product, colour) {
  const sources = getResponsiveCardSources(product, colour);
  if (!sources.length) return "";
  return `srcset="${escapeAttribute(sources.map((source) => `${source.path} ${source.width}w`).join(", "))}" sizes="(max-width: 520px) 50vw, (max-width: 900px) 33vw, 25vw"`;
}

function normalizeImageList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "object") {
    return Array.from(new Set([
      value.hero,
      ...(Array.isArray(value.gallery) ? value.gallery : [])
    ].filter(Boolean)));
  }
  return [value].filter(Boolean);
}

function getSiblingGalleryImages(product, imagePath) {
  if (!imagePath || !product?.gallery?.length) return [imagePath].filter(Boolean);
  const directory = imagePath.slice(0, imagePath.lastIndexOf("/") + 1);
  const siblingImages = product.gallery.filter((image) => directory && image.startsWith(directory));
  return Array.from(new Set([imagePath, ...siblingImages])).filter(Boolean);
}

function setActiveGalleryImage(scope, imagePath) {
  if (!scope || !imagePath) return;
  const slides = [...scope.querySelectorAll("[data-gallery-slide]")];
  const activeIndex = slides.findIndex((slide) => slide.getAttribute("data-gallery-image") === imagePath);
  scope.querySelectorAll("[data-gallery-image]").forEach((button) => {
    if (button.getAttribute("data-gallery-image") === imagePath) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  updateGalleryCount(scope, activeIndex >= 0 ? activeIndex : 0);
}

function updateGalleryThumbnails(scope, product, images) {
  const gallery = scope?.querySelector("[data-product-gallery-thumbs]");
  if (!gallery || !images?.length) return;
  gallery.innerHTML = renderGalleryThumbs(product, images);
  hydrateDeferredImages(gallery);
}

function bindProductGallery(scope) {
  const track = scope?.querySelector("[data-product-gallery-track]");
  if (!track || track.dataset.galleryBound === "true") return;
  track.dataset.galleryBound = "true";
  let frame = 0;
  track.addEventListener("scroll", () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      const width = track.clientWidth || 1;
      updateGalleryByIndex(scope, Math.round(track.scrollLeft / width), { noScroll: true });
    });
  }, { passive: true });
}

function getActiveGalleryIndex(scope) {
  return Number(scope?.querySelector("[data-product-gallery]")?.getAttribute("data-gallery-current") || 0);
}

function updateGalleryByIndex(scope, rawIndex, options = {}) {
  const gallery = scope?.querySelector("[data-product-gallery]");
  const track = scope?.querySelector("[data-product-gallery-track]");
  const slides = [...(scope?.querySelectorAll("[data-gallery-slide]") || [])];
  if (!gallery || !track || !slides.length) return;
  const index = Math.max(0, Math.min(slides.length - 1, Number.isFinite(rawIndex) ? rawIndex : 0));
  gallery.setAttribute("data-gallery-current", String(index));
  const imagePath = slides[index].getAttribute("data-gallery-image");
  if (!options.noScroll) slides[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  scope.querySelectorAll("[data-gallery-image]").forEach((item) => {
    if (item.getAttribute("data-gallery-image") === imagePath) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });
  scope.querySelectorAll("[data-gallery-index]").forEach((item, itemIndex) => {
    if (itemIndex === index) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });
  updateGalleryCount(scope, index);
}

function updateGalleryCount(scope, index) {
  const count = scope?.querySelector("[data-gallery-count]");
  const total = scope?.querySelectorAll("[data-gallery-slide]").length || 1;
  if (count) count.textContent = `${Math.min(index + 1, total)} / ${total}`;
}

function openLightbox(scope, index = 0) {
  const images = [...(scope?.querySelectorAll("[data-gallery-slide]") || [])].map((slide) => ({
    src: slide.getAttribute("data-gallery-image"),
    alt: slide.querySelector("img")?.alt || "Product image"
  })).filter((item) => item.src);
  if (!images.length) return;
  state.activeLightbox = { images, index: Math.max(0, Math.min(images.length - 1, index)), previousFocus: document.activeElement };
  document.body.insertAdjacentHTML("beforeend", renderLightbox());
  document.body.classList.add("lightbox-open");
  document.querySelector("[data-lightbox-close]")?.focus();
}

function closeLightbox() {
  if (!state.activeLightbox) return;
  document.querySelector("[data-gallery-lightbox]")?.remove();
  document.body.classList.remove("lightbox-open");
  state.activeLightbox.previousFocus?.focus?.();
  state.activeLightbox = null;
}

function moveLightbox(delta) {
  if (!state.activeLightbox) return;
  const total = state.activeLightbox.images.length;
  state.activeLightbox.index = (state.activeLightbox.index + delta + total) % total;
  const shell = document.querySelector("[data-gallery-lightbox]");
  if (shell) shell.outerHTML = renderLightbox();
}

function renderLightbox() {
  const lightbox = state.activeLightbox;
  const current = lightbox.images[lightbox.index];
  return `
    <div class="gallery-lightbox" data-gallery-lightbox role="dialog" aria-modal="true" aria-label="Product image viewer">
      <button class="lightbox-close" type="button" data-lightbox-close aria-label="Close image viewer">Close</button>
      ${lightbox.images.length > 1 ? `<button class="lightbox-nav prev" type="button" data-lightbox-nav="-1" aria-label="Previous image">Previous</button>` : ""}
      <img src="${escapeHtml(current.src)}" alt="${escapeAttribute(current.alt)}" width="1200" height="1500">
      ${lightbox.images.length > 1 ? `<button class="lightbox-nav next" type="button" data-lightbox-nav="1" aria-label="Next image">Next</button>` : ""}
      <span>${lightbox.index + 1} / ${lightbox.images.length}</span>
    </div>
  `;
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
  if (!product || !isProductPublic(product)) return { ok: false, message: "This product is not available." };
  if (isComingSoonProduct(product)) return { ok: false, message: "This product is coming soon. Join the waitlist for launch information." };
  if (!selectedSize || !selectedColor) return { ok: false, message: "Please choose size and colour." };
  if (!isVariantAvailable(product, selectedColor, selectedSize)) {
    return { ok: false, message: "That colour and size is not available." };
  }
  const variant = findVariant(product, selectedColor, selectedSize);
  const key = `${productId}::${selectedSize}::${selectedColor}`;
  const item = state.bag.find((entry) => entry.key === key);
  if (variant && Number.isFinite(variant.quantity) && item && item.qty >= variant.quantity) {
    return { ok: false, message: "No more stock is available for that variant." };
  }
  const size = selectedSize;
  const color = selectedColor;
  const image = getVariantImage(product, color);
  if (item) {
    item.qty += 1;
    item.image = image;
    item.sku = variant?.sku || item.sku;
  } else {
    state.bag.push({ key, productId, size, color, image, sku: variant?.sku || product.sku || "", qty: 1 });
  }
  saveBag();
  renderBag();
  openBag();
  return { ok: true };
}

function updateQty(key, delta) {
  const item = state.bag.find((entry) => entry.key === key);
  if (!item) return;
  if (delta > 0) {
    const product = findProduct(item.productId);
    const variant = product ? findVariant(product, item.color, item.size) : null;
    if (variant && Number.isFinite(variant.quantity) && item.qty >= variant.quantity) return;
  }
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

function filterProducts({ brand = "all", category = "all", audience = "all", moveCategory = "all", size = "all", color = "all", availability = "all", appliance = "all", search = "" }) {
  const term = search.trim().toLowerCase();
  return getPublicProducts().filter((product) => {
    const tags = product.tags || [];
    const brandMatch = brand === "all" || product.brandId === brand;
    const categoryMatch = category === "all"
      || product.category === category
      || tags.includes(category)
      || (category === "sale" && product.compareAtPrice)
      || (category === "new-in" && tags.includes("new-in"));
    const audienceMatch = productMatchesAudience(product, audience);
    const moveCategoryMatch = moveCategory === "all"
      || getMoveCategoryId(product) === moveCategory
      || tags.includes(moveCategory);
    const sizeMatch = size === "all" || (product.sizes || []).includes(size);
    const colorMatch = color === "all" || (product.colors || []).includes(color);
    const availabilityMatch = availability === "all" || getProductAvailability(product) === availability;
    const applianceMatch = appliance === "all" || (product.compatibleAppliances || []).includes(appliance) || product.id === appliance;
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
      tags.join(" ")
    ].join(" ").toLowerCase().includes(term);
    return brandMatch && categoryMatch && audienceMatch && moveCategoryMatch && sizeMatch && colorMatch && availabilityMatch && applianceMatch && searchMatch;
  });
}

function sortProducts(products, sort) {
  const items = [...products];
  if (sort === "price-asc") return items.sort((a, b) => (Number.isFinite(getDisplayPrice(a)) ? getDisplayPrice(a) : Number.POSITIVE_INFINITY) - (Number.isFinite(getDisplayPrice(b)) ? getDisplayPrice(b) : Number.POSITIVE_INFINITY));
  if (sort === "price-desc") return items.sort((a, b) => (Number.isFinite(getDisplayPrice(b)) ? getDisplayPrice(b) : Number.NEGATIVE_INFINITY) - (Number.isFinite(getDisplayPrice(a)) ? getDisplayPrice(a) : Number.NEGATIVE_INFINITY));
  if (sort === "newest") return items.sort((a, b) => Number(b.tags.includes("new-in")) - Number(a.tags.includes("new-in")));
  return items;
}

function updateShopFromForm(event) {
  const form = event.currentTarget.closest("form") || event.currentTarget;
  const values = new FormData(form);
  const params = new URLSearchParams();
  for (const key of ["brand", "category", "audience", "moveCategory", "size", "color", "availability", "appliance", "sort", "search"]) {
    const value = values.get(key);
    if (value && value !== "all" && value !== "featured") params.set(key, value);
  }
  navigateTo(`#/shop${params.toString() ? "?" + params.toString() : ""}`);
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
    const interest = form.querySelector("[data-waitlist-interest-select]");
    const appliance = form.querySelector("[data-waitlist-appliance-select]");
    if (interest && appliance) {
      interest.addEventListener("change", () => {
        const applianceId = interest.selectedOptions[0]?.dataset.applianceId;
        const matchingOption = [...appliance.options].find((option) => option.dataset.applianceId === applianceId);
        if (matchingOption) appliance.value = matchingOption.value;
      });
    }
  });
}

function getMoveSessionId() {
  const key = "kalmMoveLaunchSessionId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `move-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function loadMoveWishlist() {
  try {
    return JSON.parse(localStorage.getItem("kalmMoveLaunchWishlist") || "[]");
  } catch {
    return [];
  }
}

function saveMoveWishlistState() {
  localStorage.setItem("kalmMoveLaunchWishlist", JSON.stringify(state.moveWishlist));
}

function loadMoveDemandEvents() {
  try {
    return JSON.parse(localStorage.getItem("kalmMoveLaunchDemandEvents") || "[]");
  } catch {
    return [];
  }
}

function saveMoveDemandEvents() {
  localStorage.setItem("kalmMoveLaunchDemandEvents", JSON.stringify(state.moveDemandEvents.slice(-500)));
}

function moveDeviceCategory() {
  const width = window.innerWidth || 0;
  if (width <= 640) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

function moveWishlistKey(productId, colour, size) {
  return `${productId}::${colour}::${size}`;
}

function isMoveWishlisted(product, colour, size) {
  return Boolean(product && colour && size && state.moveWishlist.some((entry) => entry.key === moveWishlistKey(product.id, colour, size)));
}

function updateMoveWishlistControls(scope) {
  const product = findProduct(scope?.getAttribute("data-product-id"));
  if (!product || !isMoveLaunchingSoonProduct(product) || !scope) return;
  const colour = scope.querySelector("[data-color-select]")?.value || scope.getAttribute("data-display-colour") || getDefaultColor(product);
  const sizeSelector = scope.querySelector("[data-size-select]");
  const size = sizeSelector ? sizeSelector.value : (product.sizes?.[0] || "One size");
  const saved = isMoveWishlisted(product, colour, size);
  const productButton = scope.querySelector("[data-move-wishlist-save]");
  if (productButton) {
    productButton.setAttribute("aria-pressed", String(saved));
    productButton.textContent = saved ? "ON YOUR WISHLIST" : "SAVE TO WISHLIST";
  }
  const cardButton = scope.querySelector("[data-move-card-wishlist]");
  if (cardButton) {
    cardButton.setAttribute("aria-pressed", String(saved));
    cardButton.textContent = saved ? "♥" : "♡";
    cardButton.setAttribute("aria-label", saved ? `${product.title} is on your wishlist` : `Save ${product.title} to wishlist`);
  }
}

function getMoveCustomerId() {
  return localStorage.getItem("kalmCollectiveCustomerId") || "";
}

function recordMoveProductView(product, colour) {
  const key = `kalmMoveLaunchViewed:${product.id}:${colour}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "true");
  logMoveDemandEvent("product_view", product, colour, "", "product_page", { submit: false });
}

function logMoveDemandEvent(eventType, product, colour, size, selectionSource, { email = "", deviceCategoryConsent = false, submit = true } = {}) {
  const event = {
    eventId: globalThis.crypto?.randomUUID?.() || `move-event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    eventType,
    timestamp: new Date().toISOString(),
    anonymousSessionId: getMoveSessionId(),
    customerId: getMoveCustomerId(),
    productId: product.id,
    productName: product.title,
    displayedPrice: formatPrice(getDisplayPrice(product)),
    preferredColour: colour,
    preferredSize: size,
    email,
    sourcePage: `${window.location.pathname}${window.location.hash}`,
    deviceCategory: deviceCategoryConsent ? moveDeviceCategory() : "",
    deviceCategoryConsent: deviceCategoryConsent ? "yes" : "",
    selectionSource
  };
  state.moveDemandEvents = [...state.moveDemandEvents, event].slice(-500);
  saveMoveDemandEvents();
  if (submit) submitMoveDemandEvent(event);
  return event;
}

function submitMoveDemandEvent(event) {
  const fields = {
    "form-name": "kalm-move-launch-interest",
    event_id: event.eventId,
    event_type: event.eventType,
    timestamp: event.timestamp,
    anonymous_session_id: event.anonymousSessionId,
    customer_id: event.customerId,
    product_id: event.productId,
    product_name: event.productName,
    displayed_price: event.displayedPrice,
    preferred_colour: event.preferredColour,
    preferred_size: event.preferredSize,
    email: event.email,
    source_page: event.sourcePage,
    device_category: event.deviceCategory,
    device_category_consent: event.deviceCategoryConsent,
    selection_source: event.selectionSource
  };
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString()
  }).catch(() => {});
}

function saveMoveWishlistFromScope(scope, button) {
  const product = findProduct(scope?.getAttribute("data-product-id"));
  if (!product) return;
  const colour = scope.querySelector("[data-color-select]")?.value || getDefaultColor(product);
  const size = scope.querySelector("[data-size-select]")?.value || "";
  if (!size) {
    const error = scope.querySelector("[data-variant-error]");
    if (error) error.textContent = "Choose a size to save this product to your wishlist.";
    scope.querySelector("[data-size-select]")?.setAttribute("aria-invalid", "true");
    return;
  }
  saveMoveWishlist(product, colour, size, "product_page", button);
}

function saveMoveWishlist(product, colour, size, selectionSource, button = null) {
  const key = moveWishlistKey(product.id, colour, size);
  const existing = state.moveWishlist.some((entry) => entry.key === key);
  if (!existing) {
    state.moveWishlist.push({
      key,
      productId: product.id,
      productName: product.title,
      displayedPrice: getDisplayPrice(product),
      colour,
      size,
      savedAt: new Date().toISOString(),
      anonymousSessionId: getMoveSessionId(),
      selectionSource
    });
    saveMoveWishlistState();
    logMoveDemandEvent("wishlist_save", product, colour, size, selectionSource);
  }
  if (button) {
    button.setAttribute("aria-pressed", "true");
    if (button.matches("[data-move-card-wishlist]")) {
      button.textContent = "♥";
      button.setAttribute("aria-label", `${product.title} is on your wishlist`);
    } else {
      button.textContent = "ON YOUR WISHLIST";
    }
  }
}

function syncMoveInterestForm(form, scope) {
  if (!form || !scope) return;
  const product = findProduct(scope.getAttribute("data-product-id"));
  if (!product) return;
  const colour = scope.querySelector("[data-color-select]")?.value || getDefaultColor(product);
  const size = scope.querySelector("[data-size-select]")?.value || "";
  const consent = form.querySelector("[data-move-device-consent]")?.checked;
  const setValue = (name, value) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) field.value = value;
  };
  setValue("event_id", globalThis.crypto?.randomUUID?.() || `move-notify-${Date.now()}`);
  setValue("timestamp", new Date().toISOString());
  setValue("anonymous_session_id", getMoveSessionId());
  setValue("customer_id", getMoveCustomerId());
  setValue("preferred_colour", colour);
  setValue("preferred_size", size);
  setValue("device_category", consent ? moveDeviceCategory() : "");
  setValue("source_page", `${window.location.pathname}${window.location.hash}`);
}

function getMoveNotifySubmissionKey(form) {
  if (!form?.matches("[data-move-notify-form]")) return "";
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const productId = String(data.get("product_id") || "");
  const colour = String(data.get("preferred_colour") || "");
  const size = String(data.get("preferred_size") || "");
  return email && productId && colour && size ? `${email}::${productId}::${colour}::${size}` : "";
}

function recordMoveNotifyRegistration(form) {
  const data = new FormData(form);
  const product = findProduct(String(data.get("product_id") || ""));
  if (!product) return;
  logMoveDemandEvent("notify_registration", product, String(data.get("preferred_colour") || ""), String(data.get("preferred_size") || ""), "product_page", {
    email: String(data.get("email") || ""),
    deviceCategoryConsent: data.get("device_category_consent") === "yes",
    submit: false
  });
}

function getWaitlistSubmissionKey(form) {
  if (!form?.matches("[data-waitlist-form]")) return "";
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const interest = String(data.get("accessory_or_bundle") || "").trim().toLowerCase();
  return email && interest ? `${email}::${interest}` : "";
}

async function submitNetlifyForm(event) {
  if (event.defaultPrevented) return;
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  const button = form.querySelector("button[type='submit']");
  const originalLabel = button?.textContent || "";
  const successMessage = form.dataset.successMessage || "Thanks. Your message has been received.";
  const waitlistSubmissionKey = getWaitlistSubmissionKey(form);
  const moveNotifySubmissionKey = getMoveNotifySubmissionKey(form);

  if (waitlistSubmissionKey && state.waitlistSubmissions.has(waitlistSubmissionKey)) {
    if (status) status.textContent = "You are already on this waitlist in this browser session.";
    return;
  }
  if (moveNotifySubmissionKey && state.moveNotifySubmissions.has(moveNotifySubmissionKey)) {
    if (status) status.textContent = "You’re already on the list for this selection in this browser session.";
    return;
  }

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
    if (form.matches("[data-move-notify-form]")) {
      recordMoveNotifyRegistration(form);
      state.moveNotifySubmissions.add(moveNotifySubmissionKey);
      if (status) status.textContent = "You’re on the list. We’ll let you know when KALM Move launches.";
    } else if (status) status.textContent = successMessage;
    if (waitlistSubmissionKey) state.waitlistSubmissions.add(waitlistSubmissionKey);
    if (form.dataset.clearBag === "true") {
      state.bag = [];
      saveBag();
      renderBag();
    }
    form.reset();
    if (form.dataset.redirect) window.location.href = form.dataset.redirect;
  } catch (error) {
    console.warn(error);
    if (form.matches("[data-waitlist-form]")) {
      if (status) status.textContent = "We could not add you to the waitlist right now. Please check your connection and try again.";
    } else {
      if (status) status.textContent = "The form could not send in this browser session. Opening the standard form submission.";
      HTMLFormElement.prototype.submit.call(form);
    }
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

function sanitizeMoveProductsFromBag() {
  const originalLength = state.bag.length;
  state.bag = state.bag.filter((item) => !isMoveLaunchingSoonProduct(findProduct(item.productId)));
  if (state.bag.length !== originalLength) saveBag();
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
  if (value.includes("white") || value.includes("ivory") || value.includes("cream")) return "#f8f5ef";
  if (value.includes("olive") || value.includes("sage")) return "#9a9d84";
  if (value.includes("grey") || value.includes("charcoal") || value.includes("smoke")) return "#5c5c5c";
  if (value.includes("wine") || value.includes("plum")) return "#5b254b";
  if (value.includes("blue")) return "#244f9e";
  if (value.includes("espresso") || value.includes("brown")) return "#3b2b23";
  if (value.includes("blush")) return "#d8aeb0";
  if (value.includes("rose")) return "#c48783";
  if (value.includes("sand")) return "#d8c6a8";
  if (value.includes("oat") || value.includes("natural") || value.includes("stone") || value.includes("taupe")) return "#c8b99f";
  if (value.includes("cork")) return "#b98d57";
  return "#d8d2c7";
}

function renderFooter() {
  const logo = state.data.meta.logo || "assets/branding/kalm-collective/kalm-collective-logo.png";
  const logoAlt = state.data.meta.logoAlt || "KALM Collective logo";
  const footerSection = (title, content) => `
    <details class="footer-section" ${window.matchMedia("(min-width: 901px)").matches ? "open" : ""}>
      <summary>${escapeHtml(title)}</summary>
      <div>${content}</div>
    </details>
  `;
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
          <img src="${escapeHtml(logo)}" alt="${escapeAttribute(logoAlt)}" width="1563" height="1563" decoding="async">
          <p>Premium essentials for movement, outdoor routines and everyday living.</p>
        </div>
        ${footerSection("Shop", `
          <a href="#/shop?category=new-in">New In</a>
          <a href="#/shop?category=activewear">Activewear</a>
          <a href="/brand/kalm-move">KALM Move</a>
          <a href="#/shop?category=sale">Archive Sale</a>
        `)}
        ${footerSection("Brands", `
          <a href="#/brand/ks-active">KS Active</a>
          <a href="/brand/kalm-move">KALM Move</a>
        `)}
        ${footerSection("Customer care", `
          <a href="#/contact">Help</a>
          <a href="#/policies#delivery">Delivery</a>
          <a href="#/policies#returns">Returns</a>
          <a href="#/policies">Privacy</a>
        `)}
        ${footerSection("Follow", `
          <p>@kalmcollective</p>
          <p>kalmcollective.co.za</p>
        `)}
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
