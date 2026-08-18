# Payment And Shipping Setup

The checkout uses PayFast only, creates a server-side reservation and confirms an order only after a verified PayFast ITN.

## Payment Options In UI

| Method | Current UI status | External requirement |
| --- | --- | --- |
| PayFast | Only payment method | Merchant ID, merchant key, passphrase, return/cancel/notify URLs and ITN verification. |

## Shipping Options In UI

| Method | Current UI status | External requirement |
| --- | --- | --- |
| Standard courier | R99, 2–5 working days | South African delivery address and confirmed-payment fulfilment workflow. |

## Activation Steps

1. Complete the PayFast merchant account verification and retain the owner-test gate until acceptance.
2. Add server-side credentials to Netlify environment variables.
3. Verify a signed PayFast callback and customer status page with one owner test.
4. Confirm the delivery fulfilment workflow before opening checkout publicly.

Verdict remains unchanged: KALM Move is validation-ready, not bank-ready or production-ready.
