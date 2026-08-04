# PayFast activation-ready integration

## Purpose and current release posture

This document records the production-ready PayFast implementation for KALM Collective. KALM Collective (PTY) LTD is the merchant of record for the current KS Active checkout under the completed, documented stock and seller transfer. The payment integration deliberately remains disabled until PayFast account verification, credential configuration, test settlement and the protected production release gate have all passed.

**Current setting:** `PAYFAST_ENABLED=false`.

Paystack configuration and the existing checkout choices remain untouched. PayFast is not presented to customers while the feature flag is false, and its server endpoints fail closed.

## Security boundaries

- Merchant credentials and the PayFast passphrase belong only in secret Netlify environment variables. They must never be committed, copied into source, placed in reports, pasted into chat, or added to Google Drive.
- The PayFast security passphrase is configured in PayFast and held only as a production-only Netlify secret. It must never be exported, copied into local files or source control, or revealed through browser output.
- Production credentials must use a production-only value context. Test credentials may be used only with `PAYFAST_MODE=test` and `PAYFAST_CREDENTIAL_SET=sandbox`.
- `PAYFAST_ENABLED` must stay `false` until the live test and protected release gate pass. Enabling it is a separate, auditable production action.
- Customer payment records are server-side Netlify Blobs data. Product data, source imagery and client-side state do not include payment credentials, gateway references, fees, or settlement records.

## Netlify configuration

The following non-secret controls are configured for `kalm-collective-storefront`:

| Variable | Current safe value | Purpose |
| --- | --- | --- |
| `PAYFAST_ENABLED` | `false` | Customer gateway feature flag |
| `PAYFAST_MODE` | `test` | Prevents an accidental live endpoint while disabled |
| `PAYFAST_CREDENTIAL_SET` | `none` | Records that no credentials are yet configured |
| `PAYFAST_RETURN_URL` | KALM payment pending route | Browser-return screen only |
| `PAYFAST_CANCEL_URL` | KALM payment cancelled route | Browser-cancellation screen |
| `PAYFAST_NOTIFY_URL` | KALM PayFast ITN endpoint | Server-to-server confirmation |

Configure these only as **secret** values, with production and preview contexts separated:

- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `KALM_PAYMENT_RECONCILIATION_TOKEN`

Current verified state: `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` and `KALM_PAYMENT_RECONCILIATION_TOKEN` are present as production-only secrets; the PayFast ITN callback is enabled at the configured KALM HTTPS endpoint and PayFast's required-signature setting is enabled. The gateway remains disabled.

The reconciliation token is an internal-operations credential. It may be used only by an authenticated KALM operations service to call the private reconciliation endpoint; it must never be exposed to browser JavaScript or a public dashboard.

## Checkout and confirmation flow

1. The checkout browser sends selected cart identifiers and customer delivery information to `/api/payments/payfast/initiate`.
2. The server re-reads `products.json`, rejects KALM Move and unavailable variants, recomputes the total, creates the order reference and saves the private record.
3. `/api/payments/payfast/redirect` validates a signed single-order session and posts a signed form to the configured PayFast endpoint.
4. PayFast returns the browser to the KALM pending or cancelled route. A browser return never changes an order to paid.
5. `/api/payments/payfast/itn` accepts only a server notification that passes all checks: known order, merchant identifier, signature, ZAR currency, server-calculated total, recognised status, origin assessment and PayFast's server confirmation response.
6. Only a valid ITN can move an order to `paid`; the order may then be marked `fulfilment_ready` by internal operations.

## State model and reconciliation

The model includes `created`, `awaiting_gateway`, `pending_confirmation`, `paid`, `fulfilment_ready`, `cancelled`, `failed`, `refund_pending`, `refunded`, `chargeback_open`, and `charged_back`.

Private reconciliation records track expected and confirmed gross amounts, provider fees, net settlement, transaction reference, notification timestamp, payout reference/date, refund amount and chargeback state. The internal report endpoint is `/api/internal/payments/payfast/reconciliation` and requires the internal secret token. It returns no payment data without that token.

Refund, chargeback and payout lifecycle actions require a separately authorised operational process. They must never be inferred from a customer browser return.

## Provider verification and test plan

PayFast has acknowledged the application, while account verification remains provider-controlled. Before any live enablement:

1. Confirm the approved business profile, settlement bank details and activation status in PayFast.
2. Rotate the merchant key if instructed by PayFast and replace only the production-only Netlify secret value.
3. Add sandbox credentials to non-production contexts when issued and run one successful low-value sandbox payment.
4. Verify the server notification, duplicate-notification handling, pending/cancelled return pages, order state and private reconciliation record.
5. Run a distinct failed/cancelled test and verify no fulfilment state is created.
6. After provider approval, configure live credentials only in the production context, maintain `PAYFAST_ENABLED=false`, and run the protected GitHub release validation.
7. Obtain the protected production-environment approval, enable the flag in the production secret configuration, and release through `.github/workflows/kalm-production-release.yml` only.
8. Run a low-value live transaction, confirm the ITN/reconciliation record, verify the payment and refund procedure, and retain the audit evidence outside public source control.

## Verification commands

Run from the canonical storefront root:

```powershell
npm run payfast:test
npm run payfast:security
node --check netlify/functions/payfast-initiate.mjs
node --check netlify/functions/payfast-itn.mjs
```

`npm run payfast:activate` is a preflight guard. It requires explicit production context and intentionally does not publish or modify a Netlify production alias. The final deploy is protected by the GitHub production workflow.

## Rollback

If checkout, ITN validation, provider settlement, price/amount comparison, or reconciliation fails:

1. Set `PAYFAST_ENABLED=false` in the production secret configuration.
2. Do not mark any affected order as fulfilment-ready.
3. Preserve the private order and provider evidence for reconciliation.
4. Re-run the protected release workflow with the known-good configuration if a code rollback is required.

Never use a local `netlify deploy --prod` command for KALM production.
