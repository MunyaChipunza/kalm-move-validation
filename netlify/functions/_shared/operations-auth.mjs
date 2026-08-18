import { timingSafeEqual } from "node:crypto";
import { PayFastError } from "./payfast-core.mjs";

export function requireOperationsAccess(request) {
  const configured = String(globalThis.Netlify?.env?.get?.("KALM_OPERATIONS_TOKEN") || "");
  const supplied = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const expected = Buffer.from(configured, "utf8");
  const actual = Buffer.from(supplied, "utf8");
  if (!configured || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new PayFastError(403, "internal_access_required", "Internal access required.");
  }
}
