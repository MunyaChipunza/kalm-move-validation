import { buildCheckoutFields, getPayFastConfig, assertPayFastEnabled, getPayFastProcessUrl, PayFastError, validOrderAccessToken } from "./_shared/payfast-core.mjs";
import { getOrder, markAwaitingGateway } from "./_shared/commerce-store.mjs";
import { html, safeError } from "./_shared/http.mjs";
import { runtimeEnvGet } from "./_shared/runtime-env.mjs";

export const config = { path: "/api/payments/payfast/redirect", method: ["GET"] };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

export default async function payfastRedirect(request) {
  try {
    const runtime = getPayFastConfig();
    assertPayFastEnabled(runtime);
    const url = new URL(request.url);
    const orderId = url.searchParams.get("order_id") || "";
    const token = url.searchParams.get("token") || "";
    const accessSecret = runtimeEnvGet("ORDER_ACCESS_SECRET")
      || runtimeEnvGet("KALM_PAYMENT_RECONCILIATION_TOKEN");
    if (!accessSecret || !validOrderAccessToken(orderId, token, accessSecret)) throw new PayFastError(403, "invalid_checkout_session", "This checkout session is no longer available.");
    const order = await getOrder(orderId);
    if (!order) throw new PayFastError(404, "order_not_found", "This checkout session is no longer available.");
    if (order.paymentStatus !== "pending") throw new PayFastError(409, "payment_not_retryable", "This order cannot be paid again.");
    const nextOrder = await markAwaitingGateway(orderId);
    const fields = buildCheckoutFields(nextOrder, runtime);
    const inputs = fields.map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join("");
    return html(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Redirecting to secure payment</title></head><body><main><p>Redirecting to secure payment…</p></main><form id="payfast" method="post" action="${getPayFastProcessUrl(runtime.mode)}">${inputs}<button type="submit">Continue to secure payment</button></form><script>document.getElementById('payfast').submit();</script></body></html>`, 200, {
      // This one-hop response alone permits the documented gateway hand-off.
      // The static storefront retains its restrictive CSP.
      "content-security-policy": "default-src 'none'; base-uri 'none'; form-action https://www.payfast.co.za https://sandbox.payfast.co.za; script-src 'unsafe-inline'; style-src 'none'; frame-ancestors 'none'"
    });
  } catch (error) { return safeError(error); }
}
