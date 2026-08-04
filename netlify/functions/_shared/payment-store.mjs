import { getStore } from "@netlify/blobs";

const STORE_NAME = "kalm-payment-orders";

function key(orderId) {
  return `orders/${encodeURIComponent(orderId)}.json`;
}

function referenceKey(reference) {
  return `references/${encodeURIComponent(reference)}.json`;
}

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export async function saveOrder(order) {
  const blobStore = store();
  await blobStore.setJSON(key(order.orderId), order);
  await blobStore.setJSON(referenceKey(order.paymentReference), { orderId: order.orderId });
  return order;
}

export async function getOrder(orderId) {
  return store().get(key(orderId), { type: "json" });
}

export async function getOrderByReference(reference) {
  const pointer = await store().get(referenceKey(reference), { type: "json" });
  return pointer?.orderId ? getOrder(pointer.orderId) : null;
}

export async function listOrders() {
  const { blobs } = await store().list({ prefix: "orders/" });
  return Promise.all(blobs.map(({ key: blobKey }) => store().get(blobKey, { type: "json" })))
    .then((orders) => orders.filter(Boolean));
}
