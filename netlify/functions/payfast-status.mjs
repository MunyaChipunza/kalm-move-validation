import { getPayFastConfig, publicOrderState, PayFastError, validPayFastSignature, assertPayFastEnabled } from "./_shared/payfast-core.mjs";
import { json, safeError } from "./_shared/http.mjs";
import { getOrder } from "./_shared/payment-store.mjs";

export const config = { path: "/api/payments/payfast/status" };

export default async function handler(request) {
  try {
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, { status: 405, headers: { allow: "GET" } });
    const runtime = getPayFastConfig();
    assertPayFastEnabled(runtime);
    const url = new URL(request.url);
    const orderId = url.searchParams.get("order_id") || "";
    const token = url.searchParams.get("token") || "";
    const order = await getOrder(orderId);
    if (!order) throw new PayFastError(404, "order_not_found", "This payment record is unavailable.");
    if (!validPayFastSignature([["order_id", orderId], ["order_token", order.orderToken]], token, runtime.passphrase)) throw new PayFastError(403, "invalid_checkout_session", "This payment record is unavailable.");
    return json(publicOrderState(order));
  } catch (error) {
    return safeError(error);
  }
}
