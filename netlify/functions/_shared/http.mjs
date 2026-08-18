import { PayFastError } from "./payfast-core.mjs";

export function json(value, init = {}) {
  return Response.json(value, { ...init, headers: { "cache-control": "no-store", ...(init.headers || {}) } });
}

export function safeError(error) {
  if (error instanceof PayFastError) return json({ error: error.code, message: error.message }, { status: error.status });
  console.error("payfast_function_failure", { message: error instanceof Error ? error.message : "unknown" });
  return json({ error: "payment_unavailable", message: "This payment method is not available." }, { status: 503 });
}

export async function readJson(request) {
  try { return await request.json(); }
  catch { throw new PayFastError(400, "invalid_request", "The checkout request is invalid."); }
}

export function html(document, status = 200, headers = {}) {
  return new Response(document, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers } });
}
