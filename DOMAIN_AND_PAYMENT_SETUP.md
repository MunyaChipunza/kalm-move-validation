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

The checkout UI already offers PayFast, Ozow and EFT selection. Gateway activation still needs merchant setup and credentials.

Required external inputs:

- PayFast merchant account, merchant ID, merchant key and passphrase.
- Ozow merchant account, site code, private key and API key.
- EFT beneficiary name, bank, branch code, account number and reference format.
- Store support email for receipts and payment support.

Recommended environment variables:

```text
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
OZOW_SITE_CODE=
OZOW_PRIVATE_KEY=
OZOW_API_KEY=
STORE_BANK_NAME=
STORE_BANK_ACCOUNT_NAME=
STORE_BANK_ACCOUNT_NUMBER=
STORE_BANK_BRANCH_CODE=
STORE_SUPPORT_EMAIL=hello@kalmcollective.co.za
```

Implementation steps after credentials are available:

1. Add a serverless checkout endpoint for PayFast/Ozow session creation.
2. Add payment webhook handling for successful, failed and cancelled payments.
3. Add EFT instruction email generation using the selected order reference.
4. Run sandbox transactions for PayFast and Ozow.
5. Switch checkout submit from order capture to gateway redirection once payment callbacks are verified.

Verdict remains unchanged: KALM Move is validation-ready, not bank-ready or production-ready.
