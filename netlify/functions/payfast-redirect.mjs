import { createPayFastSignature, buildCheckoutFields, getPayFastConfig, assertPayFastEnabled, getPayFastProcessUrl, PayFastError, transitionOrder } from "./_shared/payfast-core.mjs";
import { html, safeError } from "./_shared/http.mjs";
import { getOrder, saveOrder } from "./_shared/payment-store.mjs";

export const config = { path: "/api/payments/payfast/redirect" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

export default async function handler(request) {
  try {
    if (request.method !== "GET") throw new PayFastError(405, "method_not_allowed", "This payment method is not available.");
    const runtime = getPayFastConfig();
    assertPayFastEnabled(runtime);
    const url = new URL(request.url);
    const orderId = url.searchParams.get("order_id") || "";
    const token = url.searchParams.get("token") || "";
    const order = await getOrder(orderId);
    if (!order) throw new PayFastError(404, "order_not_found", "This checkout session is no longer available.");
    const expected = createPayFastSignature([["order_id", orderId], ["order_token", order.orderToken]], runtime.passphrase);
    if (token !== expected) throw new PayFastError(403, "invalid_checkout_session", "This checkout session is no longer available.");
    if (["paid", "fulfilment_ready", "refunded", "charged_back"].includes(order.state)) throw new PayFastError(409, "payment_not_retryable", "This order cannot be paid again.");
    const nextOrder = transitionOrder(order, "awaiting_gateway", "redirected_to_payfast");
    await saveOrder(nextOrder);
    const fields = buildCheckoutFields(nextOrder, runtime);
    const inputs = fields.map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join("");
    return html(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Redirecting to secure payment</title></head><body><p>Redirecting to secure payment…</p><form id="payfast" method="post" action="${getPayFastProcessUrl(runtime.mode)}">${inputs}</form><script>document.getElementById('payfast').submit();</script></body></html>`);
  } catch (error) {
    return safeError(error);
  }
}
