import { getStore } from "@netlify/blobs";

const ORDER_STORE = "kalm-paystack-test-orders";
const EVENT_STORE = "kalm-paystack-test-events";
const RATE_STORE = "kalm-paystack-rate-limits";

function orderKey(reference) {
  return `orders/${encodeURIComponent(reference)}`;
}

export function createOrderRepository() {
  const orders = getStore({ name: ORDER_STORE, consistency: "strong" });
  const events = getStore({ name: EVENT_STORE, consistency: "strong" });
  const rates = getStore({ name: RATE_STORE, consistency: "strong" });

  return {
    async getOrder(reference) {
      return orders.get(orderKey(reference), { type: "json" });
    },
    async saveOrder(order) {
      await orders.setJSON(orderKey(order.reference), order, {
        metadata: {
          paymentMode: order.payment?.mode || "test",
          status: order.status,
          updatedAt: order.updatedAt
        }
      });
      return order;
    },
    async recordEvent({ reference, eventId, eventType, outcome, occurredAt }) {
      const safeEvent = { reference, eventId, eventType, outcome, occurredAt };
      await events.setJSON(`events/${encodeURIComponent(reference)}/${encodeURIComponent(eventId)}`, safeEvent);
      return safeEvent;
    },
    async takeRateLimit({ bucket, fingerprint, limit, windowMs, now = Date.now() }) {
      const key = `limits/${bucket}/${fingerprint}`;
      const current = await rates.get(key, { type: "json" });
      const windowStartedAt = Number(current?.windowStartedAt || 0);
      const active = windowStartedAt > 0 && now - windowStartedAt < windowMs;
      const next = active
        ? { windowStartedAt, count: Number(current.count || 0) + 1 }
        : { windowStartedAt: now, count: 1 };
      if (active && Number(current.count || 0) >= limit) return false;
      await rates.setJSON(key, next);
      return true;
    }
  };
}
