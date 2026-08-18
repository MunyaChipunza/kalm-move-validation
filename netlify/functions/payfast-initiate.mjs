import { randomUUID } from "node:crypto";
import { assertCheckoutMode, assertPayFastEnabled, createOrderAccessToken, createPaymentReference, getPayFastConfig, PayFastError } from "./_shared/payfast-core.mjs";
import { buildAuthoritativeItems, buildCustomer, buildDelivery, buildLegalAcceptance, buildOrderDescription, KALM_SELLER, validateIdempotencyKey } from "./_shared/commerce-core.mjs";
import { createReservedOrder, paidOrderCount, releaseExpiredReservations } from "./_shared/commerce-store.mjs";
import { json, readJson, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/payments/payfast/initiate", method: ["POST"] };

export default async function payfastInitiate(request) {
  try {
    const runtime = getPayFastConfig();
    assertPayFastEnabled(runtime);
    const body = await readJson(request);
    const customer = buildCustomer(body.customer);
    assertCheckoutMode(runtime, customer.email);
    const accessSecret = globalThis.Netlify?.env?.get?.("ORDER_ACCESS_SECRET");
    if (!accessSecret) throw new PayFastError(503, "checkout_configuration_missing", "Checkout is temporarily unavailable.");
    await releaseExpiredReservations();
    if ((await paidOrderCount()) >= runtime.firstWaveOrderCap) {
      throw new PayFastError(503, "first_wave_review", "Checkout is temporarily paused while the first launch orders are reviewed.");
    }
    const items = buildAuthoritativeItems(body.items);
    const delivery = buildDelivery(body.delivery);
    const legalAcceptance = buildLegalAcceptance(body.legalAcceptance);
    const idempotencyKey = validateIdempotencyKey(body.idempotencyKey);
    const orderId = `ord_${randomUUID().replaceAll("-", "")}`;
    const result = await createReservedOrder({
      orderId,
      paymentReference: createPaymentReference(),
      idempotencyKey,
      seller: KALM_SELLER,
      checkoutMode: runtime.checkoutMode,
      customer,
      delivery,
      items,
      shippingCents: runtime.shippingCents,
      legalAcceptance,
      marketingConsent: body.marketingConsent === true,
      reservationMinutes: runtime.reservationMinutes
    });
    const order = result.order;
    const accessToken = createOrderAccessToken(order.orderId, accessSecret);
    return json({
      orderId: order.orderId,
      reused: result.reused,
      redirect: `/api/payments/payfast/redirect?order_id=${encodeURIComponent(order.orderId)}&token=${encodeURIComponent(accessToken)}`,
      returnUrl: `/payment-return.html?order_id=${encodeURIComponent(order.orderId)}&token=${encodeURIComponent(accessToken)}`,
      totalCents: order.amountCents,
      currency: order.currency,
      description: buildOrderDescription(order.items)
    }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    return safeError(error);
  }
}
