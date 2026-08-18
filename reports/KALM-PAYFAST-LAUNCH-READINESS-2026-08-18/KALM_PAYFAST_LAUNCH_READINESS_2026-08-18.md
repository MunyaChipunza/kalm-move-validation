# KALM PayFast Launch Readiness — 18 August 2026

## Phase 1 commercial boundary

- Seller of record: **KALM Collective (Pty) Ltd**, registration `2025/493384/07`.
- Paid catalogue: **KS Active Archive only**.
- Authoritative physical source: `FINAL-INVENTORY-MANIFEST.json`, SHA-256 `4caac3bb544407718a90bad56860d4db85d7bcfbde355e94b4295292d46e7db2`.
- Reconciled scope: 14 products, 56 stocked colours, 104 physical SKUs and 111 units.
- KALM Move and all other future-brand products remain non-purchasable even when a client submits a forged or stale cart.

## Payment and order architecture

The browser sends only a selected SKU and quantity to `/api/payments/payfast/initiate`. The function rebuilds product, colour, size, price, total and R99 shipping from the reconciled Phase 1 map, reserves inventory inside a serializable database transaction, and creates the signed PayFast hand-off.

`/api/payments/payfast/itn` verifies the documented signature, merchant, ZAR amount, order reference and server-to-server PayFast validation response before it may create a paid state. Browser return is informational only. The database uses payment-event uniqueness, row locks and reservations so an ITN retry cannot create another order, sell the same unit twice or queue duplicate emails.

PayFast is the sole Phase 1 checkout method. Active Paystack, Ozow and standalone EFT checkout paths have been removed. Historical test-detector strings are retained only in validation tooling and do not configure a gateway.

## Delivery, refunds and email

- Delivery: Standard Courier within South Africa, **R99**, with a customer estimate of **2–5 working days after verified payment**.
- Fulfilment: paid → ready to pack → packed → dispatched (courier/tracking) → delivered.
- Refunds: internal request, authorisation, received/inspection and actual PayFast refund reference are recorded before a refund is marked processed. Inventory returns only when the received item is declared restockable.
- Customer payment confirmation and internal order alert are placed in a durable outbox only after verified ITN. Dispatch email is queued only after tracking is recorded. SMTP configuration remains server-only.

## Customer policy and data handling

`/terms.html` records the current delivery, cancellation, returns, refunds, PayFast payment, privacy and marketing rules. Terms acceptance, delivery acceptance and returns/refund acceptance are mandatory and separate from optional marketing consent. Obsolete Outdoor waitlist and account-update forms have been removed. Marketing preferences are stored separately and can be withdrawn at `/#/unsubscribe`.

## Validation completed locally

- `npm test`: 35 deterministic payment, signature, owner-gate, Phase 1 and checkout-boundary checks passed.
- `npm run commerce:reconcile`: passed; no SKU, price or quantity discrepancies.
- `npm run release:validate-workflows`: passed.
- `npm run release:test-controls`: passed.
- `npm run release:verify-controls`: passed.
- Canonical-root forbidden legacy-storefront scan: passed.

## Protected deployment plan

Production is released from `master` only through `.github/workflows/kalm-production-release.yml`. The workflow locks the source commit and Netlify site ID, deploys the generated candidate plus functions, validates the live custom domain and restores the prior immutable deploy if smoke validation fails. No local production deploy is permitted.

## Owner test gate

The runtime control is server-enforced:

- `CHECKOUT_MODE=owner_test` allows only exact emails in `OWNER_TEST_EMAILS`.
- `CHECKOUT_MODE=public` is the single deliberate change that opens checkout after the owner test.
- `FIRST_WAVE_ORDER_CAP=20` remains active in either mode.

The lowest-priced currently reconciled in-stock candidate selected for the final real test is:

| Field | Value |
| --- | --- |
| Product | KS Active Cutout Crossback Bra |
| SKU | `KS-ARCH-P010-IMPRE-L` |
| Colour / size | Imperial Red / L |
| Item price | R399 |
| Shipping | R99 |
| Expected PayFast total | **R498** |

Before the owner test, verify that the SKU remains available in the commerce inventory endpoint. After a verified payment, confirm one paid order, one sold-unit increment, one ready-to-pack fulfilment record, one internal alert, one customer confirmation and a PayFast amount of R498. If a refund is required, use the PayFast dashboard or supported gateway method, then record the actual gateway refund reference in the internal operations ledger before restoring stock.

## Release evidence to append after runtime configuration

This report must be updated after preview, protected production release and live owner-test readiness verification with the preview URL, master SHA, GitHub workflow run, successful production deploy ID, Netlify database status, SMTP test status and final runtime-gate status. No secret, payment credential, database connection string or customer data belongs in this report.
