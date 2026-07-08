# Domain And Payment Setup

This is the remaining external setup for moving from the current deployment URL to `kalmcollective.co.za` and activating real payment processing.

## Domain

Official Netlify references:

- Add the custom domain before DNS setup: https://docs.netlify.com/manage/domains/get-started-with-domains/
- External DNS record guidance: https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/
- SSL guidance: https://docs.netlify.com/manage/domains/troubleshooting/troubleshoot-ssl-and-https/

Steps:

1. In Netlify, open the KALM Collective site, then go to **Domain management**.
2. Add `kalmcollective.co.za` and `www.kalmcollective.co.za` as production domains.
3. Choose the DNS route:
   - Netlify DNS route: follow Netlify's prompts and update the registrar nameservers to the Netlify nameservers shown in the dashboard.
   - External DNS route: point the apex `A` record to `75.2.60.5` and set `www` as a `CNAME` to the Netlify site subdomain. Netlify currently recommends using `www` as the primary domain when external DNS is used.
4. Set the preferred primary domain in Netlify.
5. Wait for DNS propagation, then verify HTTPS under **Domain management > HTTPS**. Netlify provisions Let's Encrypt certificates automatically after valid DNS is detected.
6. Confirm these URLs resolve:
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
