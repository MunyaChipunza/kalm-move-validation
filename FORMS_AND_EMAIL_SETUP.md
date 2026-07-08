# Forms And Email Setup

Date: 2026-07-08

## Provider

KALM Collective uses Netlify Forms for storefront forms.

Reason: the site is hosted on Netlify, Netlify Forms requires no public API key in the frontend, and the existing storefront already had Netlify form skeletons for order and contact capture.

Note: `munyachipunza.com` uses Web3Forms in places, but this storefront is using Netlify Forms to avoid adding a new third-party form key or exposing any secret in client code.

## Where Submissions Go

Submissions appear in Netlify:

`kalm-collective-storefront` -> Forms

Email notifications should be configured in the Netlify UI under:

Project configuration -> Notifications -> Form submission notifications

Recommended recipient: `hello@kalmcollective.co.za`

## Live Forms

Verified on production deploy `6a4eb00ae3f1bc522f8f6c88`: Netlify detected the current form names below.

| Form | Netlify form name | Where used | Fields |
|---|---|---|---|
| Contact form | `kalm-collective-contact` | `#/contact` | name, email, phone, topic, message, POPIA consent |
| Newsletter/signup form | `kalm-collective-newsletter` | homepage newsletter panel | email, source, POPIA consent |
| Order form | `kalm-collective-order` | `#/checkout` | name, email, phone, address, suburb, city, province, postal code, shipping method, payment method, cart summary, order total, notes, POPIA consent |
| Product help form | `kalm-collective-product-help` | product detail pages | product, name, email, message, POPIA consent |
| Account updates form | `kalm-collective-account-updates` | `#/account` | name, email, POPIA consent |

## Order Notes

Checkout includes an `Order notes` textarea.

Those notes are submitted as the `notes` field in the `kalm-collective-order` Netlify form payload. The cart summary also includes product, colour, size and quantity.

## Newsletter Signups

Newsletter submissions use `kalm-collective-newsletter`.

Fields:

- `email`
- `source`
- `popia_consent`

Current source value: `homepage`

## How To Test Form Delivery

1. Deploy the site to Netlify.
2. Open `https://kalmcollective.co.za`.
3. Submit the newsletter form with a test email.
4. Open Netlify -> `kalm-collective-storefront` -> Forms.
5. Confirm the `kalm-collective-newsletter` submission appears.
6. Submit the contact form from `#/contact`.
7. Confirm the `kalm-collective-contact` submission appears.
8. Add a product to the bag, go to checkout, add an order note, and submit.
9. Confirm the `kalm-collective-order` submission includes colour, size, order note and cart summary.

## Important

- Do not add API keys to `script.js`, `index.html`, or `products.json`.
- Keep the hidden Netlify detection forms in `index.html`.
- If a new JavaScript-rendered form is added, add a matching hidden skeleton form in `index.html` with the exact same `name` and fields.
- Netlify may still list older inactive form names from previous deploys. Use the current form names in this document as the source of truth.
