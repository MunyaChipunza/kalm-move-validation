# Domain And Payment Setup

This records the live domain setup and the remaining external setup for activating real payment processing.

Current deployment separation:

- Task app Netlify project: `munya-task-app`
- KALM Collective Netlify project: `kalm-collective-storefront`
- Do not deploy storefront files to `munya-task-app`.
- `kalmcollective.co.za` is assigned to `kalm-collective-storefront`.
- `munya-task-app` uses `https://munya-task-app.netlify.app`.

## Domain

Official Netlify references:

- Add the custom domain before DNS setup: https://docs.netlify.com/manage/domains/get-started-with-domains/
- External DNS record guidance: https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/
- SSL guidance: https://docs.netlify.com/manage/domains/troubleshooting/troubleshoot-ssl-and-https/

Current status:

1. `kalmcollective.co.za` is the storefront primary custom domain.
2. `www.kalmcollective.co.za` is a storefront domain alias.
3. HTTPS is active on the storefront domain.
4. Confirmed URLs:
   - `https://kalmcollective.co.za/`
   - `https://www.kalmcollective.co.za/`
   - `https://kalmcollective.co.za/#/shop`

## Payment

The checkout uses PayFast only. Gateway activation still needs merchant setup and credentials.

Required external inputs:

- PayFast merchant account, merchant ID, merchant key and passphrase.
- Store support email for receipts and payment support.

Recommended environment variables:

```text
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
STORE_SUPPORT_EMAIL=hello@kalmcollective.co.za
```

Implementation steps after credentials are available:

1. Configure the PayFast server credentials and owner-test controls in Netlify.
2. Verify the signed PayFast ITN and server confirmation flow using a controlled owner test.
3. Confirm a verified payment records a single order and preserves the inventory ledger.
4. Switch the server-only checkout mode from owner test to public only after documented acceptance.

Verdict remains unchanged: KALM Move is validation-ready, not bank-ready or production-ready.
