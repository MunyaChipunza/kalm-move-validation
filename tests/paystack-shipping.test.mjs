import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  STANDARD_COURIER,
  STANDARD_COURIER_FEE_CENTS,
  PaymentError,
  createPendingOrder,
  initializeTransaction,
  safeCustomerOrder,
  validateCheckoutPayload
} from "../netlify/functions/_shared/paystack-core.mjs";
import "../checkout-shipping-policy.js";

const root = process.cwd();
const catalogue = [{
  id: "TEE-001",
  title: "KALM Signature Oversized Tee",
  price: 699,
  publicationStatus: "published",
  visibility: "visible",
  availability: "in_stock",
  variants: [{ sku: "TEE-001-BLK-M", colour: "Black", size: "M", quantity: 1, availability: "in_stock", enabled: true }]
}];
const payload = {
  customer: {
    firstName: "Test",
    lastName: "Customer",
    email: "test@example.com",
    phone: "+27810000000",
    address: "1 Test Street",
    suburb: "Test Suburb",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001"
  },
  items: [{ productId: "TEE-001", sku: "TEE-001-BLK-M", colour: "Black", size: "M", quantity: 1 }]
};
const runtime = { mode: "test", checkoutEnabled: true, activeSecretKey: "unit-only-secret" };
const results = [];
const check = async (name, action) => { await action(); results.push(name); };
const expectCode = async (action, code) => assert.throws(action, (error) => error instanceof PaymentError && error.code === code);
const makeRepository = () => {
  const orders = new Map();
  return {
    async getOrder(reference) { return orders.get(reference) || null; },
    async saveOrder(order) { orders.set(order.reference, structuredClone(order)); return order; }
  };
};
const checkoutSource = fs.readFileSync(path.join(root, "script.js"), "utf8").slice(
  fs.readFileSync(path.join(root, "script.js"), "utf8").indexOf("function renderCheckout"),
  fs.readFileSync(path.join(root, "script.js"), "utf8").indexOf("async function loadPaystackCheckoutConfig")
);
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const staticForm = fs.readFileSync(path.join(root, "index.html"), "utf8");

await check("Standard Courier is automatically assigned", async () => {
  const trusted = validateCheckoutPayload(payload, catalogue);
  assert.deepEqual(trusted.shipping, STANDARD_COURIER);
});

await check("Standard Courier accepts its fixed method token", async () => {
  const trusted = validateCheckoutPayload({ ...payload, shippingMethod: "standard_courier" }, catalogue);
  assert.equal(trusted.shipping.method, "standard_courier");
});

await check("client-supplied Collection is rejected", async () => {
  await expectCode(() => validateCheckoutPayload({ ...payload, shippingMethod: "collection" }, catalogue), "unsupported_shipping_method");
});

await check("client-supplied Express is rejected", async () => {
  await expectCode(() => validateCheckoutPayload({ ...payload, shippingMethod: "express" }, catalogue), "unsupported_shipping_method");
});

await check("client-supplied Pickup is rejected", async () => {
  await expectCode(() => validateCheckoutPayload({ ...payload, shippingMethod: "pickup" }, catalogue), "unsupported_shipping_method");
});

await check("unknown shipping methods are rejected", async () => {
  await expectCode(() => validateCheckoutPayload({ ...payload, shippingMethod: "carrier_pigeon" }, catalogue), "unsupported_shipping_method");
});

await check("manipulated shipping fees are rejected", async () => {
  await expectCode(() => validateCheckoutPayload({ ...payload, shippingFeeCents: 1 }, catalogue), "invalid_shipping_fee");
});

await check("the configured Standard Courier charge is applied exactly once", async () => {
  const trusted = validateCheckoutPayload({ ...payload, shippingFeeCents: STANDARD_COURIER_FEE_CENTS }, catalogue);
  assert.equal(trusted.amountCents, trusted.subtotalCents + STANDARD_COURIER_FEE_CENTS);
});

await check("new orders persist Standard Courier", async () => {
  const repository = makeRepository();
  const order = await createPendingOrder({ payload, catalogue, repository, mode: "test", referenceFactory: () => "KALMTEST-SHIPPING-000001" });
  assert.equal(order.shipping.method, STANDARD_COURIER.method);
  assert.equal(order.deliveryCents, STANDARD_COURIER_FEE_CENTS);
});

await check("Paystack receives the trusted product-plus-shipping amount", async () => {
  const repository = makeRepository();
  const order = await createPendingOrder({ payload, catalogue, repository, mode: "test", referenceFactory: () => "KALMTEST-SHIPPING-000002" });
  let body;
  await initializeTransaction({
    order,
    config: runtime,
    callbackUrl: "https://draft.example/checkout/payment-result",
    fetchImpl: async (_url, options) => {
      body = JSON.parse(options.body);
      return new Response(JSON.stringify({ status: true, data: { authorization_url: "https://checkout.paystack.test", reference: order.reference } }), { status: 200 });
    }
  });
  assert.equal(body.amount, String(order.subtotalCents + STANDARD_COURIER_FEE_CENTS));
  assert.equal(JSON.parse(body.metadata).shipping_method, STANDARD_COURIER.method);
});

await check("the order confirmation includes Standard Courier", async () => {
  const repository = makeRepository();
  const order = await createPendingOrder({ payload, catalogue, repository, mode: "test", referenceFactory: () => "KALMTEST-SHIPPING-000003" });
  const safeOrder = safeCustomerOrder(order);
  assert.equal(safeOrder.delivery.method, STANDARD_COURIER.method);
  assert.equal(safeOrder.delivery.label, STANDARD_COURIER.label);
});

await check("old Collection carts migrate to Standard Courier", async () => {
  const migrated = globalThis.KALM_CHECKOUT_SHIPPING.migrateStoredCartItem({ productId: "TEE-001", shippingMethod: "collection", shippingFeeCents: 5000 });
  assert.equal(migrated.shippingMethod, STANDARD_COURIER.method);
  assert.equal(Object.hasOwn(migrated, "shippingFeeCents"), false);
});

await check("old Express carts migrate to Standard Courier", async () => {
  const migrated = globalThis.KALM_CHECKOUT_SHIPPING.migrateStoredCartItem({ productId: "TEE-001", deliveryMethod: "express", shippingFee: 10000 });
  assert.equal(migrated.shippingMethod, STANDARD_COURIER.method);
  assert.equal(Object.hasOwn(migrated, "deliveryMethod"), false);
  assert.equal(Object.hasOwn(migrated, "shippingFee"), false);
});

await check("checkout has no delivery radio buttons or unsupported customer delivery copy", async () => {
  assert.equal(/type="radio"[^>]+shipping|shipping_method|Express courier|Collection|pickup/i.test(checkoutSource), false);
  assert.match(checkoutSource, /STANDARD_COURIER\.label/);
  assert.match(checkoutSource, /STANDARD_COURIER\.estimate/);
  assert.equal(/name="shipping_method"|name="payment_method"/.test(staticForm), false);
});

await check("checkout retains overflow-safe mobile and aligned desktop layout rules", async () => {
  assert.match(styles, /\.checkout-layout[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(320px, 430px\)/);
  assert.match(styles, /\.checkout-layout[\s\S]*grid-template-columns: 1fr/);
  assert.match(styles, /\.checkout-fixed-summary/);
});

console.log(JSON.stringify({ passed: true, checkCount: results.length, checks: results }, null, 2));
