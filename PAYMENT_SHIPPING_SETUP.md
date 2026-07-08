# Payment And Shipping Setup

The checkout UI now presents a retail order flow with contact details, address, shipping method and payment method selection.

## Payment Options In UI

| Method | Current UI status | External requirement |
| --- | --- | --- |
| PayFast | Selectable at checkout | Merchant ID, merchant key, passphrase and return/cancel/notify URLs. |
| Ozow | Selectable at checkout | Site code, API/private keys and callback URLs. |
| EFT | Selectable at checkout | Bank details, beneficiary name and order reference format. |

## Shipping Options In UI

| Method | Current UI status | External requirement |
| --- | --- | --- |
| Standard courier | Selectable at checkout | Courier account/rate table. |
| Express courier | Selectable at checkout | Courier SLA and pricing. |
| Collection | Selectable at checkout | Pickup address and collection hours. |

## Activation Steps

1. Open PayFast and Ozow merchant accounts.
2. Add credentials to Netlify environment variables.
3. Build serverless payment-session endpoints.
4. Add webhooks for payment state changes.
5. Confirm courier pricing and pickup rules.
6. Run sandbox transactions before switching payment redirection on.

Verdict remains unchanged: KALM Move is validation-ready, not bank-ready or production-ready.
