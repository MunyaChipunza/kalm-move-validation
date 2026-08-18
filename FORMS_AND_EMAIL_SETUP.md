# KALM Collective Forms and Email Operations

## Current Phase 1 purpose and minimisation

Only the following customer data paths are active for the Phase 1 KS Active Archive launch:

| Purpose | Route / service | Minimum data | Storage / handling |
| --- | --- | --- |
| Customer care | Netlify form | name, email, optional phone, topic and message | Netlify Forms; support handling only |
| Product help | Netlify form | product, name, email and message | Netlify Forms; customer care only |
| KALM Move launch interest | Netlify form | selected product, colour, size, email and explicit notification consent | Netlify Forms; preview-only demand capture |
| Newsletter | `/api/marketing/preference` | email, source and explicit optional consent | Commerce database preference ledger |
| Paid order | PayFast commerce functions | buyer contact, delivery address, legal acceptance and selected Phase 1 SKU | Commerce database; PayFast ITN is authoritative |

Outdoor waitlist and account-updates forms have been retired. They must not be restored without a separate privacy and commercial review.

## Transactional email

No email is sent merely because a browser returns from PayFast. A payment-received customer email and an internal ready-to-pack alert are added to the durable outbox only after a verified PayFast ITN marks the order paid. Dispatch email is added only when operations records courier and tracking information.

The internal email dispatcher requires server-only SMTP configuration. It is intentionally unavailable until the required KALM SMTP variables are configured in the storefront Netlify project. It must never be enabled by putting SMTP credentials in Git or browser JavaScript.

## Marketing preference and suppression

Marketing is optional and separate from terms, order processing and delivery notifications. The preference endpoint records an explicit opt-in or suppression state against the email address. The customer-facing preference page is `/#/unsubscribe`. Transactional order and delivery messages are not marketing.

## Controlled test procedure

1. Use a preview or the authorised owner-test checkout mode.
2. Submit a customer-care form and confirm it appears in the configured Netlify Forms destination.
3. Submit the newsletter form with explicit consent; confirm the preference endpoint records the opt-in without creating an order.
4. Withdraw the same address at `/#/unsubscribe`; confirm the preference becomes suppressed.
5. Run the real owner payment only after PayFast ITN, database and SMTP configuration gates are confirmed. Confirm one payment-received email and one internal alert only after verified ITN.

No testing procedure may send a paid-order email for a failed, cancelled or browser-return-only payment.
