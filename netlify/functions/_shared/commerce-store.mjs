import { getDatabase } from "@netlify/database";
import { createHash, randomUUID } from "node:crypto";
import { PAYFAST_ORDER_STATES, PayFastError } from "./payfast-core.mjs";

function db() {
  return getDatabase().pool;
}

function isoNow() {
  return new Date().toISOString();
}

function payloadHash(text) {
  return createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

function toOrder(row, items = []) {
  if (!row) return null;
  return {
    orderId: row.order_id,
    paymentReference: row.order_reference,
    idempotencyKey: row.idempotency_key,
    state: row.payment_status === "paid" ? PAYFAST_ORDER_STATES.PAID : row.payment_status,
    paymentStatus: row.payment_status,
    fulfilmentStatus: row.fulfilment_status,
    refundStatus: row.refund_status,
    amountCents: row.total_cents,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_charge_cents,
    currency: row.currency,
    customer: { name: row.customer_name, email: row.customer_email, phone: row.customer_phone },
    delivery: row.shipping_address,
    checkoutMode: row.checkout_mode,
    description: `${items.reduce((sum, item) => sum + item.quantity, 0)} KALM Collective item${items.length === 1 ? "" : "s"}`,
    items,
    reservedUntil: row.reserved_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAt: row.paid_at,
    payfastPaymentId: row.payfast_payment_id,
    invoiceReference: row.invoice_reference
  };
}

async function fetchOrder(client, orderId) {
  const result = await client.query("SELECT * FROM commerce_orders WHERE order_id = $1", [orderId]);
  if (!result.rowCount) return null;
  const items = await client.query("SELECT * FROM commerce_order_items WHERE order_id = $1 ORDER BY sku", [orderId]);
  return toOrder(result.rows[0], items.rows.map((item) => ({
    sku: item.sku,
    productId: item.product_id,
    productName: item.product_name,
    colour: item.colour,
    size: item.size,
    quantity: item.quantity,
    unitPriceCents: item.unit_price_cents,
    lineTotalCents: item.line_total_cents
  })));
}

export async function createReservedOrder({ orderId, paymentReference, idempotencyKey, seller, checkoutMode, customer, delivery, items, shippingCents, legalAcceptance, marketingConsent, reservationMinutes }) {
  const pool = db();
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    const existing = await client.query("SELECT order_id FROM commerce_orders WHERE idempotency_key = $1", [idempotencyKey]);
    if (existing.rowCount) {
      const order = await fetchOrder(client, existing.rows[0].order_id);
      await client.query("COMMIT");
      return { order, reused: true };
    }
    for (const item of items) {
      const inventory = await client.query("SELECT sku, available_quantity, reserved_quantity, sellable FROM commerce_inventory WHERE sku = $1 FOR UPDATE", [item.sku]);
      if (!inventory.rowCount || !inventory.rows[0].sellable || inventory.rows[0].available_quantity < item.quantity) {
        throw new PayFastError(409, "inventory_unavailable", "One or more selected variants are no longer available.");
      }
    }
    const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const expiresAt = new Date(Date.now() + reservationMinutes * 60_000).toISOString();
    await client.query(`INSERT INTO commerce_orders (
      order_id, order_reference, idempotency_key, seller_name, seller_registration, checkout_mode,
      customer_name, customer_email, customer_phone, shipping_address, shipping_method,
      shipping_charge_cents, subtotal_cents, total_cents, legal_acceptance, marketing_consent,
      payment_status, fulfilment_status, reserved_until
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15::jsonb,$16,'pending','not_ready',$17)`, [
      orderId, paymentReference, idempotencyKey, seller.name, seller.registration, checkoutMode,
      customer.name, customer.email, customer.phone, JSON.stringify(delivery), "Standard Courier (South Africa)",
      shippingCents, subtotalCents, subtotalCents + shippingCents, JSON.stringify(legalAcceptance), Boolean(marketingConsent), expiresAt
    ]);
    for (const item of items) {
      await client.query("UPDATE commerce_inventory SET available_quantity = available_quantity - $1, reserved_quantity = reserved_quantity + $1, updated_at = NOW() WHERE sku = $2", [item.quantity, item.sku]);
      await client.query("INSERT INTO commerce_order_items (order_id, sku, product_id, product_name, colour, size, quantity, unit_price_cents, line_total_cents) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [orderId, item.sku, item.productId, item.productName, item.colour, item.size, item.quantity, item.unitPriceCents, item.lineTotalCents]);
      await client.query("INSERT INTO commerce_reservations (order_id, sku, quantity, expires_at) VALUES ($1,$2,$3,$4)", [orderId, item.sku, item.quantity, expiresAt]);
    }
    if (marketingConsent) {
      await client.query("INSERT INTO commerce_marketing_preferences (email, subscribed, source, consent_at) VALUES ($1, true, 'checkout', NOW()) ON CONFLICT (email) DO UPDATE SET subscribed = true, source = EXCLUDED.source, consent_at = EXCLUDED.consent_at, withdrawn_at = NULL, updated_at = NOW()", [customer.email]);
    }
    await client.query("INSERT INTO commerce_analytics_events (analytics_event_id, event_type, order_id, data) VALUES ($1, 'payment_started', $2, $3::jsonb)", [randomUUID(), orderId, JSON.stringify({ checkoutMode, itemCount: items.length })]);
    const order = await fetchOrder(client, orderId);
    await client.query("COMMIT");
    return { order, reused: false };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function getOrder(orderId) {
  const client = await db().connect();
  try { return await fetchOrder(client, orderId); } finally { client.release(); }
}

export async function getOrderByReference(reference) {
  const client = await db().connect();
  try {
    const record = await client.query("SELECT order_id FROM commerce_orders WHERE order_reference = $1", [reference]);
    return record.rowCount ? await fetchOrder(client, record.rows[0].order_id) : null;
  } finally { client.release(); }
}

export async function markAwaitingGateway(orderId) {
  const result = await db().query("UPDATE commerce_orders SET updated_at = NOW() WHERE order_id = $1 AND payment_status = 'pending' RETURNING order_id", [orderId]);
  if (!result.rowCount) throw new PayFastError(409, "payment_not_retryable", "This order cannot be paid again.");
  return getOrder(orderId);
}

export async function processVerifiedItn({ orderReference, gatewayTransactionId, targetState, amountCents, rawPayload, payfastStatus }) {
  const pool = db();
  const client = await pool.connect();
  const hash = payloadHash(rawPayload);
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    const orderResult = await client.query("SELECT * FROM commerce_orders WHERE order_reference = $1 FOR UPDATE", [orderReference]);
    if (!orderResult.rowCount) throw new PayFastError(404, "unknown_order", "Unknown payment reference.");
    const row = orderResult.rows[0];
    if (row.total_cents !== amountCents) throw new PayFastError(400, "amount_mismatch", "Amount mismatch.");
    const duplicate = await client.query("SELECT event_id FROM commerce_payment_events WHERE gateway = 'payfast' AND (gateway_transaction_id = $1 OR payload_sha256 = $2)", [gatewayTransactionId || null, hash]);
    if (duplicate.rowCount || row.payment_status === "paid") {
      await client.query("INSERT INTO commerce_payment_events (event_id, order_id, gateway, gateway_transaction_id, event_type, amount_cents, verification_state, payload_sha256, processed_at) VALUES ($1,$2,'payfast',$3,'duplicate_itn',$4,'duplicate',$5,NOW()) ON CONFLICT DO NOTHING", [randomUUID(), row.order_id, gatewayTransactionId || null, amountCents, hash]);
      const order = await fetchOrder(client, row.order_id);
      await client.query("COMMIT");
      return { order, duplicate: true, paid: row.payment_status === "paid" };
    }
    if (targetState === PAYFAST_ORDER_STATES.PENDING_CONFIRMATION) {
      await client.query("UPDATE commerce_orders SET payfast_payment_id = COALESCE($1, payfast_payment_id), payfast_status = $2, updated_at = NOW() WHERE order_id = $3", [gatewayTransactionId || null, payfastStatus, row.order_id]);
      const order = await fetchOrder(client, row.order_id);
      await client.query("COMMIT");
      return { order, duplicate: false, paid: false };
    }
    if (targetState === PAYFAST_ORDER_STATES.PAID) {
      const reservations = await client.query("SELECT sku, quantity FROM commerce_reservations WHERE order_id = $1 FOR UPDATE", [row.order_id]);
      if (!reservations.rowCount) throw new PayFastError(409, "reservation_missing", "Payment reservation is no longer available.");
      for (const reservation of reservations.rows) {
        const update = await client.query("UPDATE commerce_inventory SET reserved_quantity = reserved_quantity - $1, sold_quantity = sold_quantity + $1, updated_at = NOW() WHERE sku = $2 AND reserved_quantity >= $1", [reservation.quantity, reservation.sku]);
        if (!update.rowCount) throw new PayFastError(409, "inventory_reservation_invalid", "Inventory reservation is unavailable.");
      }
      await client.query("DELETE FROM commerce_reservations WHERE order_id = $1", [row.order_id]);
      const invoiceReference = `KALM-R-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${row.order_id.slice(-8).toUpperCase()}`;
      await client.query("UPDATE commerce_orders SET payment_status = 'paid', fulfilment_status = 'ready_to_pack', payfast_payment_id = $1, payfast_status = $2, paid_at = NOW(), invoice_reference = $3, reserved_until = NULL, updated_at = NOW() WHERE order_id = $4", [gatewayTransactionId || null, payfastStatus, invoiceReference, row.order_id]);
      await client.query("INSERT INTO commerce_fulfilment_events (fulfilment_event_id, order_id, event_type, notes) VALUES ($1,$2,'ready_to_pack','Verified PayFast payment')", [randomUUID(), row.order_id]);
      await client.query("INSERT INTO commerce_email_outbox (email_id, order_id, message_type, recipient) VALUES ($1,$2,'payment_received_customer',$3),($4,$2,'payment_received_internal',$5) ON CONFLICT DO NOTHING", [randomUUID(), row.order_id, row.customer_email, randomUUID(), "orders@kalmcollective.co.za"]);
      await client.query("INSERT INTO commerce_analytics_events (analytics_event_id, event_type, order_id, data) VALUES ($1,'payment_completed',$2,$3::jsonb)", [randomUUID(), row.order_id, JSON.stringify({ amountCents })]);
    } else if ([PAYFAST_ORDER_STATES.CANCELLED, PAYFAST_ORDER_STATES.FAILED].includes(targetState)) {
      const reservations = await client.query("SELECT sku, quantity FROM commerce_reservations WHERE order_id = $1 FOR UPDATE", [row.order_id]);
      for (const reservation of reservations.rows) await client.query("UPDATE commerce_inventory SET available_quantity = available_quantity + $1, reserved_quantity = reserved_quantity - $1, updated_at = NOW() WHERE sku = $2", [reservation.quantity, reservation.sku]);
      await client.query("DELETE FROM commerce_reservations WHERE order_id = $1", [row.order_id]);
      await client.query("UPDATE commerce_orders SET payment_status = $1, payfast_payment_id = COALESCE($2, payfast_payment_id), payfast_status = $3, cancelled_at = NOW(), reserved_until = NULL, updated_at = NOW() WHERE order_id = $4", [targetState === PAYFAST_ORDER_STATES.CANCELLED ? "cancelled" : "failed", gatewayTransactionId || null, payfastStatus, row.order_id]);
    }
    await client.query("INSERT INTO commerce_payment_events (event_id, order_id, gateway, gateway_transaction_id, event_type, amount_cents, verification_state, payload_sha256, processed_at) VALUES ($1,$2,'payfast',$3,$4,$5,'verified',$6,NOW())", [randomUUID(), row.order_id, gatewayTransactionId || null, targetState, amountCents, hash]);
    const order = await fetchOrder(client, row.order_id);
    await client.query("COMMIT");
    return { order, duplicate: false, paid: targetState === PAYFAST_ORDER_STATES.PAID };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function releaseExpiredReservations() {
  const pool = db(); const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const expired = await client.query("SELECT order_id FROM commerce_orders WHERE payment_status = 'pending' AND reserved_until < NOW() FOR UPDATE");
    for (const { order_id: orderId } of expired.rows) {
      const reservations = await client.query("SELECT sku, quantity FROM commerce_reservations WHERE order_id = $1 FOR UPDATE", [orderId]);
      for (const reservation of reservations.rows) await client.query("UPDATE commerce_inventory SET available_quantity = available_quantity + $1, reserved_quantity = reserved_quantity - $1, updated_at = NOW() WHERE sku = $2", [reservation.quantity, reservation.sku]);
      await client.query("DELETE FROM commerce_reservations WHERE order_id = $1", [orderId]);
      await client.query("UPDATE commerce_orders SET payment_status = 'cancelled', cancelled_at = NOW(), reserved_until = NULL, updated_at = NOW() WHERE order_id = $1", [orderId]);
    }
    await client.query("COMMIT"); return expired.rowCount;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function paidOrderCount() {
  const result = await db().query("SELECT COUNT(*)::int AS count FROM commerce_orders WHERE payment_status = 'paid'");
  return result.rows[0].count;
}

export async function reconciliationSnapshot() {
  const [inventory, orders] = await Promise.all([
    db().query("SELECT sku, product_id, colour, size, unit_price_cents, available_quantity, reserved_quantity, sold_quantity, sellable FROM commerce_inventory ORDER BY sku"),
    db().query("SELECT order_id, order_reference, payment_status, fulfilment_status, total_cents, created_at FROM commerce_orders ORDER BY created_at DESC")
  ]);
  return { generatedAt: isoNow(), inventory: inventory.rows, orders: orders.rows };
}

export async function publicInventorySnapshot() {
  const result = await db().query("SELECT sku, available_quantity FROM commerce_inventory WHERE sellable = true ORDER BY sku");
  return result.rows.map((row) => ({
    sku: row.sku,
    availableQuantity: Number(row.available_quantity),
    available: Number(row.available_quantity) > 0,
    availability: Number(row.available_quantity) === 0 ? "sold_out" : Number(row.available_quantity) <= 3 ? "low_stock" : "in_stock"
  }));
}

export async function performOrderOperation({ orderId, action, details = {} }) {
  const pool = db();
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    const orderResult = await client.query("SELECT * FROM commerce_orders WHERE order_id = $1 FOR UPDATE", [orderId]);
    if (!orderResult.rowCount) throw new PayFastError(404, "order_not_found", "Order not found.");
    const row = orderResult.rows[0];
    const paid = row.payment_status === "paid" || row.payment_status === "partially_refunded";
    if (["mark_packed", "mark_dispatched", "mark_delivered"].includes(action) && !paid) {
      throw new PayFastError(409, "order_not_paid", "Only a verified paid order can be fulfilled.");
    }
    if (action === "mark_packed") {
      await client.query("UPDATE commerce_orders SET fulfilment_status = 'packed', updated_at = NOW() WHERE order_id = $1", [orderId]);
      await client.query("INSERT INTO commerce_fulfilment_events (fulfilment_event_id, order_id, event_type, notes) VALUES ($1,$2,'packed',$3)", [randomUUID(), orderId, String(details.notes || "Packed by KALM operations").slice(0, 500)]);
    } else if (action === "mark_dispatched") {
      const courier = String(details.courier || "").trim().slice(0, 120);
      const tracking = String(details.trackingNumber || "").trim().slice(0, 160);
      if (!courier || !tracking) throw new PayFastError(400, "dispatch_details_required", "Courier and tracking number are required.");
      await client.query("UPDATE commerce_orders SET fulfilment_status = 'dispatched', updated_at = NOW() WHERE order_id = $1", [orderId]);
      await client.query("INSERT INTO commerce_fulfilment_events (fulfilment_event_id, order_id, event_type, courier, tracking_number, notes) VALUES ($1,$2,'dispatched',$3,$4,$5)", [randomUUID(), orderId, courier, tracking, String(details.notes || "").slice(0, 500)]);
      await client.query("INSERT INTO commerce_email_outbox (email_id, order_id, message_type, recipient) VALUES ($1,$2,'dispatch_customer',$3) ON CONFLICT DO NOTHING", [randomUUID(), orderId, row.customer_email]);
    } else if (action === "mark_delivered") {
      await client.query("UPDATE commerce_orders SET fulfilment_status = 'delivered', updated_at = NOW() WHERE order_id = $1", [orderId]);
      await client.query("INSERT INTO commerce_fulfilment_events (fulfilment_event_id, order_id, event_type, notes) VALUES ($1,$2,'delivered',$3)", [randomUUID(), orderId, String(details.notes || "Delivery confirmed").slice(0, 500)]);
    } else if (action === "request_refund") {
      if (!paid) throw new PayFastError(409, "refund_not_available", "A verified payment is required before a refund can be requested.");
      const amountCents = Number(details.amountCents);
      const reason = String(details.reason || "Customer request").trim().slice(0, 500);
      if (!Number.isInteger(amountCents) || amountCents < 1 || amountCents > row.total_cents) throw new PayFastError(400, "invalid_refund_amount", "Refund amount is invalid.");
      await client.query("INSERT INTO commerce_refunds (refund_id, order_id, amount_cents, reason, state) VALUES ($1,$2,$3,$4,'requested')", [randomUUID(), orderId, amountCents, reason]);
      await client.query("UPDATE commerce_orders SET refund_status = 'requested', updated_at = NOW() WHERE order_id = $1", [orderId]);
    } else if (action === "authorise_refund") {
      const refund = await client.query("SELECT * FROM commerce_refunds WHERE order_id = $1 AND state = 'requested' ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [orderId]);
      if (!refund.rowCount) throw new PayFastError(409, "refund_not_pending", "No requested refund is available to authorise.");
      await client.query("UPDATE commerce_refunds SET state = 'authorised', updated_at = NOW() WHERE refund_id = $1", [refund.rows[0].refund_id]);
      await client.query("UPDATE commerce_orders SET refund_status = 'authorised', updated_at = NOW() WHERE order_id = $1", [orderId]);
    } else if (action === "record_return_received") {
      const restockDecision = details.restockDecision === "restockable" ? "restockable" : details.restockDecision === "not_restockable" ? "not_restockable" : "";
      if (!restockDecision) throw new PayFastError(400, "restock_decision_required", "Record whether the returned item is restockable.");
      const refund = await client.query("SELECT * FROM commerce_refunds WHERE order_id = $1 AND state IN ('requested','authorised') ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [orderId]);
      if (!refund.rowCount) throw new PayFastError(409, "refund_not_open", "No open refund is available for this return.");
      await client.query("UPDATE commerce_refunds SET state = 'received', restock_decision = $1, updated_at = NOW() WHERE refund_id = $2", [restockDecision, refund.rows[0].refund_id]);
      await client.query("UPDATE commerce_orders SET refund_status = 'received', fulfilment_status = 'return_received', updated_at = NOW() WHERE order_id = $1", [orderId]);
      await client.query("INSERT INTO commerce_fulfilment_events (fulfilment_event_id, order_id, event_type, notes) VALUES ($1,$2,'return_received',$3)", [randomUUID(), orderId, restockDecision]);
    } else if (action === "record_refund_processed") {
      const refund = await client.query("SELECT * FROM commerce_refunds WHERE order_id = $1 AND state IN ('authorised','received') ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [orderId]);
      if (!refund.rowCount) throw new PayFastError(409, "refund_not_authorised", "No authorised refund is available to record.");
      const payFastRefundReference = String(details.payFastRefundReference || "").trim().slice(0, 160);
      if (!payFastRefundReference) throw new PayFastError(400, "refund_reference_required", "The PayFast refund reference is required.");
      const previous = await client.query("SELECT COALESCE(SUM(amount_cents), 0)::int AS total FROM commerce_refunds WHERE order_id = $1 AND state = 'processed'", [orderId]);
      const totalRefunded = Number(previous.rows[0].total) + refund.rows[0].amount_cents;
      if (totalRefunded > row.total_cents) throw new PayFastError(409, "refund_total_exceeded", "Refund total exceeds the verified payment.");
      if (refund.rows[0].restock_decision === "restockable") {
        const items = await client.query("SELECT sku, quantity FROM commerce_order_items WHERE order_id = $1 FOR UPDATE", [orderId]);
        for (const item of items.rows) await client.query("UPDATE commerce_inventory SET available_quantity = available_quantity + $1, sold_quantity = sold_quantity - $1, updated_at = NOW() WHERE sku = $2 AND sold_quantity >= $1", [item.quantity, item.sku]);
        await client.query("INSERT INTO commerce_fulfilment_events (fulfilment_event_id, order_id, event_type, notes) VALUES ($1,$2,'restocked','Returned items restocked after inspection')", [randomUUID(), orderId]);
      }
      const paymentStatus = totalRefunded === row.total_cents ? "refunded" : "partially_refunded";
      await client.query("UPDATE commerce_refunds SET state = 'processed', payfast_refund_reference = $1, updated_at = NOW() WHERE refund_id = $2", [payFastRefundReference, refund.rows[0].refund_id]);
      await client.query("UPDATE commerce_orders SET refund_status = 'processed', payment_status = $1, updated_at = NOW() WHERE order_id = $2", [paymentStatus, orderId]);
    } else {
      throw new PayFastError(400, "unknown_operation", "Unknown operations action.");
    }
    const order = await fetchOrder(client, orderId);
    await client.query("COMMIT");
    return order;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function claimEmailBatch(limit = 20) {
  const pool = db(); const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const claimed = await client.query("SELECT email_id FROM commerce_email_outbox WHERE state IN ('pending','failed') AND attempt_count < 3 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $1", [limit]);
    if (!claimed.rowCount) { await client.query("COMMIT"); return []; }
    const ids = claimed.rows.map((row) => row.email_id);
    await client.query("UPDATE commerce_email_outbox SET state = 'sending', attempt_count = attempt_count + 1 WHERE email_id = ANY($1::text[])", [ids]);
    const messages = await client.query("SELECT e.*, o.order_reference, o.customer_name, o.customer_email, o.total_cents, o.currency, o.fulfilment_status, o.shipping_address FROM commerce_email_outbox e JOIN commerce_orders o ON o.order_id = e.order_id WHERE e.email_id = ANY($1::text[])", [ids]);
    await client.query("COMMIT");
    return messages.rows;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function completeEmail({ emailId, providerMessageId = null, failureCode = null }) {
  await db().query("UPDATE commerce_email_outbox SET state = $1, provider_message_id = $2, last_error_code = $3, sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END WHERE email_id = $4", [failureCode ? "failed" : "sent", providerMessageId, failureCode, emailId]);
}

export async function setMarketingPreference({ email, subscribed, source }) {
  const normalisedEmail = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalisedEmail)) {
    throw new PayFastError(400, "invalid_email", "Enter a valid email address.");
  }
  const normalisedSource = String(source || "website").trim().slice(0, 120) || "website";
  await db().query(
    `INSERT INTO commerce_marketing_preferences (email, subscribed, source, consent_at, withdrawn_at)
     VALUES ($1, $2, $3, CASE WHEN $2 THEN NOW() ELSE NULL END, CASE WHEN $2 THEN NULL ELSE NOW() END)
     ON CONFLICT (email) DO UPDATE SET
       subscribed = EXCLUDED.subscribed,
       source = EXCLUDED.source,
       consent_at = CASE WHEN EXCLUDED.subscribed THEN NOW() ELSE commerce_marketing_preferences.consent_at END,
       withdrawn_at = CASE WHEN EXCLUDED.subscribed THEN NULL ELSE NOW() END,
       updated_at = NOW()`,
    [normalisedEmail, Boolean(subscribed), normalisedSource]
  );
  return { email: normalisedEmail, subscribed: Boolean(subscribed), source: normalisedSource };
}
