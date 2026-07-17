import { createOrderRepository } from "./_shared/order-store.mjs";
import {
  errorResponse,
  getRuntimeConfig,
  json,
  PaymentError,
  verifyAndRecordPayment,
  verifyWebhookSignature
} from "./_shared/paystack-core.mjs";

export default async (request, context) => {
  if (request.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405);
  try {
    const runtime = getRuntimeConfig(context, request);
    if (runtime.mode !== "test" || !runtime.activeSecretKey || runtime.webhookSecretSource !== "PAYSTACK_TEST_SECRET_KEY") {
      throw new PaymentError("webhook_configuration_missing", "Webhook processing is not configured.", 503);
    }
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";
    if (!verifyWebhookSignature(rawBody, signature, runtime.activeSecretKey)) {
      return json({ ok: false, code: "invalid_signature" }, 401);
    }
    const event = JSON.parse(rawBody);
    if (event?.event !== "charge.success") return json({ ok: true, processed: false });
    const reference = String(event?.data?.reference || "").trim();
    if (!reference) return json({ ok: true, processed: false });

    const repository = createOrderRepository();
    const result = await verifyAndRecordPayment({ reference, repository, config: runtime });
    await repository.recordEvent({
      reference,
      eventId: String(event?.data?.id || reference),
      eventType: "charge.success",
      outcome: result.idempotent ? "duplicate_ignored" : result.paymentStatus,
      occurredAt: new Date().toISOString()
    });
    return json({ ok: true, processed: true, idempotent: result.idempotent, paymentStatus: result.paymentStatus });
  } catch (error) {
    return errorResponse(error);
  }
};

export const config = {
  path: "/api/payments/paystack/webhook",
  method: ["POST"]
};
