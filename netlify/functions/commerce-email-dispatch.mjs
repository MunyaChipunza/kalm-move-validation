import nodemailer from "nodemailer";
import { claimEmailBatch, completeEmail } from "./_shared/commerce-store.mjs";
import { requireOperationsAccess } from "./_shared/operations-auth.mjs";
import { createOrderAccessToken } from "./_shared/payfast-core.mjs";
import { json, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/internal/commerce/email-dispatch", method: ["POST"] };

function env(name) { return String(globalThis.Netlify?.env?.get?.(name) || "").trim(); }

function cents(centsValue) { return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 }).format(Number(centsValue || 0) / 100); }

function content(message) {
  const order = message.order_reference;
  if (message.message_type === "payment_received_customer") {
    const secret = env("ORDER_ACCESS_SECRET");
    const origin = env("KALM_PUBLIC_SITE_URL") || "https://kalmcollective.co.za";
    const receipt = secret && message.order_id
      ? ` View your receipt: ${origin.replace(/\/$/, "")}/api/orders/receipt?order_id=${encodeURIComponent(message.order_id)}&token=${encodeURIComponent(createOrderAccessToken(message.order_id, secret))}`
      : "";
    return { subject: `KALM Collective payment received — ${order}`, text: `Thank you, ${message.customer_name}. We have verified your PayFast payment of ${cents(message.total_cents)} for order ${order}. We will email you again when your order is dispatched. KALM Collective (Pty) Ltd.${receipt}` };
  }
  if (message.message_type === "dispatch_customer") {
    return { subject: `KALM Collective order dispatched — ${order}`, text: `Your KALM Collective order ${order} has been marked as dispatched. Contact support@kalmcollective.co.za if you need assistance.` };
  }
  return { subject: `KALM order ready to pack — ${order}`, text: `Verified PayFast payment received for ${order}. Total: ${cents(message.total_cents)}. Fulfilment status: ${message.fulfilment_status}. Review the order in the internal operations ledger.` };
}

export default async function commerceEmailDispatch(request) {
  try {
    requireOperationsAccess(request);
    const host = env("KALM_SMTP_HOST");
    const user = env("KALM_SMTP_USER");
    const password = env("KALM_SMTP_PASSWORD");
    const from = env("KALM_SMTP_FROM");
    if (!host || !user || !password || !from) return json({ dispatched: 0, state: "blocked_configuration" }, { status: 503 });
    const port = Number.parseInt(env("KALM_SMTP_PORT") || "587", 10);
    const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass: password } });
    const messages = await claimEmailBatch(20);
    const outcomes = [];
    for (const message of messages) {
      try {
        const mail = content(message);
        const result = await transport.sendMail({ from, to: message.recipient, subject: mail.subject, text: mail.text });
        await completeEmail({ emailId: message.email_id, providerMessageId: result.messageId || null });
        outcomes.push({ emailId: message.email_id, state: "sent" });
      } catch {
        await completeEmail({ emailId: message.email_id, failureCode: "delivery_failed" });
        outcomes.push({ emailId: message.email_id, state: "failed" });
      }
    }
    return json({ dispatched: outcomes.filter((outcome) => outcome.state === "sent").length, outcomes });
  } catch (error) { return safeError(error); }
}
