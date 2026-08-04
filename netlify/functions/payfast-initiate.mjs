import catalogue from "../../products.json" with { type: "json" };
import { createPaymentReference, PayFastError, getPayFastConfig, assertPayFastEnabled, amountToCents, createPayFastSignature } from "./_shared/payfast-core.mjs";
import { json, readJson, safeError } from "./_shared/http.mjs";
import { saveOrder } from "./_shared/payment-store.mjs";
import { randomUUID } from "node:crypto";

export const config = { path: "/api/payments/payfast/initiate" };

function cleanText(value, maximum = 180) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maximum);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function publicPurchasableProduct(product) {
  return product && product.publicationStatus === "published" && product.visibility === "visible" && product.availability === "in_stock" && product.brandId !== "kalm-move";
}

function availableVariant(variant) {
  return variant?.enabled && ["in_stock", "low_stock"].includes(variant.availability) && Number.isFinite(variant.quantity) && variant.quantity > 0;
}

function buildItems(requestedItems) {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0 || requestedItems.length > 20) throw new PayFastError(400, "invalid_cart", "Your bag needs at least one available item.");
  const seen = new Set();
  return requestedItems.map((requested) => {
    const product = catalogue.products.find((candidate) => candidate.id === requested?.productId);
    if (!publicPurchasableProduct(product)) throw new PayFastError(400, "unavailable_item", "One or more selected items are not available.");
    const colour = cleanText(requested.color, 80);
    const size = cleanText(requested.size, 40);
    const quantity = Number(requested.quantity);
    const variant = product.variants?.find((candidate) => candidate.colour === colour && candidate.size === size);
    const itemKey = `${product.id}::${colour}::${size}`;
    if (!availableVariant(variant) || !Number.isInteger(quantity) || quantity < 1 || quantity > variant.quantity || seen.has(itemKey)) {
      throw new PayFastError(400, "unavailable_variant", "One or more selected variants are not available.");
    }
    seen.add(itemKey);
    return { productId: product.id, sku: variant.sku, title: cleanText(product.title, 100), colour, size, quantity, unitAmountCents: amountToCents(product.price) };
  });
}

function buildCustomer(customer) {
  const name = cleanText(customer?.name, 120);
  const email = cleanText(customer?.email, 160).toLowerCase();
  if (!name || !validEmail(email)) throw new PayFastError(400, "invalid_customer", "Enter a valid name and email address.");
  return { name, email, phone: cleanText(customer?.phone, 40) };
}

function buildDelivery(delivery) {
  const fields = ["address", "suburb", "city", "province", "postalCode"];
  const result = Object.fromEntries(fields.map((field) => [field, cleanText(delivery?.[field], field === "address" ? 180 : 80)]));
  if (Object.values(result).some((value) => !value)) throw new PayFastError(400, "invalid_delivery", "Complete the delivery address before continuing.");
  return result;
}

export default async function handler(request) {
  try {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405, headers: { allow: "POST" } });
    const runtime = getPayFastConfig();
    assertPayFastEnabled(runtime);
    const body = await readJson(request);
    const items = buildItems(body.items);
    const customer = buildCustomer(body.customer);
    const delivery = buildDelivery(body.delivery);
    const amountCents = items.reduce((sum, item) => sum + item.unitAmountCents * item.quantity, 0);
    const orderId = `ord_${randomUUID().replaceAll("-", "")}`;
    const orderToken = randomUUID().replaceAll("-", "");
    const order = {
      orderId,
      orderToken,
      paymentReference: createPaymentReference(),
      gateway: "payfast",
      currency: "ZAR",
      amountCents,
      description: `${items.reduce((sum, item) => sum + item.quantity, 0)} KALM Collective item${items.length === 1 ? "" : "s"}`,
      items,
      customer,
      delivery,
      shippingMethod: cleanText(body.shippingMethod, 80) || "Standard courier",
      state: "created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{ at: new Date().toISOString(), from: null, to: "created", reason: "server_created" }],
      reconciliation: { expectedGrossCents: amountCents, gatewayGrossCents: null, gatewayFeeCents: null, netSettlementCents: null, gatewayTransactionReference: null, notificationTimestamp: null, paidTimestamp: null, settlementState: "unsettled", payoutReference: null, payoutDate: null, refundAmountCents: 0, chargebackState: "none" }
    };
    await saveOrder(order);
    const token = createPayFastSignature([["order_id", orderId], ["order_token", orderToken]], runtime.passphrase);
    return json({ redirect: `/api/payments/payfast/redirect?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}` }, { status: 201 });
  } catch (error) {
    return safeError(error);
  }
}
