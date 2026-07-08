(function () {
  const app = document.querySelector("#app");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const cartDrawer = document.querySelector("[data-cart-drawer]");
  const cartOpen = document.querySelector("[data-cart-open]");
  const cartClose = document.querySelector("[data-cart-close]");
  const cartItemsEl = document.querySelector("[data-cart-items]");
  const cartCountEl = document.querySelector("[data-cart-count]");
  const cartSubtotalEl = document.querySelector("[data-cart-subtotal]");

  const money = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  });

  const state = {
    catalog: null,
    products: [],
    brands: [],
    cart: loadCart(),
    filters: {
      brand: "all",
      type: "all",
      size: "all",
      color: "all",
      price: "all",
      search: "",
      sort: "featured"
    }
  };

  const routes = {
    home: /^#\/?$/,
    shop: /^#\/shop(?:\?.*)?$/,
    brand: /^#\/brand\/([^/]+)$/,
    product: /^#\/product\/([^/]+)$/,
    checkout: /^#\/checkout$/,
    about: /^#\/about$/,
    contact: /^#\/contact$/,
    policies: /^#\/policies$/
  };

  init();

  async function init() {
    bindChrome();
    try {
      const response = await fetch("products.json", { cache: "no-store" });
      state.catalog = await response.json();
      state.products = state.catalog.products;
      state.brands = state.catalog.brands;
      route();
      renderCart();
      track("page_view", { path: location.hash || "#/" });
    } catch (error) {
      app.innerHTML = renderError("The storefront catalog could not be loaded. Please refresh the page or contact KALM Collective for order assistance.");
      console.error(error);
    }
  }

  function bindChrome() {
    window.addEventListener("hashchange", () => {
      closeNav();
      route();
      track("page_view", { path: location.hash || "#/" });
    });

    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    cartOpen.addEventListener("click", openCart);
    cartClose.addEventListener("click", closeCart);
    cartDrawer.addEventListener("click", (event) => {
      if (event.target === cartDrawer) closeCart();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCart();
        closeNav();
      }
    });
  }

  function closeNav() {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  function openCart() {
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
    track("cart_open", { count: cartCount() });
  }

  function closeCart() {
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
  }

  function route() {
    const hash = location.hash || "#/";
    setActiveNav(hash);

    if (routes.home.test(hash)) return renderHome();
    if (routes.shop.test(hash)) return renderShop();
    const brandMatch = hash.match(routes.brand);
    if (brandMatch) return renderBrand(brandMatch[1]);
    const productMatch = hash.match(routes.product);
    if (productMatch) return renderProduct(productMatch[1]);
    if (routes.checkout.test(hash)) return renderCheckout();
    if (routes.about.test(hash)) return renderAbout();
    if (routes.contact.test(hash)) return renderContact();
    if (routes.policies.test(hash)) return renderPolicies();
    location.hash = "#/";
  }

  function setActiveNav(hash) {
    document.querySelectorAll(".site-nav a").forEach((link) => {
      const current = link.getAttribute("href") === hash || (hash.startsWith("#/product") && link.getAttribute("href") === "#/shop");
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderHome() {
    const featured = state.products.filter((product) => ["ks-seamless-breathable-leggings", "ks-crisscross-back-sports-bra", "ks-high-waist-seamless-shorts", "ks-open-back-romper", "kalm-modest-performance-tee"].includes(product.id));
    const categories = [
      {
        title: "KS Active Archive Drop",
        copy: "Original KS Active styles with source images now mapped product by product.",
        href: "#/brand/ks-active",
        image: "assets/images/ks-active-archive-tile.webp",
        status: "Archive availability confirmed by WhatsApp"
      },
      {
        title: "KALM Move",
        copy: "Concept collection for modest tees, leggings and support layers.",
        href: "#/brand/kalm-move",
        status: "Product images pending supplier confirmation"
      },
      {
        title: "Wellness Accessories",
        copy: "Accessories will be added after source images and availability are confirmed.",
        href: "#/shop?category=wellness",
        status: "Image to be confirmed after stock count"
      },
      {
        title: "Home + Living",
        copy: "Future KALM Collective home essentials category.",
        href: "#/shop?category=home-living",
        status: "Archive product image pending"
      },
      {
        title: "Outdoor Living",
        copy: "Future outdoor and everyday-living category.",
        href: "#/shop?category=outdoor-living",
        status: "Archive product image pending"
      }
    ];
    app.innerHTML = `
      <div class="page">
        <section class="hero retail-hero">
          <div class="hero-copy">
            <p class="micro">KALM Collective</p>
            <h1>KALM Collective</h1>
            <p>Curated active, home and lifestyle essentials.</p>
            <div class="hero-actions">
              <a class="button primary" href="#/brand/ks-active">Shop KS Active Archive</a>
              <a class="button secondary" href="#/shop">Browse all collections</a>
            </div>
            <div class="hero-strip" aria-label="Store highlights">
              <div><strong>KS Active</strong><span>Archive drop being prepared</span></div>
              <div><strong>KALM Move</strong><span>Concept collection</span></div>
              <div><strong>More brands</strong><span>Coming soon</span></div>
            </div>
          </div>
          <figure class="hero-media">
            <img src="assets/images/home-hero-source-collage.webp" alt="KS Active archive product source collage">
          </figure>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-head">
              <div>
                <h2>Shop categories</h2>
                <p>Current product images are either verified source images or marked pending in the product card.</p>
              </div>
            </div>
            <div class="category-grid">
              ${categories.map(renderCategoryTile).join("")}
            </div>
          </div>
        </section>

        <section class="section soft">
          <div class="container">
            <div class="section-head">
              <div>
                <h2>Brand collections</h2>
                <p>KS Active and KALM Move sit inside KALM Collective as distinct brands.</p>
              </div>
              <a class="button secondary" href="#/shop">View all</a>
            </div>
            <div class="brand-tiles">
              ${state.brands.map(renderBrandTile).join("")}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-head">
              <div>
                <h2>Featured products</h2>
                <p>KS Active images are source-mapped. KALM Move product images remain clearly marked as pending.</p>
              </div>
              <a class="button text" href="#/shop">Open shop</a>
            </div>
            <div class="product-grid">${featured.map(renderProductCard).join("")}</div>
          </div>
        </section>

        <section class="section soft">
          <div class="container about-grid">
            <div>
              <p class="micro">Order handoff</p>
              <h2>Requests are captured first; payment and delivery are confirmed directly.</h2>
            </div>
            <div class="panel">
              <p>Items can be added to an enquiry bag, edited and sent through order assistance. Card payment and automated courier rates are intentionally not connected until the selected South African payment provider and shipping rules are configured.</p>
              <a class="button primary" href="#/checkout">Send enquiry</a>
            </div>
          </div>
        </section>
        ${renderFooter()}
      </div>
    `;
    bindProductCards();
    focusApp();
  }

  function renderCategoryTile(category) {
    return `
      <a class="category-tile" href="${category.href}">
        ${category.image ? `<img src="${category.image}" alt="${escapeAttr(category.title)} category image" loading="lazy">` : renderMediaPlaceholder({ imageLabel: category.title, imageSubtext: category.status }, "category")}
        <span>${escapeHtml(category.status)}</span>
        <strong>${escapeHtml(category.title)}</strong>
        <p>${escapeHtml(category.copy)}</p>
      </a>
    `;
  }

  function renderBrandTile(brand) {
    const action = brand.id === "kalm-move" ? "View" : "Shop";
    return `
      <article class="brand-tile">
        <div class="brand-tile-content">
          <div>
            <p class="micro">${escapeHtml(brand.role)}</p>
            <h3>${escapeHtml(brand.name)}</h3>
            <p>${escapeHtml(brand.summary)}</p>
          </div>
          <a class="button primary" href="#/brand/${brand.id}">${action} ${escapeHtml(brand.name)}</a>
        </div>
        ${brand.tileImage ? `<img src="${brand.tileImage}" alt="${escapeAttr(brand.name)} category image">` : renderMediaPlaceholder({ imageLabel: brand.name, imageSubtext: "Product image to be confirmed" }, "brand")}
      </article>
    `;
  }

  function renderProductMedia(product, context = "card") {
    if (product.image) {
      const loading = context === "detail" ? "" : ' loading="lazy"';
      return `<img src="${product.image}" alt="${escapeAttr(product.title)} product image"${loading}>`;
    }
    return renderMediaPlaceholder(product, context);
  }

  function renderLineMedia(product, className) {
    if (product.image) return `<img src="${product.image}" alt="${escapeAttr(product.title)}">`;
    return renderMediaPlaceholder(product, className);
  }

  function renderMediaPlaceholder(item, context = "card") {
    const label = item.imageLabel || item.title || "Image pending";
    const subtext = item.imageSubtext || item.status || "Image to be confirmed";
    const classes = `media-placeholder media-placeholder-${context}`;
    return `
      <div class="${classes}" role="img" aria-label="${escapeAttr(label)}: ${escapeAttr(subtext)}">
        <span>${escapeHtml(subtext)}</span>
        <strong>${escapeHtml(label)}</strong>
      </div>
    `;
  }

  function renderShop(prefill = {}) {
    state.filters = { ...state.filters, ...prefill };
    const filtered = getFilteredProducts();
    app.innerHTML = `
      <div class="page">
        <section class="checkout container">
          <p class="micro">Shop</p>
          <h1>Shop KALM Collective</h1>
          <p>Browse KS Active archive styles and KALM Move concept products by brand, product type, size, colour and price.</p>
        </section>
        <section class="section">
          <div class="container filters-shell">
            <aside class="filters" aria-label="Product filters">
              <h2>Filters</h2>
              ${renderFilter("brand", "Brand", ["all", ...state.brands.map((brand) => brand.name)])}
              ${renderFilter("type", "Product type", ["all", ...unique(state.products.map((product) => product.type))])}
              ${renderFilter("size", "Size", ["all", ...unique(state.products.flatMap((product) => product.sizes))])}
              ${renderFilter("color", "Colour", ["all", ...unique(state.products.flatMap((product) => product.colors))])}
              ${renderFilter("price", "Price", ["all", "Under R350", "R350 to R500", "R500 plus"])}
              <button class="button secondary" type="button" data-clear-filters>Clear filters</button>
            </aside>
            <div>
              <div class="search-row">
                <label>Search products<input type="search" value="${escapeAttr(state.filters.search)}" placeholder="Search leggings, bra, tee, colour..." data-search></label>
              </div>
              <div class="result-bar">
                <span>${filtered.length} product${filtered.length === 1 ? "" : "s"}</span>
                <label class="sort-control">Sort
                  <select data-sort>
                    <option value="featured"${state.filters.sort === "featured" ? " selected" : ""}>Featured</option>
                    <option value="price-low"${state.filters.sort === "price-low" ? " selected" : ""}>Price: low to high</option>
                    <option value="price-high"${state.filters.sort === "price-high" ? " selected" : ""}>Price: high to low</option>
                    <option value="brand"${state.filters.sort === "brand" ? " selected" : ""}>Brand</option>
                  </select>
                </label>
              </div>
              <p class="shop-note">No payment is taken online. KALM confirms availability, payment method and delivery timing directly.</p>
              <div class="product-grid">${filtered.length ? filtered.map(renderProductCard).join("") : renderEmpty("No products match those filters.")}</div>
            </div>
          </div>
        </section>
        ${renderFooter()}
      </div>
    `;
    bindFilters();
    bindProductCards();
    focusApp();
  }

  function renderFilter(key, label, options) {
    return `
      <label>${label}
        <select data-filter="${key}">
          ${options.map((option) => `<option value="${escapeAttr(option)}"${state.filters[key] === option ? " selected" : ""}>${option === "all" ? "All" : escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  function bindFilters() {
    document.querySelectorAll("[data-filter]").forEach((select) => {
      select.addEventListener("change", (event) => {
        state.filters[event.target.dataset.filter] = event.target.value;
        renderShop();
        track("product_filter_change", { filter: event.target.dataset.filter, value: event.target.value });
      });
    });
    const search = document.querySelector("[data-search]");
    search.addEventListener("input", (event) => {
      state.filters.search = event.target.value;
      const grid = document.querySelector(".product-grid");
      const resultBar = document.querySelector(".result-bar span");
      const filtered = getFilteredProducts();
      resultBar.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;
      grid.innerHTML = filtered.length ? filtered.map(renderProductCard).join("") : renderEmpty("No products match those filters.");
      bindProductCards();
    });
    const sort = document.querySelector("[data-sort]");
    sort.addEventListener("change", (event) => {
      state.filters.sort = event.target.value;
      renderShop();
      track("product_sort_change", { sort: event.target.value });
    });
    document.querySelector("[data-clear-filters]").addEventListener("click", () => {
      state.filters = { brand: "all", type: "all", size: "all", color: "all", price: "all", search: "", sort: "featured" };
      renderShop();
      track("product_filters_clear", {});
    });
  }

  function getFilteredProducts() {
    const search = state.filters.search.trim().toLowerCase();
    const filtered = state.products.filter((product) => {
      if (state.filters.brand !== "all" && product.brand !== state.filters.brand) return false;
      if (state.filters.type !== "all" && product.type !== state.filters.type) return false;
      if (state.filters.size !== "all" && !product.sizes.includes(state.filters.size)) return false;
      if (state.filters.color !== "all" && !product.colors.includes(state.filters.color)) return false;
      if (state.filters.price === "Under R350" && product.price >= 350) return false;
      if (state.filters.price === "R350 to R500" && (product.price < 350 || product.price > 500)) return false;
      if (state.filters.price === "R500 plus" && product.price < 500) return false;
      if (search) {
        const text = `${product.title} ${product.brand} ${product.type} ${product.colors.join(" ")} ${product.tags.join(" ")}`.toLowerCase();
        if (!text.includes(search)) return false;
      }
      return true;
    });
    const sorted = [...filtered];
    if (state.filters.sort === "price-low") sorted.sort((a, b) => a.price - b.price);
    else if (state.filters.sort === "price-high") sorted.sort((a, b) => b.price - a.price);
    else if (state.filters.sort === "brand") sorted.sort((a, b) => `${a.brand} ${a.title}`.localeCompare(`${b.brand} ${b.title}`));
    else sorted.sort((a, b) => {
      if (a.brandId !== b.brandId) return a.brandId === "ks-active" ? -1 : 1;
      return String(a.type).localeCompare(String(b.type)) || String(a.title).localeCompare(String(b.title));
    });
    return sorted;
  }

  function renderBrand(brandId) {
    const brand = state.brands.find((item) => item.id === brandId);
    if (!brand) return renderShop();
    const products = state.products.filter((product) => product.brandId === brandId);
    const isKsActive = brandId === "ks-active";
    app.innerHTML = `
      <div class="page">
        <section class="brand-hero ${brand.heroImage ? "" : "is-placeholder"}">
          ${brand.heroImage ? `<img src="${brand.heroImage}" alt="${escapeAttr(brand.name)} source image collage">` : renderMediaPlaceholder({ imageLabel: brand.name, imageSubtext: "Concept collection, product image to be confirmed" }, "hero")}
          <div class="brand-hero-content">
            <img class="brand-mark" src="${brand.logo}" alt="${escapeHtml(brand.name)} logo">
            <h1>${escapeHtml(brand.name)}</h1>
            <p>${escapeHtml(brand.summary)}</p>
            <a class="button primary" href="#/shop">${isKsActive ? "Shop" : "View"} ${escapeHtml(brand.name)}</a>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="section-head">
              <div>
                <h2>${isKsActive ? "Archive availability" : "Concept collection"}</h2>
                <p>${isKsActive ? "Historical workbook quantities exist, but final availability is confirmed through order assistance before payment." : "Practical movement wear being shaped around modest tees, leggings, support layers and calm outfit building. Final product imagery is pending."}</p>
              </div>
              <a class="button secondary" href="#/shop">All products</a>
            </div>
            <div class="product-grid">${products.map(renderProductCard).join("")}</div>
          </div>
        </section>
        ${isKsActive ? renderArchiveStory() : renderMoveStory()}
        ${renderFooter()}
      </div>
    `;
    bindProductCards();
    focusApp();
  }

  function renderArchiveStory() {
    return `
      <section class="section soft">
        <div class="container about-grid">
          <div>
            <p class="micro">KS Active archive</p>
            <h2>Original styles, cleaner retail copy.</h2>
          </div>
          <div class="panel">
            <p>The archive range keeps the KS Active name for the original products while removing older body-shaping language from the public shop. Size and colour requests are confirmed before payment so the store does not overstate remaining availability.</p>
          </div>
        </div>
      </section>
    `;
  }

  function renderMoveStory() {
    return `
      <section class="section soft">
        <div class="container about-grid">
          <div>
            <p class="micro">KALM Move</p>
            <h2>Movement wear for everyday life.</h2>
          </div>
          <div class="panel">
            <p>KALM Move uses the buffalo brand family and a practical product language: leggings, support layers, modest tees and full looks for walks, errands, home-to-gym transitions and calm outdoor movement.</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-head">
            <div>
              <h2>What remains pending</h2>
              <p>These items stay in enquiry mode until supplier samples, final product photos, payment setup and delivery handoff are confirmed.</p>
            </div>
          </div>
          <div class="pending-grid">
            <article><strong>Product photos</strong><span>To be confirmed after supplier and sample review.</span></article>
            <article><strong>Payment method</strong><span>No card details are collected on this website yet.</span></article>
            <article><strong>Delivery timing</strong><span>Confirmed directly after availability and fulfilment checks.</span></article>
          </div>
        </div>
      </section>
    `;
  }

  function renderProduct(slug) {
    const product = state.products.find((item) => item.slug === slug);
    if (!product) return renderShop();
    const related = state.products.filter((item) => item.id !== product.id && item.brandId === product.brandId).slice(0, 4);
    app.innerHTML = `
      <div class="page">
        <section class="container product-detail">
          <div class="product-gallery">
            <div class="product-gallery-main">
              ${renderProductMedia(product, "detail")}
            </div>
          </div>
          <div class="product-info">
            <div>
              <p class="micro">${escapeHtml(product.brand)} / ${escapeHtml(product.collection)}</p>
              <h1>${escapeHtml(product.title)}</h1>
              <p class="detail-copy">${escapeHtml(product.description)}</p>
            </div>
            <div class="price">${formatMoney(product.price)}</div>
            <div class="status-note">${escapeHtml(product.stockLabel)}. No payment is taken here; KALM confirms availability, payment and delivery directly.</div>
            <div class="option-panel">
              <div class="selectors">
                <label>Size${renderOptionSelect(product, "size")}</label>
                <label>Colour${renderOptionSelect(product, "color")}</label>
              </div>
              <button class="button primary" type="button" data-add-to-cart="${product.id}">${escapeHtml(product.ctaLabel || "Add to enquiry")}</button>
            </div>
            <div class="detail-list">
              <div><strong>Fit notes</strong><span>${escapeHtml(product.fitNotes)}</span></div>
              <div><strong>Fabric</strong><span>${escapeHtml(product.fabric)}</span></div>
              <div><strong>Care</strong><span>${escapeHtml(product.care)}</span></div>
              <div><strong>Colours</strong><span>${product.colors.map(escapeHtml).join(", ")}</span></div>
              <div><strong>Sizes</strong><span>${product.sizes.map(escapeHtml).join(", ")}</span></div>
            </div>
          </div>
        </section>
        <section class="section soft">
          <div class="container">
            <div class="section-head"><h2>Related products</h2></div>
            <div class="related-row">${related.map(renderProductCard).join("")}</div>
          </div>
        </section>
        ${renderFooter()}
      </div>
    `;
    bindProductCards();
    focusApp();
  }

  function renderProductCard(product) {
    return `
      <article class="product-card" data-product-id="${product.id}">
        <a class="product-card-media" href="#/product/${product.slug}" aria-label="View ${escapeAttr(product.title)}">
          ${renderProductMedia(product, "card")}
          <span class="stock-chip">${escapeHtml(product.stockLabel)}</span>
        </a>
        <div class="product-card-body">
          <div class="product-meta"><span>${escapeHtml(product.brand)}</span><span>${escapeHtml(product.type)}</span></div>
          <h3><a href="#/product/${product.slug}">${escapeHtml(product.title)}</a></h3>
          <div class="price">${formatMoney(product.price)}</div>
          <div class="selectors">
            <label>Size${renderOptionSelect(product, "size")}</label>
            <label>Colour${renderOptionSelect(product, "color")}</label>
          </div>
          <div class="card-actions">
            <button class="button primary" type="button" data-add-to-cart="${product.id}">${escapeHtml(product.ctaLabel || "Add to enquiry")}</button>
            <a class="button secondary" href="#/product/${product.slug}">View details</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderOptionSelect(product, type) {
    const values = type === "size" ? product.sizes : product.colors;
    return `
      <select data-${type}-select="${product.id}" aria-label="${type} for ${escapeAttr(product.title)}">
        <option value="">Choose</option>
        ${values.map((value) => `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`).join("")}
      </select>
    `;
  }

  function bindProductCards() {
    document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.dataset.addToCart;
        const product = productById(productId);
        const label = product?.ctaLabel || "Add to enquiry";
        const scope = button.closest(".product-card, .option-panel, .product-info") || document;
        const size = scope.querySelector(`[data-size-select="${cssEscape(productId)}"]`)?.value || "";
        const color = scope.querySelector(`[data-color-select="${cssEscape(productId)}"]`)?.value || "";
        if (!size || !color) {
          button.textContent = "Choose size and colour";
          setTimeout(() => (button.textContent = label), 1300);
          return;
        }
        addToCart(productId, size, color);
        button.textContent = "Added to enquiry";
        setTimeout(() => (button.textContent = label), 1200);
      });
    });
  }

  function addToCart(productId, size, color) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;
    const key = `${productId}::${size}::${color}`;
    const existing = state.cart.find((line) => line.key === key);
    if (existing) existing.qty += 1;
    else state.cart.push({ key, productId, size, color, qty: 1 });
    saveCart();
    renderCart();
    openCart();
    track("add_to_enquiry", { productId, title: product.title, brand: product.brand, size, color, price: product.price });
  }

  function renderCart() {
    cartCountEl.textContent = cartCount();
    cartSubtotalEl.textContent = formatMoney(cartSubtotal());
    if (!state.cart.length) {
      cartItemsEl.innerHTML = renderEmpty("Your enquiry bag is empty. Add products to request availability or checkout assistance.");
      return;
    }
    cartItemsEl.innerHTML = state.cart.map((line) => {
      const product = productById(line.productId);
      return `
        <div class="cart-line">
          ${renderLineMedia(product, "line")}
          <div>
            <h3>${escapeHtml(product.title)}</h3>
            <p>${escapeHtml(line.size)} / ${escapeHtml(line.color)}</p>
            <p>${formatMoney(product.price)}</p>
            <div class="cart-line-controls">
              <div class="qty-control" aria-label="Quantity">
                <button type="button" data-qty-minus="${line.key}">-</button>
                <span>${line.qty}</span>
                <button type="button" data-qty-plus="${line.key}">+</button>
              </div>
              <button class="remove-line" type="button" data-remove-line="${line.key}">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
    cartItemsEl.querySelectorAll("[data-qty-minus]").forEach((button) => button.addEventListener("click", () => updateQty(button.dataset.qtyMinus, -1)));
    cartItemsEl.querySelectorAll("[data-qty-plus]").forEach((button) => button.addEventListener("click", () => updateQty(button.dataset.qtyPlus, 1)));
    cartItemsEl.querySelectorAll("[data-remove-line]").forEach((button) => button.addEventListener("click", () => removeLine(button.dataset.removeLine)));
  }

  function updateQty(key, delta) {
    const line = state.cart.find((item) => item.key === key);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) state.cart = state.cart.filter((item) => item.key !== key);
    saveCart();
    renderCart();
    track("cart_quantity_change", { key, delta });
  }

  function removeLine(key) {
    state.cart = state.cart.filter((item) => item.key !== key);
    saveCart();
    renderCart();
    track("cart_remove", { key });
  }

  function renderCheckout() {
    const summary = cartSummaryText();
    app.innerHTML = `
      <div class="page">
        <section class="checkout container">
          <p class="micro">Enquiry assistance</p>
          <h1>Send your request to KALM.</h1>
          <p>No payment is taken here. KALM confirms availability, payment method and delivery timing directly.</p>
          <div class="checkout-grid">
            <div class="panel soft">
              <h2>Enquiry bag</h2>
              ${state.cart.length ? `<div class="order-list">${state.cart.map(renderOrderLine).join("")}</div>` : renderEmpty("Your enquiry bag is empty.")}
              <div class="cart-summary">
                <div><span>Subtotal</span><strong>${formatMoney(cartSubtotal())}</strong></div>
                <p>Payment gateway and shipping rates are not connected yet, so no card details are collected here.</p>
                <a class="button secondary full" href="#/shop">Continue shopping</a>
              </div>
            </div>
            <form class="panel form-grid" name="kalm-collective-order-assistance" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-assistance-form>
              <input type="hidden" name="form-name" value="kalm-collective-order-assistance">
              <p hidden><label>Do not fill this out <input name="bot-field"></label></p>
              <input type="hidden" name="cart_summary" value="${escapeAttr(summary)}">
              <div class="form-row">
                <label>Name<input name="name" autocomplete="name" required></label>
                <label>Email<input name="email" type="email" autocomplete="email" required></label>
              </div>
              <div class="form-row">
                <label>WhatsApp number<input name="whatsapp" autocomplete="tel" inputmode="tel" required></label>
                <label>Delivery area<input name="delivery_area" placeholder="Suburb, city" required></label>
              </div>
              <label>Order notes<textarea name="message" placeholder="Sizing questions, colour substitutions, delivery notes"></textarea></label>
              <label class="consent"><input type="checkbox" name="popia_consent" value="yes" required> <span>I agree that KALM Collective may use my details to respond to this order assistance request and availability or size questions.</span></label>
              <button class="button primary" type="submit">Send order request</button>
              <p class="form-status" role="status"></p>
            </form>
          </div>
        </section>
        ${renderFooter()}
      </div>
    `;
    bindForms();
    focusApp();
  }

  function renderOrderLine(line) {
    const product = productById(line.productId);
    return `
        <div class="order-line">
        ${renderLineMedia(product, "order")}
        <div>
          <strong>${escapeHtml(product.title)}</strong>
          <span>${escapeHtml(line.size)} / ${escapeHtml(line.color)} x ${line.qty}</span>
        </div>
        <small>${formatMoney(product.price * line.qty)}</small>
      </div>
    `;
  }

  function renderAbout() {
    app.innerHTML = `
      <div class="page">
        <section class="simple-page container">
          <p class="micro">About</p>
          <h1>KALM Collective is the activewear home for KS Active and KALM Move.</h1>
          <p class="lead">The store keeps the original KS Active archive distinct while introducing KALM Move as the newer practical movement line under the KALM buffalo family.</p>
          <section class="section">
            <div class="about-grid">
              <article class="about-card">
                <h2>KS Active</h2>
                <p>The original activewear brand, now held as an archive section with cleaner product copy and order assistance before final payment.</p>
                <a class="button secondary" href="#/brand/ks-active">Shop KS Active</a>
              </article>
              <article class="about-card">
                <h2>KALM Move</h2>
                <p>Concept activewear for real routines: walking, school-run-to-training, errands, light gym and calm outdoor movement.</p>
                <a class="button secondary" href="#/brand/kalm-move">View KALM Move</a>
              </article>
            </div>
          </section>
        </section>
        ${renderFooter()}
      </div>
    `;
    focusApp();
  }

  function renderContact() {
    app.innerHTML = `
      <div class="page">
        <section class="simple-page container">
          <p class="micro">Contact</p>
          <h1>Order assistance and size help.</h1>
          <p class="lead">Use the form for product availability, sizing, colour questions or checkout assistance.</p>
          <section class="section contact-grid">
            <div class="panel soft">
              <h2>How we can help</h2>
              <p>Ask about KS Active archive availability, KALM Move sizing, product combinations, delivery area or order handoff while payment and shipping setup is finalised.</p>
            </div>
            <form class="panel form-grid" name="kalm-collective-contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-contact-form>
              <input type="hidden" name="form-name" value="kalm-collective-contact">
              <p hidden><label>Do not fill this out <input name="bot-field"></label></p>
              <div class="form-row">
                <label>Name<input name="name" autocomplete="name" required></label>
                <label>Email<input name="email" type="email" autocomplete="email" required></label>
              </div>
              <div class="form-row">
                <label>WhatsApp number<input name="whatsapp" autocomplete="tel" inputmode="tel"></label>
                <label>Topic<select name="topic" required><option>Order assistance</option><option>Size help</option><option>Availability question</option><option>Returns or exchange</option></select></label>
              </div>
              <label>Message<textarea name="message" required></textarea></label>
              <label class="consent"><input type="checkbox" name="popia_consent" value="yes" required> <span>I agree that KALM Collective may use my details to respond to this enquiry.</span></label>
              <button class="button primary" type="submit">Send message</button>
              <p class="form-status" role="status"></p>
            </form>
          </section>
        </section>
        ${renderFooter()}
      </div>
    `;
    bindForms();
    focusApp();
  }

  function renderPolicies() {
    app.innerHTML = `
      <div class="page">
        <section class="simple-page container">
          <p class="micro">Policies</p>
          <h1>Store policies.</h1>
          <p class="lead">These policies are prepared for assisted enquiries and can be tightened once the payment gateway and courier rules are connected.</p>
          <section class="section policies-grid">
            <article class="policy-card"><h2>Returns and exchanges</h2><p>Unworn items with tags and packaging can be reviewed for return or exchange within 7 days of receipt. Hygiene-sensitive items must be unworn and unwashed.</p></article>
            <article class="policy-card"><h2>Privacy and POPIA</h2><p>Customer details are used to respond to orders, delivery, size help and service questions. Details are not sold.</p></article>
            <article class="policy-card"><h2>Delivery</h2><p>Courier rules and rates are being configured. Delivery area is captured during checkout assistance so KALM can confirm the correct handoff.</p></article>
            <article class="policy-card"><h2>Payment</h2><p>Live payment is not connected yet. Card details are not collected on this website until the selected provider is activated.</p></article>
            <article class="policy-card"><h2>Terms</h2><p>Orders are confirmed only after stock, size, payment and delivery details are agreed directly with KALM Collective.</p></article>
          </section>
        </section>
        ${renderFooter()}
      </div>
    `;
    focusApp();
  }

  function bindForms() {
    document.querySelectorAll("form[data-assistance-form], form[data-contact-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        track("form_submit", { name: form.getAttribute("name") });
        if (["localhost", "127.0.0.1"].includes(location.hostname)) {
          event.preventDefault();
          const status = form.querySelector(".form-status");
          status.textContent = "Request captured locally. On Netlify, this form submits to the store inbox.";
          form.reset();
        }
      });
    });
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div class="footer-inner">
          <div>
            <img src="branding/kalm-collective-display-logo.png" alt="KALM Collective">
            <p>KS Active archive styles and KALM Move concept activewear under one KALM Collective storefront.</p>
          </div>
          <nav class="footer-links" aria-label="Footer navigation">
            <a href="#/shop">Shop</a>
            <a href="#/brand/ks-active">KS Active</a>
            <a href="#/brand/kalm-move">KALM Move</a>
            <a href="#/contact">Contact</a>
            <a href="#/policies">Policies</a>
          </nav>
        </div>
      </footer>
    `;
  }

  function productById(id) {
    return state.products.find((product) => product.id === id);
  }

  function cartCount() {
    return state.cart.reduce((total, line) => total + line.qty, 0);
  }

  function cartSubtotal() {
    return state.cart.reduce((total, line) => {
      const product = productById(line.productId);
      return total + (product ? product.price * line.qty : 0);
    }, 0);
  }

  function cartSummaryText() {
    if (!state.cart.length) return "Enquiry bag is empty";
    return state.cart.map((line) => {
      const product = productById(line.productId);
      return `${product.title} / ${line.size} / ${line.color} / qty ${line.qty} / ${formatMoney(product.price * line.qty)}`;
    }).join(" | ");
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("kalmCollectiveCart") || "[]");
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem("kalmCollectiveCart", JSON.stringify(state.cart));
  }

  function formatMoney(value) {
    return money.format(value).replace(/\s/g, "");
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
  }

  function renderEmpty(message) {
    return `<div class="empty-state"><p>${escapeHtml(message)}</p></div>`;
  }

  function renderError(message) {
    return `<section class="checkout container"><h1>Storefront unavailable</h1><p>${escapeHtml(message)}</p></section>`;
  }

  function focusApp() {
    app.focus({ preventScroll: true });
  }

  function track(eventName, payload) {
    window.kalmStoreEvents = window.kalmStoreEvents || [];
    const event = { event: eventName, payload, ts: new Date().toISOString() };
    window.kalmStoreEvents.push(event);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
})();
