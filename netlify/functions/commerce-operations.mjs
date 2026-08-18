import { PayFastError } from "./_shared/payfast-core.mjs";
import { performOrderOperation } from "./_shared/commerce-store.mjs";
import { requireOperationsAccess } from "./_shared/operations-auth.mjs";
import { json, readJson, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/internal/commerce/orders", method: ["POST"] };

export default async function commerceOperations(request) {
  try {
    requireOperationsAccess(request);
    const body = await readJson(request);
    const orderId = String(body.orderId || "").trim();
    const action = String(body.action || "").trim();
    if (!/^ord_[a-f0-9]{32}$/i.test(orderId)) throw new PayFastError(400, "invalid_order", "Order identifier is invalid.");
    const order = await performOrderOperation({ orderId, action, details: body.details || {} });
    return json({ orderId: order.orderId, paymentStatus: order.paymentStatus, fulfilmentStatus: order.fulfilmentStatus, refundStatus: order.refundStatus, updatedAt: order.updatedAt });
  } catch (error) { return safeError(error); }
}
