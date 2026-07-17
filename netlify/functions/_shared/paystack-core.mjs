import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ORDER_STATES = Object.freeze([
  "draft",
  "pending_payment",
  "payment_processing",
  "paid",
  "payment_failed",
  "payment_abandoned",
  "cancelled",
  "refunded"
]);

const PAYSTACK_API_BASE = "https://api.paystack.co";
const MAX_LINE_QUANTITY = 5;
const MAX_CART_LINES = 15;
const PENDING_ORDER_TTL_MS = 24 * 60 * 60 * 1000;
const REFERENCE_PATTERN = /^[A-Za-z0-9.=-]+$/;

export class PaymentError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

export function errorResponse(error) {
  if (error instanceof PaymentError) {
    return json({ ok: false, code: error.code, message: error.message }, error.status);
  }
  return json({ ok: false, code: "payment_unavailable", message: "Secure payment is temporarily unavailable. Please try again." }, 503);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new PaymentError("invalid_request", "Please review the checkout details and try again.");
  }
}

export function getRuntimeConfig(context, request) {
  const environment = globalThis.Netlify?.env;
  const get = typeof environment?.get === "function" ? environment.get.bind(environment) : () => undefined;
  const mode = String(get("PAYSTACK_MODE") || "test").trim().toLowerCase();
  const hostname = request ? new URL(request.url).hostname.toLowerCase() : "";
  const isProductionHost = hostname === "kalmcollective.co.za" || hostname === "www.kalmcollective.co.za";
  const isProductionDeploy = isProductionHost || context?.deploy?.published === true || context?.deploy?.context === "production";
  const checkoutRequested = String(get("PAYSTACK_CHECKOUT_ENABLED") || "false").toLowerCase() === "true";
  const liveEnabled = String(get("PAYSTACK_LIVE_ENABLED") || "false").toLowerCase() === "true";
  const testPublicKey = get("PAYSTACK_TEST_PUBLIC_KEY") || "";
  const testSecretKey = get("PAYSTACK_TEST_SECRET_KEY") || "";
  const livePublicKey = get("PAYSTACK_LIVE_PUBLIC_KEY") || "";
  const liveSecretKey = get("PAYSTACK_LIVE_SECRET_KEY") || "";
  const webhookSecretSource = String(get("PAYSTACK_WEBHOOK_SECRET_SOURCE") || "PAYSTACK_TEST_SECRET_KEY");

  if (!["test", "live"].includes(mode)) {
    throw new PaymentError("invalid_payment_mode", "Secure payment is not configured.", 503);
  }

  const testKeysPresent = Boolean(testPublicKey && testSecretKey);
  const liveKeysPresent = Boolean(livePublicKey && liveSecretKey);
  const testCheckoutEnabled = mode === "test" && checkoutRequested && !isProductionDeploy && testKeysPresent;
  const liveCheckoutEnabled = mode === "live" && checkoutRequested && liveEnabled && isProductionDeploy && liveKeysPresent;
  const checkoutEnabled = testCheckoutEnabled || liveCheckoutEnabled;
  const checkoutState = checkoutEnabled
    ? "available"
    : isProductionDeploy
      ? "production_fallback"
      : mode === "test" && !testKeysPresent
        ? "configuration_required"
        : "disabled";

  return {
    mode,
    isProductionDeploy,
    checkoutRequested,
    liveEnabled,
    testKeysPresent,
    liveKeysPresent,
    webhookSecretSource,
    checkoutEnabled,
    checkoutState,
    activeSecretKey: mode === "test" ? testSecretKey : liveSecretKey
  };
}

export function publicRuntimeConfig(config) {
  return {
    ok: true,
    mode: config.mode,
    testMode: config.mode === "test",
    checkoutEnabled: config.checkoutEnabled,
    checkoutState: config.checkoutState,
    isProductionDeploy: config.isProductionDeploy,
    message: config.checkoutEnabled
      ? "Paystack test checkout is ready. No real payment will be taken."
      : config.checkoutState === "configuration_required"
        ? "Paystack test checkout needs secure test-key configuration. No payment can be taken."
        : config.checkoutState === "production_fallback"
          ? "Secure payment is not enabled on the live store yet."
          : "Secure payment is not available."
  };
}

export function assertCheckoutAvailable(config) {
  if (!config.checkoutEnabled) {
    throw new PaymentError("payment_checkout_unavailable", "Secure payment is not available for this checkout.", 503);
  }
  if (!config.activeSecretKey) {
    throw new PaymentError("payment_configuration_missing", "Secure payment is not configured.", 503);
  }
}

export function assertGatewayConfigured(config) {
  if (!config.activeSecretKey) {
    throw new PaymentError("payment_configuration_missing", "Secure payment is not configured.", 503);
  }
}

function text(value, field, { min = 1, max = 160 } = {}) {
  const normalized = String(value || "").trim();
  if (normalized.length < min || normalized.length > max) {
    throw new PaymentError("invalid_customer_details", `Please enter a valid ${field}.`);
  }
  return normalized;
}

function email(value) {
  const normalized = text(value, "email address", { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new PaymentError("invalid_customer_details", "Please enter a valid email address.");
  }
  return normalized;
}

function phone(value) {
  const normalized = text(value, "phone number", { max: 32 });
  if (!/^[+0-9 ()-]{7,32}$/.test(normalized)) {
    throw new PaymentError("invalid_customer_details", "Please enter a valid phone number.");
  }
  return normalized;
}

function integerQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new PaymentError("invalid_quantity", "Please choose a valid quantity.");
  }
  return quantity;
}

function isSellableVariant(product, variant) {
  const variantStatus = variant?.availability || product?.availability;
  return product?.publicationStatus === "published"
    && product?.visibility !== "hidden"
    && !product?.launchingSoon
    && !product?.comingSoon
    && variant?.enabled !== false
    && ["in_stock", "low_stock", "preorder"].includes(variantStatus);
}

export function validateCheckoutPayload(payload, catalogue) {
  if (!payload || typeof payload !== "object") {
    throw new PaymentError("invalid_request", "Please review the checkout details and try again.");
  }
  const customerInput = payload.customer || {};
  const customer = {
    firstName: text(customerInput.firstName, "first name", { max: 80 }),
    lastName: text(customerInput.lastName, "last name", { max: 80 }),
    email: email(customerInput.email),
    phone: phone(customerInput.phone),
    address: text(customerInput.address, "delivery address", { max: 180 }),
    suburb: text(customerInput.suburb, "suburb", { max: 100 }),
    city: text(customerInput.city, "city", { max: 100 }),
    province: text(customerInput.province, "province", { max: 100 }),
    postalCode: text(customerInput.postalCode, "postal code", { max: 20 }),
    notes: String(customerInput.notes || "").trim().slice(0, 500)
  };
  const incomingItems = Array.isArray(payload.items) ? payload.items : [];
  if (!incomingItems.length || incomingItems.length > MAX_CART_LINES) {
    throw new PaymentError("invalid_cart", "Your bag needs at least one valid item.");
  }

  const seenSkus = new Set();
  const items = incomingItems.map((incoming) => {
    const sku = text(incoming?.sku, "item selection", { max: 120 });
    if (seenSkus.has(sku)) throw new PaymentError("invalid_cart", "Each selected variant must appear once in your bag.");
    seenSkus.add(sku);
    const product = catalogue.find((candidate) => candidate.id === incoming.productId);
    const variant = product?.variants?.find((candidate) => candidate.sku === sku);
    if (!product || !variant || variant.colour !== incoming.colour || variant.size !== incoming.size) {
      throw new PaymentError("invalid_variant", "One of the selected product variants is no longer available.");
    }
    if (!isSellableVariant(product, variant)) {
      throw new PaymentError("unavailable_variant", "One of the selected product variants is no longer available.");
    }
    const quantity = integerQuantity(incoming.quantity);
    const stockLimit = Number.isFinite(variant.quantity) ? variant.quantity : MAX_LINE_QUANTITY;
    const allowedQuantity = Math.min(MAX_LINE_QUANTITY, stockLimit);
    if (quantity > allowedQuantity) {
      throw new PaymentError("quantity_limit", "The requested quantity is not available for one of the selected variants.");
    }
    const unitAmountCents = Math.round(Number(product.price) * 100);
    if (!Number.isSafeInteger(unitAmountCents) || unitAmountCents < 1) {
      throw new PaymentError("invalid_product_price", "One of the selected products cannot be checked out right now.", 409);
    }
    return {
      sku: variant.sku,
      productId: product.id,
      productName: product.title,
      colour: variant.colour,
      size: variant.size,
      quantity,
      unitAmountCents,
      lineAmountCents: unitAmountCents * quantity
    };
  });

  const subtotalCents = items.reduce((sum, item) => sum + item.lineAmountCents, 0);
  return {
    customer,
    items,
    subtotalCents,
    deliveryCents: 0,
    amountCents: subtotalCents,
    currency: "ZAR"
  };
}

export function createPaymentReference() {
  return `KALMTEST-${Date.now().toString(36)}-${randomBytes(12).toString("hex")}`;
}

export async function createPendingOrder({ payload, catalogue, repository, mode, now = new Date(), referenceFactory = createPaymentReference }) {
  const trusted = validateCheckoutPayload(payload, catalogue);
  let reference = referenceFactory();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!REFERENCE_PATTERN.test(reference)) throw new PaymentError("invalid_reference", "Unable to prepare a secure payment reference.", 500);
    if (!(await repository.getOrder(reference))) break;
    reference = referenceFactory();
  }
  if (await repository.getOrder(reference)) throw new PaymentError("reference_conflict", "Unable to prepare a secure payment reference.", 503);

  const createdAt = now.toISOString();
  const order = {
    id: `order-${reference}`,
    orderNumber: `KALM-${reference.slice(-12).toUpperCase()}`,
    reference,
    status: "pending_payment",
    createdAt,
    updatedAt: createdAt,
    expiresAt: new Date(now.getTime() + PENDING_ORDER_TTL_MS).toISOString(),
    customer: trusted.customer,
    items: trusted.items,
    subtotalCents: trusted.subtotalCents,
    deliveryCents: trusted.deliveryCents,
    amountCents: trusted.amountCents,
    currency: trusted.currency,
    payment: {
      provider: "paystack",
      mode,
      reference,
      verifiedAt: null,
      transactionId: null
    },
    inventory: {
      testMode: mode === "test",
      action: mode === "test" ? "test_ledger_only_no_real_inventory_change" : "pending_live_inventory_policy",
      applied: false
    },
    fulfilment: {
      state: mode === "test" ? "test_payment_do_not_fulfil" : "pending_payment",
      zohoPostingEnabled: false
    }
  };
  await repository.saveOrder(order);
  return order;
}

export function makeRateLimitFingerprint(ip = "unknown") {
  return createHash("sha256").update(String(ip)).digest("hex").slice(0, 32);
}

export async function assertRateLimit(repository, { bucket, ip, limit, windowMs }) {
  const allowed = await repository.takeRateLimit({ bucket, fingerprint: makeRateLimitFingerprint(ip), limit, windowMs });
  if (!allowed) throw new PaymentError("rate_limited", "Please wait a moment before trying secure checkout again.", 429);
}

export async function initializeTransaction({ order, config, callbackUrl, fetchImpl = fetch }) {
  assertCheckoutAvailable(config);
  let response;
  try {
    response = await fetchImpl(`${PAYSTACK_API_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.activeSecretKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: order.customer.email,
        amount: String(order.amountCents),
        currency: "ZAR",
        reference: order.reference,
        callback_url: callbackUrl,
        channels: ["card"],
        metadata: JSON.stringify({
          kalm_order_id: order.id,
          item_count: order.items.reduce((count, item) => count + item.quantity, 0),
          sales_channel: "kalm_collective_storefront",
          payment_mode: config.mode
        })
      })
    });
  } catch {
    throw new PaymentError("payment_initialization_failed", "Secure payment could not be started. Please try again.", 502);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status !== true || !body?.data?.authorization_url || body.data.reference !== order.reference) {
    throw new PaymentError("payment_initialization_failed", "Secure payment could not be started. Please try again.", 502);
  }
  return {
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code || "",
    reference: body.data.reference
  };
}

export async function fetchTransaction(reference, config, fetchImpl = fetch) {
  // Verification is deliberately independent of the frontend checkout switch.
  // A callback or signed webhook must still be able to resolve an already-created
  // pending transaction if the public button is disabled after it was initiated.
  assertGatewayConfigured(config);
  let response;
  try {
    response = await fetchImpl(`${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { authorization: `Bearer ${config.activeSecretKey}` }
    });
  } catch {
    throw new PaymentError("payment_verification_failed", "We could not verify this payment yet. Please try again.", 502);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status !== true || !body?.data) {
    throw new PaymentError("payment_verification_failed", "We could not verify this payment yet. Please try again.", 502);
  }
  return body.data;
}

export function assertSuccessfulTransaction(transaction, order, config) {
  if (transaction?.status !== "success") throw new PaymentError("payment_not_successful", "Payment has not been confirmed.", 409);
  if (Number(transaction.amount) !== order.amountCents) throw new PaymentError("payment_amount_mismatch", "Payment could not be verified.", 409);
  if (transaction.currency !== order.currency) throw new PaymentError("payment_currency_mismatch", "Payment could not be verified.", 409);
  if (transaction.reference !== order.reference) throw new PaymentError("payment_reference_mismatch", "Payment could not be verified.", 409);
  if (config.mode === "test" && transaction.domain !== "test") throw new PaymentError("payment_environment_mismatch", "Payment could not be verified.", 409);
  const providerEmail = String(transaction.customer?.email || "").trim().toLowerCase();
  if (providerEmail && providerEmail !== order.customer.email) throw new PaymentError("payment_customer_mismatch", "Payment could not be verified.", 409);
}

export async function expireOrderIfNeeded(order, repository, now = new Date()) {
  if (["pending_payment", "payment_processing"].includes(order.status) && new Date(order.expiresAt).getTime() <= now.getTime()) {
    const expired = { ...order, status: "payment_abandoned", updatedAt: now.toISOString() };
    await repository.saveOrder(expired);
    return expired;
  }
  return order;
}

export async function verifyAndRecordPayment({ reference, repository, config, fetchImpl = fetch, now = new Date() }) {
  let order = await repository.getOrder(reference);
  if (!order) throw new PaymentError("unknown_reference", "We could not find this payment reference.", 404);
  order = await expireOrderIfNeeded(order, repository, now);
  if (order.status === "payment_abandoned") {
    return { order, paymentStatus: "payment_abandoned", idempotent: false };
  }
  if (["cancelled", "refunded"].includes(order.status)) {
    throw new PaymentError("order_not_payable", "This order is no longer payable.", 409);
  }

  const transaction = await fetchTransaction(reference, config, fetchImpl);
  if (transaction.status !== "success") {
    const nextStatus = transaction.status === "abandoned" ? "payment_abandoned" : transaction.status === "pending" ? "payment_processing" : "payment_failed";
    const next = { ...order, status: nextStatus, updatedAt: now.toISOString() };
    await repository.saveOrder(next);
    return { order: next, paymentStatus: nextStatus, idempotent: false };
  }
  assertSuccessfulTransaction(transaction, order, config);
  if (order.status === "paid") {
    return { order, paymentStatus: "paid", idempotent: true };
  }
  const paid = {
    ...order,
    status: "paid",
    updatedAt: now.toISOString(),
    payment: {
      ...order.payment,
      verifiedAt: now.toISOString(),
      transactionId: String(transaction.id || "")
    },
    inventory: {
      ...order.inventory,
      applied: false
    },
    fulfilment: {
      ...order.fulfilment,
      state: config.mode === "test" ? "test_payment_do_not_fulfil" : "paid_pending_fulfilment"
    }
  };
  await repository.saveOrder(paid);
  return { order: paid, paymentStatus: "paid", idempotent: false };
}

export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const calculated = Buffer.from(expected, "utf8");
  return received.length === calculated.length && timingSafeEqual(received, calculated);
}

export function safeCustomerOrder(order) {
  return {
    orderNumber: order.orderNumber,
    reference: order.reference,
    status: order.status,
    testMode: order.payment?.mode === "test",
    paidAmountCents: order.amountCents,
    currency: order.currency,
    items: order.items.map(({ productName, colour, size, quantity, lineAmountCents }) => ({ productName, colour, size, quantity, lineAmountCents })),
    delivery: {
      address: order.customer.address,
      suburb: order.customer.suburb,
      city: order.customer.city,
      province: order.customer.province,
      postalCode: order.customer.postalCode,
      notes: order.customer.notes
    },
    verifiedAt: order.payment?.verifiedAt || null,
    fulfilmentState: order.fulfilment?.state || "pending_payment"
  };
}
