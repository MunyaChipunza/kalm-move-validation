# Paystack Test-Mode Integration Audit

Date: 2026-07-17
Scope: KALM Collective storefront draft integration only

## Implemented architecture

- Server-side Netlify Functions initialise and verify Paystack transactions.
- The browser sends only selected variants and delivery details; it never supplies a trusted price or total.
- The server reloads `products.json`, validates the product, SKU, colour, size, availability and permitted quantity, then calculates the amount in ZAR cents.
- Pending orders are persisted in Netlify Blobs with explicit payment states and a high-entropy KALM payment reference.
- Paystack authorisation URLs are the only gateway value returned to the browser.
- The callback page verifies the reference server-side; a redirect alone cannot mark an order paid.
- The webhook validates the exact raw payload with HMAC SHA-512, then independently verifies the transaction with Paystack.
- Paid transitions are idempotent. Test orders are marked `TEST PAYMENT — NO REAL MONEY — DO NOT FULFIL` and retain `test_ledger_only_no_real_inventory_change`.
- Test-mode orders never post to Zoho, create real revenue, enter fulfilment, or deduct real inventory.

## Routes

| Route | Purpose | Exposure |
|---|---|---|
| `/api/payments/paystack/config` | Safe checkout state only | No secret or key material |
| `/api/payments/paystack/initialize` | Validates cart and creates pending payment | Server-only secret use |
| `/api/payments/paystack/verify` | Independently verifies a reference | Server-only secret use |
| `/api/payments/paystack/webhook` | Validates signed `charge.success` events | Server-only secret use |
| `/checkout/payment-result` | Safe customer verification result | No raw gateway data |

## Guardrails

- `PAYSTACK_MODE=test` is required for this release candidate.
- The production hostname always fails closed for test checkout, even if test flags or test keys are present.
- Live checkout additionally requires `PAYSTACK_MODE=live`, live keys, a production deployment and `PAYSTACK_LIVE_ENABLED=true`.
- Current test-order fulfilment state is `test_payment_do_not_fulfil`; `zohoPostingEnabled=false`.
- Paystack secret values are not committed, returned by the configuration endpoint, included in static assets, logs or reports.

## External acceptance state

The authenticated Paystack dashboard was used in Test Mode only. The callback and signed webhook endpoints are configured for the draft deployment, while the test public and secret credentials are stored only in the Netlify Deploy Previews context. The existing test credential remains in place: key rotation was not performed because Paystack's rotation dialog requires an account-password confirmation. No live payment capability was enabled.

`npm audit --omit=dev --audit-level=high` reported no high or critical advisory, but six moderate transitive OpenTelemetry advisories under the current Netlify Blobs dependency chain. This is recorded as a dependency warning and must be reviewed before any live-payment release.

## Draft verification

Draft deploy: `6a5a284cd949eb7b33d435a9`
Draft URL: `https://6a5a284cd949eb7b33d435a9--kalm-collective-storefront.netlify.app`

- The safe configuration endpoint returned `mode=test`, `checkoutState=available` and no key material.
- A genuine Paystack test transaction for a Black, M KALM Signature Oversized Tee completed, returned through the callback verification route and was visibly marked `TEST PAYMENT — NO REAL MONEY — DO NOT FULFIL`.
- Paystack's Test Mode Declined option was rejected without a paid transition. Closing either a declined or an abandoned hosted checkout now returns to the unchanged bag and restores the payment button.
- The dashboard-delivered signed webhook and a duplicate signed webhook were independently accepted and recorded idempotently. An invalid signature received HTTP 401.
- Function source and private Paystack report URLs both returned HTTP 404.
- Mobile (375 × 812) and desktop (1280 × 720) checkout checks showed the fixed Standard Courier summary, a visible test-mode notice and a usable Paystack test button.
- The public production homepage remained HTTP 200 and has no Paystack configuration route. The separate Munya task application was not modified.

## Scope protection

This branch does not merge to production, does not deploy production, and does not change the Munya task application.
