import { createOrderRepository } from "./_shared/order-store.mjs";
import {
  assertRateLimit,
  errorResponse,
  getRuntimeConfig,
  json,
  PaymentError,
  readJson,
  safeCustomerOrder,
  verifyAndRecordPayment
} from "./_shared/paystack-core.mjs";

export default async (request, context) => {
  if (request.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405);
  try {
    const payload = await readJson(request);
    const reference = String(payload?.reference || "").trim();
    if (!reference) throw new PaymentError("missing_reference", "We could not verify this payment reference.");
    const runtime = getRuntimeConfig(context, request);
    const repository = createOrderRepository();
    await assertRateLimit(repository, { bucket: "verify", ip: context.ip, limit: 20, windowMs: 10 * 60 * 1000 });
    const result = await verifyAndRecordPayment({ reference, repository, config: runtime });
    return json({
      ok: true,
      paymentStatus: result.paymentStatus,
      idempotent: result.idempotent,
      order: safeCustomerOrder(result.order)
    });
  } catch (error) {
    return errorResponse(error);
  }
};

export const config = {
  path: "/api/payments/paystack/verify",
  method: ["POST"]
};
