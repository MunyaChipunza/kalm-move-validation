# Paystack Environment Matrix

No key values are stored in this repository or these reports.

| Variable | Test draft requirement | Production behaviour | Current state |
|---|---|---|---|
| `PAYSTACK_MODE` | `test` | Test checkout fails closed on `kalmcollective.co.za` | Required Netlify setting |
| `PAYSTACK_CHECKOUT_ENABLED` | `true` | Does not enable production test checkout | Required Netlify setting |
| `PAYSTACK_LIVE_ENABLED` | `false` | Live checkout remains disabled | Required Netlify setting |
| `PAYSTACK_TEST_PUBLIC_KEY` | Required to expose test checkout | Never used as a secret | Still required from Paystack test dashboard |
| `PAYSTACK_TEST_SECRET_KEY` | Required only by server functions | Never sent to browser | Still required from Paystack test dashboard |
| `PAYSTACK_LIVE_PUBLIC_KEY` | Not used | Reserved for approved live launch | Do not configure now |
| `PAYSTACK_LIVE_SECRET_KEY` | Not used | Reserved for approved live launch | Do not configure now |
| `PAYSTACK_WEBHOOK_SECRET_SOURCE` | `PAYSTACK_TEST_SECRET_KEY` | Must be changed only with an approved live cutover | Required Netlify setting |

## Current safe release behaviour

- A draft without test keys displays `PAYSTACK TEST MODE` and does not initialise payment.
- The production hostname preserves the existing non-Paystack safe checkout behaviour.
- Live payment cannot become active merely by adding a live key: `PAYSTACK_LIVE_ENABLED=true`, a production deployment and verified business/bank readiness are also required.
