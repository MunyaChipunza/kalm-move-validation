import { loadAuthoritativeProducts } from "./_shared/catalogue.mjs";
import { createOrderRepository } from "./_shared/order-store.mjs";
import {
  assertCheckoutAvailable,
  assertRateLimit,
  createPendingOrder,
  errorResponse,
  getRuntimeConfig,
  initializeTransaction,
  json,
  PaymentError,
  readJson
} from "./_shared/paystack-core.mjs";

export default async (request, context) => {
  if (request.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405);
  let order;
  try {
    const runtime = getRuntimeConfig(context, request);
    assertCheckoutAvailable(runtime);
    const repository = createOrderRepository();
    await assertRateLimit(repository, { bucket: "initialize", ip: context.ip, limit: 5, windowMs: 10 * 60 * 1000 });
    const payload = await readJson(request);
    order = await createPendingOrder({
      payload,
      catalogue: loadAuthoritativeProducts(),
      repository,
      mode: runtime.mode
    });
    const callbackUrl = new URL("/checkout/payment-result", request.url).toString();
    const transaction = await initializeTransaction({ order, config: runtime, callbackUrl });
    const initialized = {
      ...order,
      updatedAt: new Date().toISOString(),
      payment: { ...order.payment, initializedAt: new Date().toISOString() }
    };
    await repository.saveOrder(initialized);
    return json({
      ok: true,
      reference: transaction.reference,
      authorizationUrl: transaction.authorizationUrl,
      accessCode: transaction.accessCode,
      testMode: runtime.mode === "test"
    });
  } catch (error) {
    if (order && error instanceof PaymentError && error.code === "payment_initialization_failed") {
      const repository = createOrderRepository();
      await repository.saveOrder({ ...order, status: "payment_failed", updatedAt: new Date().toISOString() });
    }
    return errorResponse(error);
  }
};

export const config = {
  path: "/api/payments/paystack/initialize",
  method: ["POST"]
};
