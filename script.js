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
  bag: loadBag()
};

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0
});

init();

async function init() {
  bindChrome();
  try {
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
  const route = getRoute();
  closeBag();
  nav?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");

  if (route.path === "/" || route.path === "") return renderHome();
  if (route.path === "/shop") return renderShop(route.params);
  if (route.path === "/brands") return renderBrands();
  if (route.path.startsWith("/brand/")) return renderBrand(route.path.split("/").pop());
  if (route.path.startsWith("/product/")) return renderProduct(route.path.split("/").pop());
  if (route.path === "/cart") return renderCartPage();
  if (route.path === "/checkout") return renderCheckout();
  if (route.path === "/contact") return renderContact();
  if (route.path === "/policies") return renderPolicies();
  if (route.path === "/account") return renderAccount();
  renderNotFound();
}

function getRoute() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return {
    path,
    params: new URLSearchParams(query)
  };
}

function renderHome() {
  const { meta, brands, categories, products } = state.data;
  const arrivals = products.filter((product) => product.tags.includes("new-in")).slice(0, 8);
  const featured = [
    products.find((product) => product.id === "kalm-move-studio-starter-set"),
    products.find((product) => product.id === "kalm-home-white-cotton-bedding-set"),
    products.find((product) => product.id === "kalm-living-woven-throw-blanket")
  ].filter(Boolean);

  app.innerHTML = `
    <section class="hero-shell">
      <div class="hero-copy">
        <p class="eyebrow">KALM Collective</p>
        <h1>Premium essentials for movement and everyday living.</h1>
        <p>Shop activewear, wellness accessories, living pieces and home staples from the KALM brand family.</p>
        <div class="hero-actions">
          <a class="button primary" href="#/shop?category=new-in">Shop new arrivals</a>
          <a class="button secondary" href="#/brands">Explore brands</a>
        </div>
      </div>
      <a class="hero-media" href="#/shop" aria-label="Shop KALM Collective">
        <img src="${escapeHtml(meta.heroImage)}" alt="KALM Collective activewear and lifestyle products">
      </a>
    </section>

    <section class="brand-ribbon" aria-label="Featured brands">
      ${brands.map(renderBrandLogoCard).join("")}
    </section>

    ${renderProductRail("New Arrivals", arrivals, "#/shop?category=new-in")}

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">Shop by category</p>
          <h2>Find your edit</h2>
        </div>
      </div>
      <div class="category-grid">
        ${categories.filter((category) => category.id !== "new-in").map(renderCategoryTile).join("")}
      </div>
    </section>

    <section class="feature-band">
      <div>
        <p class="eyebrow">Featured collection</p>
        <h2>Core pieces for calm routines.</h2>
        <p>Build a clean everyday rotation across training, recovery, living spaces and home essentials.</p>
        <a class="button primary" href="#/shop">Shop the edit</a>
      </div>
      <img src="${escapeHtml(meta.featureImage)}" alt="KALM Collective featured products">
    </section>

    ${renderProductRail("Most Wanted", featured, "#/shop")}

    <section class="newsletter-panel">
      <div>
        <p class="eyebrow">Community</p>
        <h2>Join the KALM Collective.</h2>
        <p>Receive new arrivals, care notes and private offers from the brand family.</p>
      </div>
      <form data-newsletter-form>
        <label class="sr-only" for="newsletter-email">Email address</label>
        <input id="newsletter-email" type="email" placeholder="Enter your email" required>
        <button class="button primary" type="submit">Subscribe</button>
        <p class="form-status" data-newsletter-status></p>
      </form>
    </section>

    ${renderFooter()}
  `;

  bindNewsletter();
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
        ${products.map(renderProductCard).join("")}
      </div>
    </section>
  `;
}

function renderShop(params = new URLSearchParams()) {
  const brand = params.get("brand") || "all";
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "featured";
  const search = params.get("search") || "";
  const products = sortProducts(filterProducts({ brand, category, search }), sort);
  const heading = shopHeading({ brand, category, search });

  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Shop</p>
      <h1>${escapeHtml(heading)}</h1>
      <p>${products.length} products across KS Active, KALM Move, KALM Living, KALM Wellness and KALM Home.</p>
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
          <label>Sort
            <select name="sort">
              <option value="featured" ${sort === "featured" ? "selected" : ""}>Featured</option>
              <option value="newest" ${sort === "newest" ? "selected" : ""}>Newest</option>
              <option value="price-asc" ${sort === "price-asc" ? "selected" : ""}>Price low to high</option>
              <option value="price-desc" ${sort === "price-desc" ? "selected" : ""}>Price high to low</option>
            </select>
          </label>
          <label>Search
            <input name="search" value="${escapeAttribute(search)}" placeholder="Product or brand">
          </label>
        </form>
      </aside>
      <div>
        <div class="shop-toolbar">
          <span>${products.length} styles</span>
          <a href="#/shop">Clear filters</a>
        </div>
        <div class="product-grid">
          ${products.length ? products.map(renderProductCard).join("") : renderEmptyState("No products match those filters.")}
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
}

function renderBrands() {
  app.innerHTML = `
    <section class="page-hero">
      <p class="eyebrow">Brands</p>
      <h1>The KALM Collective family.</h1>
      <p>Five connected brands, each built around simple essentials for movement, wellness, living and home.</p>
    </section>

    <section class="brand-grid">
      ${state.data.brands.map((brand) => `
        <article class="brand-card-large">
          <a href="#/brand/${brand.id}">
            <img class="brand-image" src="${escapeHtml(brand.heroImage)}" alt="${escapeAttribute(brand.name)} products">
            <div class="brand-content">
              <img class="brand-card-logo" src="${escapeHtml(brand.logo)}" alt="${escapeAttribute(brand.name)}">
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
}

function renderBrand(brandId) {
  const brand = state.data.brands.find((item) => item.id === brandId);
  if (!brand) return renderNotFound();
  const products = state.data.products.filter((product) => product.brandId === brand.id);
  app.innerHTML = `
    <section class="brand-hero">
      <div>
        <img class="brand-hero-logo" src="${escapeHtml(brand.logo)}" alt="${escapeAttribute(brand.name)}">
        <p class="eyebrow">${escapeHtml(brand.role)}</p>
        <h1>${escapeHtml(brand.name)}</h1>
        <p>${escapeHtml(brand.summary)}</p>
        <a class="button primary" href="#/shop?brand=${brand.id}">Shop ${escapeHtml(brand.name)}</a>
      </div>
      <img src="${escapeHtml(brand.heroImage)}" alt="${escapeAttribute(brand.name)} edit">
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">${escapeHtml(brand.name)}</p>
          <h2>${products.length} styles</h2>
        </div>
      </div>
      <div class="product-grid">
        ${products.map(renderProductCard).join("")}
      </div>
    </section>

    ${renderFooter()}
  `;
}

function renderProduct(slug) {
  const product = state.data.products.find((item) => item.slug === slug);
  if (!product) return renderNotFound();
  const related = state.data.products
    .filter((item) => item.brandId === product.brandId && item.id !== product.id)
    .slice(0, 4);

  app.innerHTML = `
    <section class="product-detail" data-product-scope>
      <div class="product-gallery">
        <img src="${escapeHtml(product.image)}" alt="${escapeAttribute(product.title)}">
      </div>
      <div class="product-info">
        <a class="eyebrow" href="#/brand/${product.brandId}">${escapeHtml(product.brand)}</a>
        <h1>${escapeHtml(product.title)}</h1>
        <div class="price-line">${renderPrice(product)}</div>
        <p class="stock-line">${escapeHtml(product.stockLabel)}</p>
        <p>${escapeHtml(product.description)}</p>

        <div class="selector-row">
          <label>Colour
            <select data-color-select>
              ${product.colors.map((color) => `<option>${escapeHtml(color)}</option>`).join("")}
            </select>
          </label>
          <label>Size
            <select data-size-select>
              ${product.sizes.map((size) => `<option>${escapeHtml(size)}</option>`).join("")}
            </select>
          </label>
        </div>

        <button class="button primary full" type="button" data-add-to-bag="${product.id}">${escapeHtml(product.ctaLabel)}</button>

        <div class="accordion-list">
          <details open>
            <summary>Product details</summary>
            <ul>${product.detailBullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </details>
          <details>
            <summary>Fit and fabric</summary>
            <p>${escapeHtml(product.fitNotes)}</p>
            <p>${escapeHtml(product.fabric)}</p>
          </details>
          <details>
            <summary>Care</summary>
            <p>${escapeHtml(product.care)}</p>
          </details>
        </div>
      </div>
    </section>

    ${renderProductRail("More from " + product.brand, related, "#/shop?brand=" + product.brandId)}
    ${renderFooter()}
  `;
}

function renderCartPage() {
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
}

function renderCheckout() {
  const subtotal = getSubtotal();
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Checkout</p>
      <h1>Complete your order.</h1>
      <p>Enter your details, choose delivery and select a payment method.</p>
    </section>

    <section class="checkout-layout">
      <form class="checkout-form panel" name="kalm-collective-order" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-order-form>
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

        <label>Order notes<textarea name="notes" rows="4" placeholder="Sizing, delivery or gift notes"></textarea></label>
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
}

function renderContact() {
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Customer care</p>
      <h1>How can we help?</h1>
      <p>For product, order, delivery and brand enquiries, send a note to the KALM Collective team.</p>
    </section>
    <section class="contact-layout">
      <form class="panel checkout-form" name="kalm-collective-contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html">
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
        <button class="button primary" type="submit">Send message</button>
      </form>
      <aside class="care-panel">
        <h2>Customer Care</h2>
        <p>Email: hello@kalmcollective.com</p>
        <p>Hours: Monday to Friday, 09:00 to 17:00 SAST.</p>
        <p>Follow: @kalmcollective</p>
      </aside>
    </section>
    ${renderFooter()}
  `;
}

function renderPolicies() {
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Policies</p>
      <h1>Customer information.</h1>
      <p>Delivery, returns, payment and privacy details for shopping with KALM Collective.</p>
    </section>
    <section class="policy-grid">
      <article class="policy-card" id="delivery"><h2>Delivery</h2><p>Courier delivery is available across South Africa. Standard delivery takes 2 to 5 business days after order confirmation, with express delivery available in selected areas.</p></article>
      <article class="policy-card" id="returns"><h2>Returns</h2><p>Returns are accepted within 30 days on unworn apparel and unused home or wellness items in their original condition and packaging.</p></article>
      <article class="policy-card"><h2>Payment</h2><p>Checkout supports PayFast, Ozow and EFT selections. Order receipts are sent to the email address provided at checkout.</p></article>
      <article class="policy-card"><h2>Privacy</h2><p>KALM Collective processes customer information for orders, delivery, customer care and opt-in marketing in line with POPIA.</p></article>
    </section>
    ${renderFooter()}
  `;
}

function renderAccount() {
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">Account</p>
      <h1>Customer account.</h1>
      <p>Use your email for order updates, product care and private offers.</p>
    </section>
    <section class="contact-layout">
      <form class="panel checkout-form">
        <label>Email address<input type="email" required placeholder="you@example.com"></label>
        <button class="button primary" type="submit">Continue</button>
      </form>
      <aside class="care-panel">
        <h2>Benefits</h2>
        <p>Order updates, faster checkout details and early access to KALM Collective edits.</p>
      </aside>
    </section>
    ${renderFooter()}
  `;
}

function renderNotFound() {
  app.innerHTML = `
    <section class="page-hero compact">
      <p class="eyebrow">KALM Collective</p>
      <h1>Page not found.</h1>
      <p>Return to the shop or explore the brand family.</p>
      <a class="button primary" href="#/shop">Shop now</a>
    </section>
    ${renderFooter()}
  `;
}

function renderBrandLogoCard(brand) {
  return `
    <a class="brand-logo-card" href="#/brand/${brand.id}">
      <img src="${escapeHtml(brand.logo)}" alt="${escapeAttribute(brand.name)}">
      <span>${escapeHtml(brand.name)}</span>
    </a>
  `;
}

function renderCategoryTile(category) {
  return `
    <a class="category-tile" href="#/shop?category=${category.id}">
      <img src="${escapeHtml(category.image)}" alt="${escapeAttribute(category.name)}">
      <span>${escapeHtml(category.name)}</span>
    </a>
  `;
}

function renderProductCard(product) {
  return `
    <article class="product-card" data-product-scope>
      <a class="product-media" href="#/product/${product.slug}" aria-label="${escapeAttribute(product.title)}">
        ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
        <img src="${escapeHtml(product.image)}" alt="${escapeAttribute(product.title)}" loading="lazy">
      </a>
      <div class="product-card-body">
        <a class="product-brand" href="#/brand/${product.brandId}">${escapeHtml(product.brand)}</a>
        <h3><a href="#/product/${product.slug}">${escapeHtml(product.title)}</a></h3>
        <div class="price-line">${renderPrice(product)}</div>
        <div class="swatches" aria-label="Available colours">
          ${product.colors.slice(0, 4).map((color) => `<span title="${escapeAttribute(color)}" style="--swatch:${swatch(color)}"></span>`).join("")}
        </div>
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

function renderBagLine(item) {
  const product = findProduct(item.productId);
  if (!product) return "";
  return `
    <div class="bag-line">
      <img src="${escapeHtml(product.image)}" alt="${escapeAttribute(product.title)}">
      <div>
        <a href="#/product/${product.slug}">${escapeHtml(product.title)}</a>
        <p>${escapeHtml(item.color)} / ${escapeHtml(item.size)}</p>
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
  return `
    <div class="order-line">
      <img src="${escapeHtml(product.image)}" alt="${escapeAttribute(product.title)}">
      <div>
        <strong>${escapeHtml(product.title)}</strong>
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
  const size = selectedSize || product.sizes[0];
  const color = selectedColor || product.colors[0];
  const key = `${productId}::${size}::${color}`;
  const item = state.bag.find((entry) => entry.key === key);
  if (item) item.qty += 1;
  else state.bag.push({ key, productId, size, color, qty: 1 });
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
  document.body.classList.add("bag-open");
}

function closeBag() {
  cartDrawer?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("bag-open");
}

function openSearch() {
  searchPanel.hidden = false;
  siteSearch?.focus();
}

function closeSearch() {
  searchPanel.hidden = true;
}

function filterProducts({ brand = "all", category = "all", search = "" }) {
  const term = search.trim().toLowerCase();
  return state.data.products.filter((product) => {
    const brandMatch = brand === "all" || product.brandId === brand;
    const categoryMatch = category === "all"
      || product.category === category
      || product.tags.includes(category)
      || (category === "sale" && product.compareAtPrice)
      || (category === "new-in" && product.tags.includes("new-in"));
    const searchMatch = !term || [
      product.title,
      product.brand,
      product.collection,
      product.type,
      product.description,
      product.tags.join(" ")
    ].join(" ").toLowerCase().includes(term);
    return brandMatch && categoryMatch && searchMatch;
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
  for (const key of ["brand", "category", "sort", "search"]) {
    const value = values.get(key);
    if (value && value !== "all" && value !== "featured") params.set(key, value);
  }
  window.location.hash = `#/shop${params.toString() ? "?" + params.toString() : ""}`;
}

function shopHeading({ brand, category, search }) {
  if (search) return `Search results for "${search}"`;
  if (brand && brand !== "all") return state.data.brands.find((item) => item.id === brand)?.name || "Shop";
  if (category && category !== "all") return state.data.categories.find((item) => item.id === category)?.name || "Shop";
  return "Shop All";
}

function bindNewsletter() {
  document.querySelector("[data-newsletter-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-newsletter-status]");
    status.textContent = "You are subscribed to KALM Collective updates.";
    event.currentTarget.reset();
  });
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
    return product ? `${item.qty} x ${product.title} (${item.color}, ${item.size})` : "";
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
          <img src="branding/kalm-collective-display-logo.png" alt="KALM Collective">
          <p>Premium essentials for movement and everyday living.</p>
        </div>
        <div>
          <h3>Shop</h3>
          <a href="#/shop?category=new-in">New In</a>
          <a href="#/shop?category=women">Women</a>
          <a href="#/shop?category=activewear">Activewear</a>
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
          <p>kalmcollective.com</p>
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
