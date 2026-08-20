import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";import { runtimeEnvGet } from "./runtime-env.mjs";export const PAYFAST_ORDER_STATES = Object.freeze({  CREATED: "created",  AWAITING_GATEWAY: "awaiting_gateway",  PENDING_CONFIRMATION: "pending_confirmation",  PAID: "paid",  FULFILMENT_READY: "fulfilment_ready",  CANCELLED: "cancelled",  FAILED: "failed",  REFUND_PENDING: "refund_pending",  REFUNDED: "refunded",  CHARGEBACK_OPEN: "chargeback_open",  CHARGED_BACK: "charged_back"});// PayFast requires checkout form fields in their documented attribute order,// not alphabetic API-header order. Keep this list intentionally explicit.export const PAYFAST_CHECKOUT_FIELD_ORDER = Object.freeze([
  "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
  "name_first", "name_last", "email_address", "cell_number", "m_payment_id",
  "amount", "item_name", "item_description",
  "custom_int1", "custom_int2", "custom_int3", "custom_int4", "custom_int5",
  "custom_str1", "custom_str2", "custom_str3", "custom_str4", "custom_str5",
  "email_confirmation", "confirmation_address", "payment_method"
]);

const KNOWN_ITN_STATUSES = new Set(["COMPLETE", "FAILED", "PENDING", "CANCELLED", "ON HOLD"]);const VALID_PAYFAST_HOSTS = new Set(["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"]);// The current launch phase permits only explicitly authorised owner-test// recipients. These one-way verifiers avoid storing plaintext emails in source,// so the temporary server-side gate remains source-locked even when Netlify's// project environment API cannot persist new runtime keys. A future public-launch// change must explicitly set CHECKOUT_MODE=public through the protected release process.const SOURCE_LOCKED_OWNER_TEST_EMAIL_SHA256 = Object.freeze([  "7180f8b4269feb07cfe30beff49989a0b49603b7d384f4b5fed6ee94fc01207e",  "653e28ad7448744de5c33d7d582283bedeb4e556be5e90a26ac43b040734d1e7"
