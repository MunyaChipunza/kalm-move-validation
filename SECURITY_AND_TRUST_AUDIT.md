# Security And Trust Audit

Date: 2026-07-08

## Scope

Checked the static storefront source, Netlify configuration, form handling, redirects, exposed secrets, customer trust surfaces and live QA items.

## Headers Checked

Added Netlify security headers in `netlify.toml` for `/*`:

- `Content-Security-Policy`
- `Permissions-Policy`
- `Referrer-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`

The CSP allows:

- scripts from the site itself
- styles from the site itself plus inline style attributes used for colour swatches
- images from the site, `data:` placeholders and HTTPS image URLs
- forms posting back to the site

## Forms Checked

Forms use Netlify Forms with hidden detection skeletons in `index.html`.

Live form names:

- `kalm-collective-contact`
- `kalm-collective-newsletter`
- `kalm-collective-order`
- `kalm-collective-product-help`
- `kalm-collective-account-updates`

All visible forms include POPIA consent where customer personal information is submitted.

## Exposed Environment Variables And Secrets

Checked live storefront files for secret/API-key patterns.

Result:

- No live frontend API keys found in `index.html`, `script.js`, `styles.css`, `products.json` or `netlify.toml`.
- No production Netlify environment variables are set for `kalm-collective-storefront`.
- Internal payment setup docs contain blank placeholder keys only, such as `OZOW_PRIVATE_KEY=`.

## Redirect Rules Checked

- No `_redirects` file was found.
- `netlify.toml` contains no redirects.
- Hash-router links remain inside the storefront.
- Delivery/returns hash anchors now parse correctly for links like `#/policies#delivery`.

## HTTPS And Domain Trust

- `kalmcollective.co.za` is assigned to `kalm-collective-storefront`.
- `www.kalmcollective.co.za` is assigned as an alias.
- `munya-task-app` has no KALM custom domain attached.
- HSTS is configured in `netlify.toml`.

## Customer Trust Surfaces

The storefront includes:

- Delivery policy
- Returns policy
- Payment note that card details are not collected on the page
- Privacy/POPIA language
- Contact form
- Customer care email and weekday hours
- Order notes in checkout
- Product help form on product detail pages

## Console Errors Checked

Local Playwright QA captured no console warnings or errors on the tested storefront routes.

Routes/flows checked:

- home mobile and desktop
- shop mobile and desktop
- all brand pages
- one product detail page per brand
- variant image switching
- add to bag
- checkout summary
- contact form presence
- newsletter form presence
- separate task app URL identity

## Unresolved Risks

- Payment gateway redirection is not active yet; checkout currently captures order details and selected payment method for assisted review.
- Netlify form notification recipients must be configured in the Netlify UI.
- Final supplier/lifecycle policies should be reviewed before paid traffic.
- KALM Move remains validation-ready, not bank-ready or production-ready.
