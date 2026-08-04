# KALM PayFast activation-ready validation

Date: 2026-08-04
Scope: implementation and safe configuration only; no customer-facing PayFast payment is enabled.

## Merchant and provider status

- Merchant of record: KALM Collective (PTY) LTD, supported by the completed stock/seller transfer.
- Provider status: PayFast account verification remains provider-controlled. The Chrome session used for configuration is signed into `chipunzamunya@gmail.com` on the correct Netlify storefront; the newly opened PayFast page required a fresh sign-in and no credentials were requested or entered.
- Paystack: no Paystack environment values, routes or checkout behaviour were changed.

## Safe configuration recorded

The correct Netlify storefront project is `kalm-collective-storefront` (site ID `06334c13-7d82-45f1-b983-4a7295de88d8`). The following non-secret PayFast controls were recorded without enabling the gateway:

- feature flag disabled;
- test mode;
- credential set marked `none`;
- KALM return, cancellation and server ITN callback paths.

Merchant credentials, passphrase and reconciliation token remain unrecorded in source, Git, reports and chat.

## Implementation coverage

- server-side cart, price, inventory and KALM Move commerce-lock validation;
- signed checkout redirect;
- ITN signature, merchant, currency, amount, status, origin and provider confirmation checks;
- duplicate-notification idempotency;
- private site-scoped order storage and internal reconciliation endpoint;
- explicit payment/refund/chargeback state model;
- disabled-by-default customer presentation;
- protected GitHub workflow release path and no local production deployment.

## Test evidence

| Check | Result |
| --- | --- |
| PayFast core tests | Pass (29 tests) |
| Embedded-secret source scan | Pass (0 findings) |
| Production dependencies audit | Pass (0 vulnerabilities) |
| Workflow validation | Pass |
| Release-control tests | Pass (10 tests) |
| Disabled endpoint check | Pass (`config` does not offer PayFast; initiation returns 503) |
| Activation utility without approval gate | Correctly blocked |

## Release gate status

No deployment occurred. The protected release preflight is currently blocked by the canonical root's existing legacy-content sentinel, which flags unrelated future-brand references already in the storefront source and generated output. This must be resolved through its own approved scope before the protected production workflow can release any change. It was not altered by the PayFast implementation.

## Outstanding provider-controlled actions

1. Sign in to PayFast in the `chipunzamunya@gmail.com` Chrome profile if a fresh authenticated session is required.
2. Complete provider account verification and confirm settlement/bank readiness.
3. Create the passphrase in the approved password manager, configure secret credential values with separated production/preview contexts, and perform the documented sandbox flow.
4. Only after the protected production gate is clear, set the live enablement flag and approve the GitHub production environment.
