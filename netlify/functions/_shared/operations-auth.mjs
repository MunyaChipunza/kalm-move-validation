import { timingSafeEqual } from "node:crypto";
import { PayFastError } from "./payfast-core.mjs";

export function requireOperationsAccess(request) {
  // A dedicated operations token takes precedence. During the controlled
  // owner-test wave, the existing server-only reconciliation token is a
  // compatible fallback so the internal controls cannot fail open.
  const configured = String(
    globalThis.Netlify?.env?.get?.("KALM_OPERATIONS_TOKEN")
    || globalThis.Netlify?.env?.get?.("KALM_PAYMENT_RECONCILIATION_TOKEN")
    || ""
  );
  const supplied = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const expected = Buffer.from(configured, "utf8");
  const actual = Buffer.from(supplied, "utf8");
  if (!configured || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new PayFastError(403, "internal_access_required", "Internal access required.");
  }
}
