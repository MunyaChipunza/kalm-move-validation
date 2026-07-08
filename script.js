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
      search: ""
    }
  };

  const routes = {
    home: /^#\/?$/,
    shop: /^#\/shop$/,
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
    const featured = state.products.filter((product) => ["kalm-everyday-movement-legging", "kalm-modest-performance-tee", "ks-seamless-breathable-leggings", "ks-crisscross-back-sports-bra"].includes(product.id));
    app.innerHTML = `
      <div class="page">
        <section class="hero">
          <div class="hero-copy">
            <h1>Activewear for real routines.</h1>
            <p>KALM Collective brings KS Active archive styles and the new KALM Move line into one calm, practical activewear shop.</p>
            <div class="hero-actions">
              <a class="button primary" href="#/shop">Shop all products</a>
              <a class="button secondary" href="#/brand/ks-active">Shop by brand</a>
            </div>
            <div class="hero-strip" aria-label="Store highlights">
              <div><strong>KS Active</strong><span>Archive stock and original styles</span></div>
              <div><strong>KALM Move</strong><span>New everyday movement line</span></div>
              <div><strong>Assisted checkout</strong><span>Order help while payment setup is finalised</span></div>
            </div>
          </div>
          <figure class="hero-media">
            <img src="assets/images/home-hero-shop.webp" alt="KALM Collective activewear campaign with women in practical everyday movement outfits">
          </figure>
        </section>

        <section class="section soft">
          <div class="container">
            <div class="section-head">
              <div>
                <h2>Shop by brand</h2>
                <p>Move between the original KS Active archive range and the new KALM Move collection.</p>
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
                <p>Cart-ready product pages with size, colour and order-assistance capture.</p>
              </div>
              <a class="button text" href="#/shop">Open shop</a>
            </div>
            <div class="product-grid">${featured.map(renderProductCard).join("")}</div>
          </div>
        </section>

        <section class="section soft">
          <div class="container about-grid">
            <div>
              <p class="micro">Store setup</p>
              <h2>Checkout assistance is live; payment and shipping setup are next.</h2>
            </div>
            <div class="panel">
              <p>Products can be added to cart, edited and sent through order assistance. Live card payment and automated courier rates are intentionally not connected until the selected South African payment provider and shipping rules are configured.</p>
              <a class="button primary" href="#/checkout">Go to checkout assistance</a>
            </div>
          </div>
        </section>
        ${renderFooter()}
      </div>
    `;
    bindProductCards();
    focusApp();
  }

  function renderBrandTile(brand) {
    return `
      <article class="brand-tile">
        <div class="brand-tile-content">
          <div>
            <p class="micro">${escapeHtml(brand.role)}</p>
            <h3>${escapeHtml(brand.name)}</h3>
            <p>${escapeHtml(brand.summary)}</p>
          </div>
          <a class="button primary" href="#/brand/${brand.id}">Shop ${escapeHtml(brand.name)}</a>
        </div>
        <img src="${brand.tileImage}" alt="${escapeHtml(brand.name)} activewear category image">
      </article>
    `;
  }

  function renderShop(prefill = {}) {
    state.filters = { ...state.filters, ...prefill };
    const filtered = getFilteredProducts();
    app.innerHTML = `
      <div class="page">
        <section class="checkout container">
          <p class="micro">Shop</p>
          <h1>All products</h1>
          <p>Browse KS Active archive stock and KALM Move products by brand, product type, size, colour and price.</p>
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
                <span>Assisted checkout enabled</span>
              </div>
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
    document.querySelector("[data-clear-filters]").addEventListener("click", () => {
      state.filters = { brand: "all", type: "all", size: "all", color: "all", price: "all", search: "" };
      renderShop();
      track("product_filters_clear", {});
    });
  }

  function getFilteredProducts() {
    const search = state.filters.search.trim().toLowerCase();
    return state.products.filter((product) => {
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
  }

  function renderBrand(brandId) {
    const brand = state.brands.find((item) => item.id === brandId);
    if (!brand) return renderShop();
    const products = state.products.filter((product) => product.brandId === brandId);
    app.innerHTML = `
      <div class="page">
        <section class="brand-hero">
          <img src="${brand.heroImage}" alt="${escapeHtml(brand.name)} campaign image">
          <div class="brand-hero-content">
            <img class="brand-mark" src="${brand.logo}" alt="${escapeHtml(brand.name)} logo">
            <h1>${escapeHtml(brand.name)}</h1>
            <p>${escapeHtml(brand.summary)}</p>
            <a class="button primary" href="#/shop">Shop ${escapeHtml(brand.name)}</a>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="section-head">
              <div>
                <h2>${brandId === "ks-active" ? "Archive stock" : "New collection"}</h2>
                <p>${brandId === "ks-active" ? "Historical workbook quantities exist, but final availability is confirmed through order assistance before payment." : "Practical movement wear designed around everyday routines, calm styling and easy outfit building."}</p>
              </div>
              <a class="button secondary" href="#/shop">All products</a>
            </div>
            <div class="product-grid">${products.map(renderProductCard).join("")}</div>
          </div>
        </section>
        ${brandId === "kalm-move" ? renderMoveStory() : renderArchiveStory()}
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
            <p>The archive range keeps the KS Active name for the original products while removing older body-shaping language from the public shop. Size and colour requests are confirmed before payment so the store does not oversell remaining stock.</p>
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
            <p>KALM Move uses the buffalo brand family and a practical product language: leggings, support layers, modest tees and full looks that work for walks, errands, home-to-gym transitions and calm outdoor movement.</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-head">
            <div>
              <h2>Everyday movement scenes</h2>
              <p>Legging, support layer and modest tee styling for real routines.</p>
            </div>
          </div>
          <div class="image-rail">
            <figure><img src="assets/images/legging-lifestyle.webp" alt="KALM Move legging lifestyle image"><figcaption>Everyday legging</figcaption></figure>
            <figure><img src="assets/images/bra-lifestyle.webp" alt="KALM Move sports bra lifestyle image"><figcaption>Support layer</figcaption></figure>
            <figure><img src="assets/images/tee-lifestyle.webp" alt="KALM Move modest tee lifestyle image"><figcaption>Modest tee</figcaption></figure>
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
              <img src="${product.image}" alt="${escapeHtml(product.title)} product image">
            </div>
          </div>
          <div class="product-info">
            <div>
              <p class="micro">${escapeHtml(product.brand)} / ${escapeHtml(product.collection)}</p>
              <h1>${escapeHtml(product.title)}</h1>
              <p class="detail-copy">${escapeHtml(product.description)}</p>
            </div>
            <div class="price">${formatMoney(product.price)}</div>
            <div class="status-note">${escapeHtml(product.stockLabel)}. Checkout is being finalised. Contact us to complete this order.</div>
            <div class="option-panel">
              <div class="selectors">
                <label>Size${renderOptionSelect(product, "size")}</label>
                <label>Colour${renderOptionSelect(product, "color")}</label>
              </div>
              <button class="button primary" type="button" data-add-to-cart="${product.id}">Add to cart</button>
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
          <img src="${product.image}" alt="${escapeAttr(product.title)} product image" loading="lazy">
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
            <button class="button primary" type="button" data-add-to-cart="${product.id}">Add to cart</button>
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
        const scope = button.closest(".product-card, .option-panel, .product-info") || document;
        const size = scope.querySelector(`[data-size-select="${cssEscape(productId)}"]`)?.value || "";
        const color = scope.querySelector(`[data-color-select="${cssEscape(productId)}"]`)?.value || "";
        if (!size || !color) {
          button.textContent = "Choose size and colour";
          setTimeout(() => (button.textContent = "Add to cart"), 1300);
          return;
        }
        addToCart(productId, size, color);
        button.textContent = "Added";
        setTimeout(() => (button.textContent = "Add to cart"), 1200);
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
    track("add_to_cart", { productId, title: product.title, brand: product.brand, size, color, price: product.price });
  }

  function renderCart() {
    cartCountEl.textContent = cartCount();
    cartSubtotalEl.textContent = formatMoney(cartSubtotal());
    if (!state.cart.length) {
      cartItemsEl.innerHTML = renderEmpty("Your cart is empty. Add products to request checkout assistance.");
      return;
    }
    cartItemsEl.innerHTML = state.cart.map((line) => {
      const product = productById(line.productId);
      return `
        <div class="cart-line">
          <img src="${product.image}" alt="${escapeAttr(product.title)}">
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
          <p class="micro">Checkout assistance</p>
          <h1>Complete this order with KALM.</h1>
          <p>Checkout is being finalised. Contact us to complete this order.</p>
          <div class="checkout-grid">
            <div class="panel soft">
              <h2>Cart</h2>
              ${state.cart.length ? `<div class="order-list">${state.cart.map(renderOrderLine).join("")}</div>` : renderEmpty("Your cart is empty.")}
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
              <label class="consent"><input type="checkbox" name="popia_consent" value="yes" required> <span>I agree that KALM Collective may use my details to respond to this order assistance request and stock or size questions.</span></label>
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
        <img src="${product.image}" alt="${escapeAttr(product.title)}">
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
                <p>The original activewear brand, now held as an archive stock section with cleaner product copy and order assistance before final payment.</p>
                <a class="button secondary" href="#/brand/ks-active">Shop KS Active</a>
              </article>
              <article class="about-card">
                <h2>KALM Move</h2>
                <p>New activewear for real routines: walking, school-run-to-training, errands, light gym and calm outdoor movement.</p>
                <a class="button secondary" href="#/brand/kalm-move">Shop KALM Move</a>
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
                <label>Topic<select name="topic" required><option>Order assistance</option><option>Size help</option><option>Stock question</option><option>Returns or exchange</option></select></label>
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
          <p class="lead">These policies are prepared for assisted checkout and can be tightened once the payment gateway and courier rules are connected.</p>
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
            <img src="branding/kalm-collective-logo-light.svg" alt="KALM Collective">
            <p>KS Active archive stock and KALM Move activewear under one KALM Collective storefront.</p>
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
    if (!state.cart.length) return "Cart is empty";
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
