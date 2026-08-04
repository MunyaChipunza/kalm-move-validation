import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

export const PAYFAST_ORDER_STATES = Object.freeze({
  CREATED: "created",
  AWAITING_GATEWAY: "awaiting_gateway",
  PENDING_CONFIRMATION: "pending_confirmation",
  PAID: "paid",
  FULFILMENT_READY: "fulfilment_ready",
  CANCELLED: "cancelled",
  FAILED: "failed",
  REFUND_PENDING: "refund_pending",
  REFUNDED: "refunded",
  CHARGEBACK_OPEN: "chargeback_open",
  CHARGED_BACK: "charged_back"
});

// PayFast requires checkout form fields in their documented attribute order,
// not alphabetic API-header order. Keep this list intentionally explicit.
export const PAYFAST_CHECKOUT_FIELD_ORDER = Object.freeze([
  "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
  "name_first", "name_last", "email_address", "cell_number", "m_payment_id",
  "amount", "item_name", "item_description", "email_confirmation",
  "confirmation_address", "payment_method"
]);

const KNOWN_ITN_STATUSES = new Set(["COMPLETE", "FAILED", "PENDING", "CANCELLED", "ON HOLD"]);
const VALID_PAYFAST_HOSTS = new Set(["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"]);
const PAYFAST_NETWORKS = Object.freeze([
  ["197.97.145.144", 28], ["41.74.179.192", 27], ["102.216.36.0", 28],
  ["102.216.36.128", 28], ["144.126.193.139", 32]
]);

function envValue(name, envGet = defaultEnvGet) {
  return String(envGet(name) ?? "").trim();
}

function defaultEnvGet(name) {
  if (globalThis.Netlify?.env?.get) return Netlify.env.get(name);
  return process.env[name];
}

export function getPayFastConfig(envGet = defaultEnvGet) {
  const enabled = envValue("PAYFAST_ENABLED", envGet).toLowerCase() === "true";
  const mode = envValue("PAYFAST_MODE", envGet).toLowerCase() || "test";
  const credentialSet = envValue("PAYFAST_CREDENTIAL_SET", envGet).toLowerCase() || "none";
  return {
    enabled,
    mode: ["test", "live"].includes(mode) ? mode : "invalid",
    credentialSet,
    merchantId: envValue("PAYFAST_MERCHANT_ID", envGet),
    merchantKey: envValue("PAYFAST_MERCHANT_KEY", envGet),
    passphrase: envValue("PAYFAST_PASSPHRASE", envGet),
    returnUrl: envValue("PAYFAST_RETURN_URL", envGet),
    cancelUrl: envValue("PAYFAST_CANCEL_URL", envGet),
    notifyUrl: envValue("PAYFAST_NOTIFY_URL", envGet)
  };
}

export function payFastGatewayState(config) {
  const configured = Boolean(config.merchantId && config.merchantKey && config.passphrase && config.returnUrl && config.cancelUrl && config.notifyUrl);
  if (!configured || config.mode === "invalid") return "unavailable";
  if (!config.enabled) return config.mode === "test" ? "activation-ready" : "temporarily-disabled";
  if (config.mode === "test") return "test";
  if (config.mode === "live" && config.credentialSet === "live") return "live";
  return "unavailable";
}

export function assertPayFastEnabled(config) {
  if (!config.enabled) throw new PayFastError(503, "gateway_disabled", "This payment method is not available.");
  if (config.mode !== "test" && config.mode !== "live") throw new PayFastError(503, "gateway_configuration_invalid", "This payment method is not available.");
  if (config.mode === "live" && config.credentialSet !== "live") throw new PayFastError(503, "credential_mode_mismatch", "This payment method is not available.");
  for (const key of ["merchantId", "merchantKey", "passphrase", "returnUrl", "cancelUrl", "notifyUrl"]) {
    if (!config[key]) throw new PayFastError(503, "gateway_configuration_missing", "This payment method is not available.");
  }
}

export class PayFastError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function encodePayFast(value) {
  return encodeURIComponent(String(value).trim())
    .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

export function parameterString(entries, passphrase = "") {
  const serialised = entries
    .filter(([key, value]) => key && key !== "signature" && value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `${key}=${encodePayFast(value)}`);
  if (passphrase) serialised.push(`passphrase=${encodePayFast(passphrase)}`);
  return serialised.join("&");
}

export function createPayFastSignature(entries, passphrase = "") {
  return createHash("md5").update(parameterString(entries, passphrase), "utf8").digest("hex");
}

export function validPayFastSignature(entries, signature, passphrase = "") {
  if (!signature || !/^[a-f0-9]{32}$/i.test(signature)) return false;
  const expected = createPayFastSignature(entries, passphrase);
  const actualBuffer = Buffer.from(String(signature).toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function getPayFastProcessUrl(mode) {
  return mode === "test" ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process";
}

export function getPayFastValidateUrl(mode) {
  return mode === "test" ? "https://sandbox.payfast.co.za/eng/query/validate" : "https://www.payfast.co.za/eng/query/validate";
}

export function amountToCents(amount) {
  const number = Number(amount);
  if (!Number.isFinite(number) || number < 0) throw new PayFastError(400, "invalid_amount", "The order amount is invalid.");
  return Math.round(number * 100);
}

export function centsToAmount(cents) {
  return (Number(cents) / 100).toFixed(2);
}

export function createPaymentReference() {
  return `KALM-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

export function firstAndLastName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return { first: parts.shift() || "Customer", last: parts.join(" ") || "" };
}

export function buildCheckoutFields(order, config) {
  const { first, last } = firstAndLastName(order.customer?.name);
  const values = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: config.returnUrl,
    cancel_url: config.cancelUrl,
    notify_url: config.notifyUrl,
    name_first: first,
    name_last: last,
    email_address: order.customer.email,
    cell_number: order.customer.phone || "",
    m_payment_id: order.paymentReference,
    amount: centsToAmount(order.amountCents),
    item_name: `KALM Collective order ${order.orderId}`,
    item_description: order.description,
    email_confirmation: "1"
  };
  const fields = PAYFAST_CHECKOUT_FIELD_ORDER
    .filter((key) => values[key] !== undefined && values[key] !== "")
    .map((key) => [key, values[key]]);
  fields.push(["signature", createPayFastSignature(fields, config.passphrase)]);
  return fields;
}

export function normaliseItNStatus(value) {
  const status = String(value || "").trim().toUpperCase();
  if (!KNOWN_ITN_STATUSES.has(status)) return null;
  if (status === "COMPLETE") return PAYFAST_ORDER_STATES.PAID;
  if (status === "PENDING" || status === "ON HOLD") return PAYFAST_ORDER_STATES.PENDING_CONFIRMATION;
  if (status === "CANCELLED") return PAYFAST_ORDER_STATES.CANCELLED;
  return PAYFAST_ORDER_STATES.FAILED;
}

// Validating an ITN is deliberately separated from gateway confirmation.  The
// caller must still POST the original payload back to PayFast and receive
// `VALID` before committing the returned result to storage.
export function validateItnPayload({ entries, order, config, headers = {} }) {
  const data = Object.fromEntries(entries);
  if (!order) throw new PayFastError(404, "unknown_order", "Unknown payment reference.");
  if (data.merchant_id !== config.merchantId) throw new PayFastError(400, "merchant_mismatch", "Merchant mismatch.");
  if (!validPayFastSignature(entries, data.signature, config.passphrase)) {
    throw new PayFastError(400, "invalid_signature", "Invalid notification signature.");
  }
  if (data.currency && data.currency.toUpperCase() !== "ZAR") {
    throw new PayFastError(400, "currency_mismatch", "Currency mismatch.");
  }
  if (order.currency !== "ZAR" || amountToCents(data.amount_gross) !== order.amountCents) {
    throw new PayFastError(400, "amount_mismatch", "Amount mismatch.");
  }
  const targetState = normaliseItNStatus(data.payment_status);
  if (!targetState) throw new PayFastError(400, "unrecognised_payment_status", "Unrecognised payment status.");
  const origin = assessPayFastOrigin(headers);
  if (!origin.accepted) throw new PayFastError(400, "origin_untrusted", "Untrusted notification origin.");
  return { data, targetState, origin };
}

const TRANSITIONS = Object.freeze({
  [PAYFAST_ORDER_STATES.CREATED]: new Set([PAYFAST_ORDER_STATES.AWAITING_GATEWAY, PAYFAST_ORDER_STATES.CANCELLED, PAYFAST_ORDER_STATES.FAILED]),
  [PAYFAST_ORDER_STATES.AWAITING_GATEWAY]: new Set([PAYFAST_ORDER_STATES.PENDING_CONFIRMATION, PAYFAST_ORDER_STATES.PAID, PAYFAST_ORDER_STATES.CANCELLED, PAYFAST_ORDER_STATES.FAILED]),
  [PAYFAST_ORDER_STATES.PENDING_CONFIRMATION]: new Set([PAYFAST_ORDER_STATES.PAID, PAYFAST_ORDER_STATES.CANCELLED, PAYFAST_ORDER_STATES.FAILED]),
  [PAYFAST_ORDER_STATES.CANCELLED]: new Set([PAYFAST_ORDER_STATES.AWAITING_GATEWAY]),
  [PAYFAST_ORDER_STATES.FAILED]: new Set([PAYFAST_ORDER_STATES.AWAITING_GATEWAY]),
  [PAYFAST_ORDER_STATES.PAID]: new Set([PAYFAST_ORDER_STATES.FULFILMENT_READY, PAYFAST_ORDER_STATES.REFUND_PENDING, PAYFAST_ORDER_STATES.CHARGEBACK_OPEN]),
  [PAYFAST_ORDER_STATES.FULFILMENT_READY]: new Set([PAYFAST_ORDER_STATES.REFUND_PENDING, PAYFAST_ORDER_STATES.CHARGEBACK_OPEN]),
  [PAYFAST_ORDER_STATES.REFUND_PENDING]: new Set([PAYFAST_ORDER_STATES.REFUNDED, PAYFAST_ORDER_STATES.CHARGEBACK_OPEN]),
  [PAYFAST_ORDER_STATES.CHARGEBACK_OPEN]: new Set([PAYFAST_ORDER_STATES.CHARGED_BACK, PAYFAST_ORDER_STATES.PAID, PAYFAST_ORDER_STATES.FULFILMENT_READY])
});

export function canTransition(from, to) {
  return from === to || Boolean(TRANSITIONS[from]?.has(to));
}

export function transitionOrder(order, targetState, reason, now = new Date().toISOString()) {
  if (!canTransition(order.state, targetState)) throw new PayFastError(409, "invalid_state_transition", "The payment state cannot be updated.");
  if (order.state === targetState) return { ...order, duplicate: true };
  const event = { at: now, from: order.state, to: targetState, reason };
  return { ...order, state: targetState, updatedAt: now, history: [...(order.history || []), event] };
}

export function isIPv4InCidr(ip, network, prefix) {
  const toInteger = (candidate) => String(candidate).split(".").reduce((value, octet) => (value << 8) + Number(octet), 0) >>> 0;
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(String(ip))) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (toInteger(ip) & mask) === (toInteger(network) & mask);
}

export function assessPayFastOrigin(headers = {}) {
  const referer = headers.referer || headers.referrer || "";
  let refererHost = "";
  try { refererHost = new URL(referer).hostname.toLowerCase(); } catch { /* no usable referer */ }
  const rawIp = String(headers["x-nf-client-connection-ip"] || headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ipMatches = PAYFAST_NETWORKS.some(([network, prefix]) => isIPv4InCidr(rawIp, network, prefix));
  return {
    referer: refererHost ? (VALID_PAYFAST_HOSTS.has(refererHost) ? "recognised" : "unrecognised") : "not-present",
    sourceIp: rawIp ? (ipMatches ? "recognised" : "unrecognised") : "not-observable",
    // Netlify can terminate and proxy ITN traffic. The signed payload plus a
    // required server confirmation is authoritative when the origin cannot be
    // observed; a supplied unrecognised source is always rejected.
    accepted: refererHost ? VALID_PAYFAST_HOSTS.has(refererHost) : !rawIp || ipMatches
  };
}

export function publicOrderState(order) {
  return {
    orderId: order.orderId,
    reference: order.paymentReference,
    state: order.state,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    currency: order.currency,
    amount: centsToAmount(order.amountCents)
  };
}
