import test from "node:test";
import assert from "node:assert/strict";
import {
  PAYFAST_ORDER_STATES,
  amountToCents,
  assessPayFastOrigin,
  assertPayFastEnabled,
  buildCheckoutFields,
  canTransition,
  createPayFastSignature,
  getPayFastConfig,
  normaliseItNStatus,
  parameterString,
  payFastGatewayState,
  transitionOrder,
  validateItnPayload,
  validPayFastSignature
} from "../../netlify/functions/_shared/payfast-core.mjs";

const testPassphrase = "test-fixture-passphrase";
const completeEnvironment = Object.freeze({
  PAYFAST_ENABLED: "true",
  PAYFAST_MODE: "test",
  PAYFAST_CREDENTIAL_SET: "sandbox",
  PAYFAST_MERCHANT_ID: "test-merchant-id",
  PAYFAST_MERCHANT_KEY: "test-merchant-key",
  PAYFAST_PASSPHRASE: testPassphrase,
  PAYFAST_RETURN_URL: "https://example.test/payment/payfast?status=pending",
  PAYFAST_CANCEL_URL: "https://example.test/payment/payfast?status=cancelled",
  PAYFAST_NOTIFY_URL: "https://example.test/api/payments/payfast/itn"
});

function runtime(overrides = {}) {
  const values = { ...completeEnvironment, ...overrides };
  return getPayFastConfig((name) => values[name]);
}

function order(state = PAYFAST_ORDER_STATES.AWAITING_GATEWAY) {
  return { orderId: "ord_test", paymentReference: "KALM-test", orderToken: "token", state, history: [], amountCents: 49900, currency: "ZAR", reconciliation: {} };
}

function signedItn(overrides = {}) {
  const entries = [
    ["merchant_id", completeEnvironment.PAYFAST_MERCHANT_ID],
    ["m_payment_id", "KALM-test"],
    ["amount_gross", "499.00"],
    ["currency", "ZAR"],
    ["payment_status", "COMPLETE"],
    ...Object.entries(overrides)
  ];
  entries.push(["signature", createPayFastSignature(entries, testPassphrase)]);
  return entries;
}

test("disabled configuration hides PayFast from customers", () => {
  assert.equal(payFastGatewayState(runtime({ PAYFAST_ENABLED: "false" })), "activation-ready");
});

test("test configuration has an explicit test state", () => {
  assert.equal(payFastGatewayState(runtime()), "test");
});

test("live mode rejects a non-live credential set", () => {
  assert.equal(payFastGatewayState(runtime({ PAYFAST_MODE: "live" })), "unavailable");
});

test("missing credentials makes the gateway unavailable", () => {
  assert.equal(payFastGatewayState(runtime({ PAYFAST_MERCHANT_KEY: "" })), "unavailable");
});

test("disabled configuration cannot initiate a checkout", () => {
  assert.throws(() => assertPayFastEnabled(runtime({ PAYFAST_ENABLED: "false" })), { code: "gateway_disabled" });
});

test("the documented field order, not alphabetical order, is signed", () => {
  const entries = [["merchant_id", "one"], ["merchant_key", "two"], ["return_url", "https://example.test/a path"]];
  assert.equal(parameterString(entries, testPassphrase), "merchant_id=one&merchant_key=two&return_url=https%3A%2F%2Fexample.test%2Fa+path&passphrase=test-fixture-passphrase");
});

test("a valid signature verifies in constant-time comparison path", () => {
  const entries = [["merchant_id", "one"], ["amount", "5.00"]];
  const signature = createPayFastSignature(entries, testPassphrase);
  assert.equal(validPayFastSignature(entries, signature, testPassphrase), true);
});

test("missing signature is rejected", () => {
  assert.equal(validPayFastSignature([["amount", "5.00"]], "", testPassphrase), false);
});

test("altered amount invalidates an ITN signature", () => {
  const entries = [["amount_gross", "5.00"], ["m_payment_id", "KALM-test"]];
  const signature = createPayFastSignature(entries, testPassphrase);
  assert.equal(validPayFastSignature([["amount_gross", "6.00"], ["m_payment_id", "KALM-test"]], signature, testPassphrase), false);
});

test("a signed ITN accepts the expected merchant, amount and currency", () => {
  const result = validateItnPayload({ entries: signedItn(), order: order(), config: runtime(), headers: {} });
  assert.equal(result.targetState, PAYFAST_ORDER_STATES.PAID);
  assert.equal(result.origin.accepted, true);
});

test("an ITN with a wrong merchant is rejected even when signed", () => {
  const entries = signedItn({ merchant_id: "wrong-merchant" });
  assert.throws(() => validateItnPayload({ entries, order: order(), config: runtime(), headers: {} }), { code: "merchant_mismatch" });
});

test("a signed non-ZAR ITN is rejected", () => {
  const entries = signedItn({ currency: "USD" });
  assert.throws(() => validateItnPayload({ entries, order: order(), config: runtime(), headers: {} }), { code: "currency_mismatch" });
});

test("a signed amount mismatch is rejected", () => {
  const entries = signedItn({ amount_gross: "498.00" });
  assert.throws(() => validateItnPayload({ entries, order: order(), config: runtime(), headers: {} }), { code: "amount_mismatch" });
});

test("a signed ITN from an explicit untrusted origin is rejected", () => {
  assert.throws(() => validateItnPayload({ entries: signedItn(), order: order(), config: runtime(), headers: { referer: "https://attacker.example/" } }), { code: "origin_untrusted" });
});

test("amount conversion preserves cents", () => {
  assert.equal(amountToCents("499.00"), 49900);
  assert.equal(amountToCents(0.01), 1);
});

test("successful ITN status maps to paid", () => {
  assert.equal(normaliseItNStatus("COMPLETE"), PAYFAST_ORDER_STATES.PAID);
});

test("failed, pending and cancelled statuses map safely", () => {
  assert.equal(normaliseItNStatus("FAILED"), PAYFAST_ORDER_STATES.FAILED);
  assert.equal(normaliseItNStatus("PENDING"), PAYFAST_ORDER_STATES.PENDING_CONFIRMATION);
  assert.equal(normaliseItNStatus("CANCELLED"), PAYFAST_ORDER_STATES.CANCELLED);
});

test("unknown payment status is rejected", () => {
  assert.equal(normaliseItNStatus("REVERSED"), null);
});

test("valid ITN can complete payment even without browser return", () => {
  assert.equal(transitionOrder(order(), PAYFAST_ORDER_STATES.PAID, "valid_itn").state, PAYFAST_ORDER_STATES.PAID);
});

test("browser return does not create a paid state transition", () => {
  assert.equal(canTransition(PAYFAST_ORDER_STATES.AWAITING_GATEWAY, PAYFAST_ORDER_STATES.PAID), true);
  assert.equal(order().state, PAYFAST_ORDER_STATES.AWAITING_GATEWAY);
});

test("duplicate ITN is idempotent", () => {
  const paid = transitionOrder(order(), PAYFAST_ORDER_STATES.PAID, "valid_itn");
  assert.equal(transitionOrder(paid, PAYFAST_ORDER_STATES.PAID, "duplicate_valid_itn").duplicate, true);
});

test("cancelled checkout remains retryable through a new gateway attempt", () => {
  const cancelled = transitionOrder(order(), PAYFAST_ORDER_STATES.CANCELLED, "customer_cancelled");
  assert.equal(cancelled.state, PAYFAST_ORDER_STATES.CANCELLED);
  assert.equal(canTransition(cancelled.state, PAYFAST_ORDER_STATES.AWAITING_GATEWAY), true);
});

test("a paid order cannot be recorded as paid twice", () => {
  const paid = transitionOrder(order(), PAYFAST_ORDER_STATES.PAID, "valid_itn");
  assert.equal(canTransition(paid.state, PAYFAST_ORDER_STATES.PAID), true);
});

test("refund path is distinct from a new sale", () => {
  const paid = transitionOrder(order(), PAYFAST_ORDER_STATES.PAID, "valid_itn");
  const pending = transitionOrder(paid, PAYFAST_ORDER_STATES.REFUND_PENDING, "approved_refund");
  assert.equal(transitionOrder(pending, PAYFAST_ORDER_STATES.REFUNDED, "gateway_refund").state, PAYFAST_ORDER_STATES.REFUNDED);
});

test("chargeback path is distinct from a new sale", () => {
  const paid = transitionOrder(order(), PAYFAST_ORDER_STATES.PAID, "valid_itn");
  assert.equal(transitionOrder(paid, PAYFAST_ORDER_STATES.CHARGEBACK_OPEN, "provider_notice").state, PAYFAST_ORDER_STATES.CHARGEBACK_OPEN);
});

test("recognised PayFast origin is classified", () => {
  const origin = assessPayFastOrigin({ referer: "https://sandbox.payfast.co.za/eng/process", "x-nf-client-connection-ip": "102.216.36.4" });
  assert.equal(origin.accepted, true);
  assert.equal(origin.referer, "recognised");
});

test("an explicit unrecognised origin is rejected", () => {
  assert.equal(assessPayFastOrigin({ referer: "https://attacker.example/", "x-nf-client-connection-ip": "203.0.113.9" }).accepted, false);
});

test("checkout fields use a server-owned total and signature", () => {
  const fields = buildCheckoutFields({ orderId: "ord_test", paymentReference: "KALM-test", amountCents: 49900, description: "1 KALM Collective item", customer: { name: "Test Buyer", email: "buyer@example.test", phone: "" } }, runtime());
  assert.equal(new Map(fields).get("amount"), "499.00");
  assert.match(new Map(fields).get("signature"), /^[a-f0-9]{32}$/);
});

test("checkout source keeps EFT intact and adds PayFast only dynamically", async () => {
  const source = await (await import("node:fs/promises")).readFile(new URL("../../script.js", import.meta.url), "utf8");
  assert.match(source, /value="Ozow"/);
  assert.match(source, /value="EFT"/);
  assert.match(source, /addPayFastOption/);
  assert.doesNotMatch(source, /value="PayFast"\s+checked/);
});
