import { PayFastError, validOrderAccessToken } from "./_shared/payfast-core.mjs";
import { getOrder } from "./_shared/commerce-store.mjs";
import { json, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/payments/payfast/status", method: ["GET"] };

export default async function payfastStatus(request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("order_id") || "";
    const token = url.searchParams.get("token") || "";
    const accessSecret = globalThis.Netlify?.env?.get?.("ORDER_ACCESS_SECRET");
    if (!accessSecret || !validOrderAccessToken(orderId, token, accessSecret)) throw new PayFastError(403, "invalid_checkout_session", "This payment record is unavailable.");
    const order = await getOrder(orderId);
    if (!order) throw new PayFastError(404, "order_not_found", "This payment record is unavailable.");
    return json({ orderId: order.orderId, reference: order.paymentReference, paymentStatus: order.paymentStatus, fulfilmentStatus: order.fulfilmentStatus, currency: order.currency, totalCents: order.amountCents, invoiceReference: order.invoiceReference || null, updatedAt: order.updatedAt });
  } catch (error) { return safeError(error); }
}
