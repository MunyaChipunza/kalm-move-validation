import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  PaymentError,
  createPendingOrder,
  getRuntimeConfig,
  initializeTransaction,
  publicRuntimeConfig,
  validateCheckoutPayload,
  verifyAndRecordPayment,
  verifyWebhookSignature
} from "../netlify/functions/_shared/paystack-core.mjs";

const catalogue = [{
  id: "TEE-001",
  title: "KALM Signature Oversized Tee",
  price: 699,
  publicationStatus: "published",
  visibility: "visible",
  availability: "in_stock",
  variants: [
    { sku: "TEE-001-BLK-M", colour: "Black", size: "M", quantity: null, availability: "in_stock", enabled: true },
    { sku: "TEE-001-WHT-S", colour: "White", size: "S", quantity: 1, availability: "in_stock", enabled: true },
    { sku: "TEE-001-WHT-XL", colour: "White", size: "XL", quantity: 0, availability: "sold_out", enabled: false }
  ]
}];

const validPayload = {
  customer: {
    firstName: "Test",
    lastName: "Customer",
    email: "test@example.com",
    phone: "+27810000000",
    address: "1 Test Street",
    suburb: "Test Suburb",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001",
    notes: "Leave with reception"
  },
  items: [{
    productId: "TEE-001",
    sku: "TEE-001-BLK-M",
    colour: "Black",
    size: "M",
    quantity: 1,
    clientPrice: 1,
    clientTotal: 1
  }]
};

function makeRepository() {
  const orders = new Map();
  return {
    orders,
    async getOrder(reference) { return orders.get(reference) || null; },
    async saveOrder(order) { orders.set(order.reference, structuredClone(order)); return order; },
    async takeRateLimit() { return true; }
  };
}

const runtime = {
  mode: "test",
  checkoutEnabled: true,
  activeSecretKey: "test-secret-key"
};

function providerTransaction(order, overrides = {}) {
  return {
    id: 90001,
    status: "success",
    amount: order.amountCents,
    currency: "ZAR",
    domain: "test",
    reference: order.reference,
    customer: { email: order.customer.email },
    ...overrides
  };
}

function mockFetch(responseBody, status = 200) {
  return async () => new Response(JSON.stringify(responseBody), {
    status,
    headers: { "content-type": "application/json" }
  });
}

async function expectCode(action, code) {
  await assert.rejects(action, (error) => error instanceof PaymentError && error.code === code);
}

const results = [];
const check = async (name, action) => {
  await action();
  results.push(name);
};

await check("server price overrides browser totals", async () => {
  const trusted = validateCheckoutPayload(validPayload, catalogue);
  assert.equal(trusted.amountCents, 69900);
  assert.equal(trusted.items[0].unitAmountCents, 69900);
});

await check("invalid variant is rejected", async () => {
  const bad = structuredClone(validPayload);
  bad.items[0].size = "L";
  await expectCode(async () => validateCheckoutPayload(bad, catalogue), "invalid_variant");
});

await check("unavailable size is rejected", async () => {
  const bad = structuredClone(validPayload);
  Object.assign(bad.items[0], { sku: "TEE-001-WHT-XL", colour: "White", size: "XL" });
  await expectCode(async () => validateCheckoutPayload(bad, catalogue), "unavailable_variant");
});

await check("quantity above server limit is rejected", async () => {
  const bad = structuredClone(validPayload);
  bad.items[0].quantity = 6;
  await expectCode(async () => validateCheckoutPayload(bad, catalogue), "quantity_limit");
});

const repository = makeRepository();
const order = await createPendingOrder({
  payload: validPayload,
  catalogue,
  repository,
  mode: "test",
  now: new Date("2026-07-17T10:00:00.000Z"),
  referenceFactory: () => "KALMTEST-UNIT-000000000001"
});

await check("pending test order has no real inventory action", async () => {
  assert.equal(order.status, "pending_payment");
  assert.equal(order.inventory.action, "test_ledger_only_no_real_inventory_change");
  assert.equal(order.fulfilment.state, "test_payment_do_not_fulfil");
});

await check("initialisation sends trusted amount and reference", async () => {
  let request;
  const result = await initializeTransaction({
    order,
    config: runtime,
    callbackUrl: "https://preview.example/checkout/payment-result",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({
        status: true,
        data: { authorization_url: "https://checkout.paystack.com/test", access_code: "access", reference: order.reference }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });
  assert.equal(result.reference, order.reference);
  const body = JSON.parse(request.options.body);
  assert.equal(body.amount, String(order.amountCents));
  assert.equal(body.currency, "ZAR");
  assert.equal(body.reference, order.reference);
  assert.match(request.url, /transaction\/initialize$/);
});

await check("successful verification marks the order paid once", async () => {
  const result = await verifyAndRecordPayment({
    reference: order.reference,
    repository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(order) }),
    now: new Date("2026-07-17T10:05:00.000Z")
  });
  assert.equal(result.paymentStatus, "paid");
  assert.equal(result.idempotent, false);
  assert.equal(result.order.inventory.applied, false);
  assert.equal(result.order.fulfilment.state, "test_payment_do_not_fulfil");
});

await check("duplicate payment verification is idempotent", async () => {
  const result = await verifyAndRecordPayment({
    reference: order.reference,
    repository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(order) }),
    now: new Date("2026-07-17T10:06:00.000Z")
  });
  assert.equal(result.paymentStatus, "paid");
  assert.equal(result.idempotent, true);
});

await check("amount mismatch never marks an order paid", async () => {
  const mismatchRepository = makeRepository();
  const mismatchOrder = await createPendingOrder({ payload: validPayload, catalogue, repository: mismatchRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000002" });
  await expectCode(() => verifyAndRecordPayment({
    reference: mismatchOrder.reference,
    repository: mismatchRepository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(mismatchOrder, { amount: mismatchOrder.amountCents + 100 }) })
  }), "payment_amount_mismatch");
  assert.equal((await mismatchRepository.getOrder(mismatchOrder.reference)).status, "pending_payment");
});

await check("currency mismatch never marks an order paid", async () => {
  const mismatchRepository = makeRepository();
  const mismatchOrder = await createPendingOrder({ payload: validPayload, catalogue, repository: mismatchRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000003" });
  await expectCode(() => verifyAndRecordPayment({
    reference: mismatchOrder.reference,
    repository: mismatchRepository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(mismatchOrder, { currency: "NGN" }) })
  }), "payment_currency_mismatch");
});

await check("unknown reference is rejected", async () => {
  await expectCode(() => verifyAndRecordPayment({
    reference: "KALMTEST-UNKNOWN",
    repository: makeRepository(),
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: {} })
  }), "unknown_reference");
});

await check("expired pending payment is abandoned safely", async () => {
  const expiredRepository = makeRepository();
  const expiredOrder = await createPendingOrder({
    payload: validPayload,
    catalogue,
    repository: expiredRepository,
    mode: "test",
    now: new Date("2026-07-15T10:00:00.000Z"),
    referenceFactory: () => "KALMTEST-UNIT-000000000004"
  });
  const result = await verifyAndRecordPayment({
    reference: expiredOrder.reference,
    repository: expiredRepository,
    config: runtime,
    fetchImpl: async () => { throw new Error("Provider must not be called for an expired order"); },
    now: new Date("2026-07-17T10:00:00.000Z")
  });
  assert.equal(result.paymentStatus, "payment_abandoned");
});

await check("webhook signature accepts valid HMAC and rejects invalid HMAC", async () => {
  const raw = JSON.stringify({ event: "charge.success", data: { reference: order.reference } });
  const signature = createHmac("sha512", runtime.activeSecretKey).update(raw).digest("hex");
  assert.equal(verifyWebhookSignature(raw, signature, runtime.activeSecretKey), true);
  assert.equal(verifyWebhookSignature(raw, "not-valid", runtime.activeSecretKey), false);
});

await check("failed gateway result never marks an order paid", async () => {
  const failedRepository = makeRepository();
  const failedOrder = await createPendingOrder({ payload: validPayload, catalogue, repository: failedRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000005" });
  const result = await verifyAndRecordPayment({
    reference: failedOrder.reference,
    repository: failedRepository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(failedOrder, { status: "failed" }) })
  });
  assert.equal(result.paymentStatus, "payment_failed");
  assert.equal(result.order.inventory.applied, false);
});

await check("abandoned gateway result is recoverable and not paid", async () => {
  const abandonedRepository = makeRepository();
  const abandonedOrder = await createPendingOrder({ payload: validPayload, catalogue, repository: abandonedRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000006" });
  const result = await verifyAndRecordPayment({
    reference: abandonedOrder.reference,
    repository: abandonedRepository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(abandonedOrder, { status: "abandoned" }) })
  });
  assert.equal(result.paymentStatus, "payment_abandoned");
});

await check("duplicate payment reference cannot create a second order", async () => {
  const duplicateRepository = makeRepository();
  await createPendingOrder({ payload: validPayload, catalogue, repository: duplicateRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000007" });
  await expectCode(() => createPendingOrder({ payload: validPayload, catalogue, repository: duplicateRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000007" }), "reference_conflict");
});

await check("provider network failure returns a safe verification error", async () => {
  const networkRepository = makeRepository();
  const networkOrder = await createPendingOrder({ payload: validPayload, catalogue, repository: networkRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000008" });
  await expectCode(() => verifyAndRecordPayment({
    reference: networkOrder.reference,
    repository: networkRepository,
    config: runtime,
    fetchImpl: async () => { throw new Error("offline"); }
  }), "payment_verification_failed");
});

await check("test-domain mismatch is rejected", async () => {
  const domainRepository = makeRepository();
  const domainOrder = await createPendingOrder({ payload: validPayload, catalogue, repository: domainRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000009" });
  await expectCode(() => verifyAndRecordPayment({
    reference: domainOrder.reference,
    repository: domainRepository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(domainOrder, { domain: "live" }) })
  }), "payment_environment_mismatch");
});

await check("provider customer email mismatch is rejected", async () => {
  const customerRepository = makeRepository();
  const customerOrder = await createPendingOrder({ payload: validPayload, catalogue, repository: customerRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000010" });
  await expectCode(() => verifyAndRecordPayment({
    reference: customerOrder.reference,
    repository: customerRepository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(customerOrder, { customer: { email: "different@example.com" } }) })
  }), "payment_customer_mismatch");
});

await check("bad initialisation response is rejected", async () => {
  await expectCode(() => initializeTransaction({
    order,
    config: runtime,
    callbackUrl: "https://preview.example/checkout/payment-result",
    fetchImpl: mockFetch({ status: false, data: {} }, 400)
  }), "payment_initialization_failed");
});

await check("initialisation network failure is rejected safely", async () => {
  await expectCode(() => initializeTransaction({
    order,
    config: runtime,
    callbackUrl: "https://preview.example/checkout/payment-result",
    fetchImpl: async () => { throw new Error("offline"); }
  }), "payment_initialization_failed");
});

await check("KS Active quantity is validated server side", async () => {
  const ksCatalogue = [{
    id: "P050",
    title: "KS Active Racer Knit Bra",
    price: 399,
    publicationStatus: "published",
    visibility: "visible",
    availability: "in_stock",
    variants: [{ sku: "P050-IRON-BLUE-M", colour: "Iron Blue", size: "M", quantity: 1, availability: "in_stock", enabled: true }]
  }];
  const ksPayload = structuredClone(validPayload);
  ksPayload.items = [{ productId: "P050", sku: "P050-IRON-BLUE-M", colour: "Iron Blue", size: "M", quantity: 1 }];
  assert.equal(validateCheckoutPayload(ksPayload, ksCatalogue).amountCents, 39900);
  ksPayload.items[0].quantity = 2;
  await expectCode(async () => validateCheckoutPayload(ksPayload, ksCatalogue), "quantity_limit");
});

await check("test order verification never mutates a source variant quantity", async () => {
  assert.equal(catalogue[0].variants[0].quantity, null);
  assert.equal(catalogue[0].variants[1].quantity, 1);
  assert.equal(order.inventory.action, "test_ledger_only_no_real_inventory_change");
});

await check("production hostname always disables test checkout", async () => {
  const previousNetlify = globalThis.Netlify;
  globalThis.Netlify = { env: { get: (name) => ({
    PAYSTACK_MODE: "test",
    PAYSTACK_CHECKOUT_ENABLED: "true",
    PAYSTACK_TEST_PUBLIC_KEY: "test-public",
    PAYSTACK_TEST_SECRET_KEY: "test-secret"
  })[name] } };
  const config = getRuntimeConfig({}, new Request("https://kalmcollective.co.za/api/payments/paystack/config"));
  assert.equal(config.isProductionDeploy, true);
  assert.equal(config.checkoutEnabled, false);
  globalThis.Netlify = previousNetlify;
});

await check("test checkout is available only on a non-production host with both test keys", async () => {
  const previousNetlify = globalThis.Netlify;
  globalThis.Netlify = { env: { get: (name) => ({
    PAYSTACK_MODE: "test",
    PAYSTACK_CHECKOUT_ENABLED: "true",
    PAYSTACK_TEST_PUBLIC_KEY: "test-public",
    PAYSTACK_TEST_SECRET_KEY: "test-secret"
  })[name] } };
  const config = getRuntimeConfig({}, new Request("https://draft.example/api/payments/paystack/config"));
  assert.equal(config.checkoutEnabled, true);
  globalThis.Netlify = previousNetlify;
});

await check("public runtime configuration never exposes a Paystack secret", async () => {
  const publicConfig = publicRuntimeConfig({
    mode: "test",
    checkoutEnabled: true,
    checkoutState: "available",
    isProductionDeploy: false,
    activeSecretKey: "test-secret"
  });
  assert.equal(JSON.stringify(publicConfig).includes("test-secret"), false);
});

await check("webhook-first and callback-first verification both resolve idempotently", async () => {
  const sequenceRepository = makeRepository();
  const sequenceOrder = await createPendingOrder({ payload: validPayload, catalogue, repository: sequenceRepository, mode: "test", referenceFactory: () => "KALMTEST-UNIT-000000000011" });
  const webhookFirst = await verifyAndRecordPayment({
    reference: sequenceOrder.reference,
    repository: sequenceRepository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(sequenceOrder) })
  });
  const callbackSecond = await verifyAndRecordPayment({
    reference: sequenceOrder.reference,
    repository: sequenceRepository,
    config: runtime,
    fetchImpl: mockFetch({ status: true, data: providerTransaction(sequenceOrder) })
  });
  assert.equal(webhookFirst.idempotent, false);
  assert.equal(callbackSecond.idempotent, true);
});

console.log(JSON.stringify({ passed: true, checkCount: results.length, checks: results }, null, 2));
