# KALM PayFast activation-ready validation

Date: 2026-08-04
Scope: implementation and safe configuration only; no customer-facing PayFast payment is enabled.

## Merchant and provider status

- Merchant of record: KALM Collective (PTY) LTD, supported by the completed stock/seller transfer.
- Provider status: PayFast account verification remains provider-controlled. The authenticated `chipunzamunya@gmail.com` session was used to configure the PayFast developer settings and to transfer the issued merchant ID and key into production-only Netlify secrets. No credential was guessed or exposed.
- Paystack: no Paystack environment values, routes or checkout behaviour were changed.

## Safe configuration recorded

The correct Netlify storefront project is `kalm-collective-storefront` (site ID `06334c13-7d82-45f1-b983-4a7295de88d8`). The following non-secret PayFast controls were recorded without enabling the gateway:

- feature flag disabled;
- test mode;
- KALM return, cancellation and server ITN callback paths.
- passphrase-only production secret configuration; merchant credentials remain unconfigured.

The PayFast merchant ID, merchant key and security passphrase are present only as production-only Netlify secrets. The PayFast ITN callback is enabled at the KALM HTTPS endpoint and the required-signature setting is enabled. The reconciliation token remains unconfigured. No credential value is present in source, Git, reports or chat.

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

1. Complete provider account verification and confirm settlement/bank readiness.
2. Configure sandbox credentials in non-production contexts when issued and perform the documented sandbox flow.
3. Configure the internal reconciliation token before operations accesses the private reconciliation endpoint.
4. Only after the protected production gate is clear, set the live enablement flag and approve the GitHub production environment.
