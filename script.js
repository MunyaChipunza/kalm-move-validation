const events = [];
const productState = new Map();

function track(eventName, payload = {}) {
  const event = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  events.push(event);
  window.kalmMoveEvents = events;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
  console.info("KALM Move validation event", event);
}

function options(values) {
  return values.map((value) => `<option value="${value}">${value}</option>`).join("");
}

function encodeFormData(form) {
  const data = new FormData(form);
  return new URLSearchParams(data).toString();
}

function showModal(productName) {
  const modal = document.querySelector("#validation-modal");
  modal.hidden = false;
  modal.dataset.product = productName || "";
  modal.querySelector(".modal-close").focus();
}

function closeModal() {
  document.querySelector("#validation-modal").hidden = true;
}

function buildProductCard(product) {
  productState.set(product.id, {
    size: "",
    colour: "",
    priceAccepted: false,
  });

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name} product direction flatlay" loading="lazy">
        <span class="product-status">${product.status}</span>
      </div>
      <div class="product-body">
        <div>
          <p class="product-meta">${product.category}</p>
          <h3>${product.name}</h3>
        </div>
        <p>${product.short}</p>
        <div class="price">${product.priceLabel}</div>
        <div class="selector-row">
          <label>Size
            <select class="size-select" data-product-id="${product.id}" data-product="${product.name}">
              <option value="">Choose</option>${options(product.sizes)}
            </select>
          </label>
          <label>Colour
            <select class="colour-select" data-product-id="${product.id}" data-product="${product.name}">
              <option value="">Choose</option>${options(product.colours)}
            </select>
          </label>
        </div>
        <p class="proof-note">${product.proofNote}</p>
        <div class="card-actions">
          <button class="button secondary price-button" type="button" data-product-id="${product.id}" data-product="${product.name}" data-price="${product.price}">Price feels possible</button>
          <button class="button primary fake-checkout" type="button" data-product-id="${product.id}" data-product="${product.name}">Fake-door checkout</button>
        </div>
      </div>
    </article>
  `;
}

async function loadProducts() {
  const response = await fetch("products.json");
  if (!response.ok) throw new Error("Could not load products.json");
  const products = await response.json();
  const grid = document.querySelector("#product-grid");
  const productSelect = document.querySelector("select[name='product']");

  productSelect.innerHTML = '<option value="">Choose one</option>';
  grid.innerHTML = products.map(buildProductCard).join("");
  productSelect.insertAdjacentHTML(
    "beforeend",
    products.map((product) => `<option value="${product.name}">${product.name}</option>`).join("")
  );
}

document.addEventListener("click", (event) => {
  const trackedLink = event.target.closest("[data-event]");
  if (trackedLink) {
    track(trackedLink.dataset.event);
  }

  const card = event.target.closest(".product-card");
  if (card && !event.target.closest("button") && !event.target.closest("select")) {
    track("product_card_click", { productId: card.dataset.productId });
  }

  const priceButton = event.target.closest(".price-button");
  if (priceButton) {
    const state = productState.get(priceButton.dataset.productId) || {};
    state.priceAccepted = true;
    productState.set(priceButton.dataset.productId, state);
    priceButton.textContent = "Price noted";
    track("price_acceptance_click", {
      productId: priceButton.dataset.productId,
      product: priceButton.dataset.product,
      price: priceButton.dataset.price,
    });
  }

  const fakeCheckout = event.target.closest(".fake-checkout");
  if (fakeCheckout) {
    track("fake_checkout_click", {
      productId: fakeCheckout.dataset.productId,
      product: fakeCheckout.dataset.product,
      note: "Validation only. No payment taken.",
    });
    showModal(fakeCheckout.dataset.product);
  }

  if (event.target.closest(".modal-close")) {
    closeModal();
  }

  if (event.target.id === "validation-modal") {
    closeModal();
  }
});

document.addEventListener("change", (event) => {
  const sizeSelect = event.target.closest(".size-select");
  if (sizeSelect) {
    const state = productState.get(sizeSelect.dataset.productId) || {};
    state.size = sizeSelect.value;
    productState.set(sizeSelect.dataset.productId, state);
    track("size_selection", {
      productId: sizeSelect.dataset.productId,
      product: sizeSelect.dataset.product,
      size: sizeSelect.value,
    });
  }

  const colourSelect = event.target.closest(".colour-select");
  if (colourSelect) {
    const state = productState.get(colourSelect.dataset.productId) || {};
    state.colour = colourSelect.value;
    productState.set(colourSelect.dataset.productId, state);
    track("colour_selection", {
      productId: colourSelect.dataset.productId,
      product: colourSelect.dataset.product,
      colour: colourSelect.value,
    });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

document.querySelector("#waitlist-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector("#form-status");
  status.classList.remove("error");
  status.textContent = "Submitting...";

  if (!form.checkValidity()) {
    status.textContent = "Please complete the required fields.";
    status.classList.add("error");
    form.reportValidity();
    return;
  }

  const formData = Object.fromEntries(new FormData(form).entries());
  const saved = JSON.parse(localStorage.getItem("kalmMoveWaitlist") || "[]");
  saved.push({ ...formData, createdAt: new Date().toISOString() });
  localStorage.setItem("kalmMoveWaitlist", JSON.stringify(saved));

  track("waitlist_submit", {
    product: formData.product,
    size: formData.size,
    colour: formData.colour,
    priceComfort: formData.price_comfort,
  });

  const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  if (!isLocal) {
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeFormData(form),
      });
      if (!response.ok) throw new Error("Netlify form submission failed");
    } catch (error) {
      console.warn(error);
      status.textContent = "Interest was recorded locally, but the hosted form endpoint did not confirm receipt.";
      status.classList.add("error");
      return;
    }
  }

  status.textContent = "Interest recorded. No payment was taken.";
  form.reset();
});

track("page_view", { page: "kalm_move_validation_site" });
loadProducts().catch((error) => {
  console.error(error);
  document.querySelector("#product-grid").innerHTML = "<p class=\"form-status error\">Product previews could not be loaded.</p>";
});
