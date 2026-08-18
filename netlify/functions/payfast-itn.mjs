import { amountToCents, assertPayFastEnabled, getPayFastConfig, getPayFastValidateUrl, PayFastError, validateItnPayload } from "./_shared/payfast-core.mjs";
import { getOrderByReference, processVerifiedItn } from "./_shared/commerce-store.mjs";
import { safeError } from "./_shared/http.mjs";

export const config = { path: "/api/payments/payfast/itn", method: ["POST"] };

function parseBody(text) { return [...new URLSearchParams(text).entries()]; }

async function confirmWithPayFast(rawBody, mode) {
  const response = await fetch(getPayFastValidateUrl(mode), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "text/plain" },
    // Echo the exact body PayFast sent. Re-serialising fields can alter their
    // encoding and is not a valid substitute for gateway confirmation.
    body: rawBody,
    signal: AbortSignal.timeout(8_000)
  });
  return response.ok && (await response.text()).trim() === "VALID";
}

export default async function payfastItn(request) {
  try {
    const runtime = getPayFastConfig();
    assertPayFastEnabled(runtime);
    const rawBody = await request.text();
    const entries = parseBody(rawBody);
    const reference = Object.fromEntries(entries).m_payment_id;
    const order = await getOrderByReference(reference);
    const { data, targetState } = validateItnPayload({ entries, order, config: runtime, headers: Object.fromEntries(request.headers.entries()) });
    if (!(await confirmWithPayFast(rawBody, runtime.mode))) {
      throw new PayFastError(400, "server_confirmation_failed", "Server confirmation failed.");
    }
    await processVerifiedItn({
      orderReference: reference,
      gatewayTransactionId: data.pf_payment_id || null,
      targetState,
      amountCents: amountToCents(data.amount_gross),
      rawPayload: rawBody,
      payfastStatus: data.payment_status
    });
    return new Response("OK", { status: 200, headers: { "content-type": "text/plain", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch (error) {
    const response = safeError(error);
    return new Response("INVALID", { status: response.status, headers: { "content-type": "text/plain", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  }
}
