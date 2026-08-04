import { amountToCents, getPayFastConfig, getPayFastValidateUrl, parameterString, PayFastError, transitionOrder, validateItnPayload, assertPayFastEnabled } from "./_shared/payfast-core.mjs";
import { json, safeError } from "./_shared/http.mjs";
import { getOrderByReference, saveOrder } from "./_shared/payment-store.mjs";

export const config = { path: "/api/payments/payfast/itn" };

function toHeaderObject(headers) {
  return Object.fromEntries(headers.entries());
}

function parseBody(text) {
  const params = new URLSearchParams(text);
  return [...params.entries()];
}

async function confirmWithPayFast(rawParameterString, mode) {
  const response = await fetch(getPayFastValidateUrl(mode), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "text/plain" },
    body: rawParameterString,
    signal: AbortSignal.timeout(8000)
  });
  return response.ok && (await response.text()).trim() === "VALID";
}

export default async function handler(request) {
  try {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405, headers: { allow: "POST" } });
    const runtime = getPayFastConfig();
    // ITNs are only accepted for an enabled, correctly-configured gateway.
    // This prevents a disabled deployment accepting forged or stale callbacks.
    assertPayFastEnabled(runtime);
    const rawBody = await request.text();
    const entries = parseBody(rawBody);
    const reference = Object.fromEntries(entries).m_payment_id;
    const order = await getOrderByReference(reference);
    const { data, targetState, origin } = validateItnPayload({ entries, order, config: runtime, headers: toHeaderObject(request.headers) });
    const confirmationValid = await confirmWithPayFast(parameterString(entries), runtime.mode);
    if (!confirmationValid) throw new PayFastError(400, "server_confirmation_failed", "Server confirmation failed.");

    const duplicateReference = Boolean(order.reconciliation?.gatewayTransactionReference && data.pf_payment_id && order.reconciliation.gatewayTransactionReference === data.pf_payment_id && order.state === targetState);
    const nextOrder = transitionOrder(order, targetState, duplicateReference ? "duplicate_valid_itn" : "valid_itn");
    nextOrder.reconciliation = {
      ...nextOrder.reconciliation,
      gatewayGrossCents: amountToCents(data.amount_gross),
      gatewayFeeCents: data.amount_fee ? amountToCents(Math.abs(Number(data.amount_fee))) : nextOrder.reconciliation.gatewayFeeCents,
      netSettlementCents: data.amount_net ? amountToCents(data.amount_net) : nextOrder.reconciliation.netSettlementCents,
      gatewayTransactionReference: data.pf_payment_id || nextOrder.reconciliation.gatewayTransactionReference,
      notificationTimestamp: new Date().toISOString(),
      paidTimestamp: targetState === "paid" ? new Date().toISOString() : nextOrder.reconciliation.paidTimestamp,
      settlementState: targetState === "paid" ? "unsettled" : nextOrder.reconciliation.settlementState,
      itnOrigin: origin
    };
    await saveOrder(nextOrder);
    return new Response("OK", { status: 200, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
  } catch (error) {
    // Do not leak validation data to a payment provider or a browser.
    const response = safeError(error);
    return new Response("INVALID", { status: response.status, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
  }
}
