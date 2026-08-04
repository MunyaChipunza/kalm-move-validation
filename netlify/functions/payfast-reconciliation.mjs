import { timingSafeEqual } from "node:crypto";
import { getPayFastConfig, PayFastError } from "./_shared/payfast-core.mjs";
import { json, safeError } from "./_shared/http.mjs";
import { listOrders } from "./_shared/payment-store.mjs";

export const config = { path: "/api/internal/payments/payfast/reconciliation" };

function internalAccessAllowed(request) {
  const token = String(globalThis.Netlify?.env?.get?.("KALM_PAYMENT_RECONCILIATION_TOKEN") ?? process.env.KALM_PAYMENT_RECONCILIATION_TOKEN ?? "");
  const supplied = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const tokenBuffer = Buffer.from(token, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");
  return Boolean(token) && tokenBuffer.length === suppliedBuffer.length && timingSafeEqual(tokenBuffer, suppliedBuffer);
}

function reconciliationRecord(order) {
  return {
    orderId: order.orderId,
    paymentReference: order.paymentReference,
    gateway: order.gateway,
    state: order.state,
    currency: order.currency,
    amountCents: order.amountCents,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    reconciliation: order.reconciliation
  };
}

// This internal-only endpoint is deliberately deny-by-default. Its bearer
// token must be stored only as a Netlify secret and used by the authenticated
// KALM operations boundary, never by browser JavaScript.
export default async function handler(request) {
  try {
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, { status: 405, headers: { allow: "GET" } });
    getPayFastConfig();
    if (!internalAccessAllowed(request)) throw new PayFastError(403, "internal_access_required", "Internal access required.");
    const orders = (await listOrders()).map(reconciliationRecord);
    const totals = orders.reduce((result, order) => {
      result.orders += 1;
      result.grossCents += order.amountCents;
      result.byState[order.state] = (result.byState[order.state] || 0) + 1;
      return result;
    }, { orders: 0, grossCents: 0, byState: {} });
    return json({ gateway: "payfast", generatedAt: new Date().toISOString(), totals, orders });
  } catch (error) {
    return safeError(error);
  }
}
