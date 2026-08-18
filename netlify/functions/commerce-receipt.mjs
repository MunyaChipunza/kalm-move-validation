import { PayFastError, validOrderAccessToken } from "./_shared/payfast-core.mjs";
import { getOrder } from "./_shared/commerce-store.mjs";
import { html, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/orders/receipt", method: ["GET"] };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function money(cents) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 }).format(Number(cents || 0) / 100);
}

function addressLines(delivery) {
  const address = delivery && typeof delivery === "object" ? delivery : {};
  return [address.addressLine1, address.addressLine2, address.suburb, address.city, address.province, address.postalCode, address.country || "South Africa"]
    .filter(Boolean).map(escapeHtml).join("<br>");
}

function receiptDocument(order) {
  const items = order.items.map((item) => `<tr><td>${escapeHtml(item.productName)}<br><small>${escapeHtml(item.colour)} · ${escapeHtml(item.size)} · ${escapeHtml(item.sku)}</small></td><td>${item.quantity}</td><td>${money(item.unitPriceCents)}</td><td>${money(item.lineTotalCents)}</td></tr>`).join("");
  return `<!doctype html><html lang="en-ZA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Receipt ${escapeHtml(order.invoiceReference || order.paymentReference)} | KALM Collective</title><style>:root{font-family:Arial,sans-serif;color:#171716;background:#f8f7f4}body{margin:0;padding:24px}.receipt{max-width:760px;margin:auto;background:#fff;padding:36px;border:1px solid #dedbd5}.header{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap}.muted,small{color:#5b5954}table{width:100%;border-collapse:collapse;margin:28px 0}th,td{padding:12px 4px;border-bottom:1px solid #dedbd5;text-align:left;vertical-align:top}th:last-child,td:last-child{text-align:right}.totals{margin-left:auto;width:min(320px,100%)}.totals p{display:flex;justify-content:space-between;gap:16px}.total{font-weight:700;border-top:1px solid #171716;padding-top:12px}.notice{font-size:.9rem;color:#5b5954;margin-top:28px}.print{padding:10px 14px;border:1px solid #171716;background:#fff;font-weight:700;cursor:pointer}@media print{body{padding:0;background:#fff}.receipt{border:0;padding:0}.print{display:none}}</style></head><body><main class="receipt"><div class="header"><div><p class="muted">KALM COLLECTIVE (PTY) LTD</p><h1>Payment receipt</h1><p>Company registration: 2025/493384/07</p></div><div><button class="print" onclick="window.print()">Print receipt</button><p><strong>${escapeHtml(order.invoiceReference || order.paymentReference)}</strong></p><p class="muted">Verified PayFast payment</p></div></div><hr><div class="header"><div><h2>Customer</h2><p>${escapeHtml(order.customer.name)}<br>${escapeHtml(order.customer.email)}<br>${escapeHtml(order.customer.phone || "")}</p></div><div><h2>Delivery</h2><p>${addressLines(order.delivery)}</p><p class="muted">Standard Courier (South Africa)<br>2–5 working days after dispatch</p></div></div><table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${items}</tbody></table><section class="totals"><p><span>Items</span><span>${money(order.subtotalCents)}</span></p><p><span>Standard shipping</span><span>${money(order.shippingCents)}</span></p><p class="total"><span>Paid</span><span>${money(order.amountCents)}</span></p></section><p class="notice">This receipt confirms a verified payment received by KALM Collective (Pty) Ltd. It is not a VAT invoice. Need help? support@kalmcollective.co.za</p></main></body></html>`;
}

export default async function commerceReceipt(request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("order_id") || "";
    const token = url.searchParams.get("token") || "";
    const accessSecret = globalThis.Netlify?.env?.get?.("ORDER_ACCESS_SECRET");
    if (!accessSecret || !validOrderAccessToken(orderId, token, accessSecret)) throw new PayFastError(403, "invalid_receipt_session", "This receipt is unavailable.");
    const order = await getOrder(orderId);
    if (!order || !["paid", "partially_refunded", "refunded"].includes(order.paymentStatus)) throw new PayFastError(404, "receipt_not_available", "This receipt is unavailable.");
    return html(receiptDocument(order), 200, { "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" });
  } catch (error) {
    const response = safeError(error);
    return html(`<!doctype html><title>Receipt unavailable</title><p>Receipt unavailable. Contact support@kalmcollective.co.za if you need help.</p>`, response.status);
  }
}
