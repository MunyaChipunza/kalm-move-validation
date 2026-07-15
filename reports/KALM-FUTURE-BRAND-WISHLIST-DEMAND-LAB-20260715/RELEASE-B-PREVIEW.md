# KALM Future Brand Wishlist Demand Lab — Release B Preview

Status: preview-only. Production deployment is not authorised for Release B.

## Scope

- Adds a controlled future-brand wishlist demand lab.
- Does not modify `products.json`, KS Active prices, KS Active SKUs, KS Active quantities, KS Active imagery, cart logic, checkout logic, Zoho, the KALM intranet, or the Munya task application.
- Uses a standalone research shortlist with 12 total candidates:
  - KALM Move: 3
  - KALM Wellness: 3
  - KALM Home: 3
  - KALM Outdoor: 3

## Commercial state controls

Future candidates are labelled `In consideration`.

Required copy is present:

> No launch date has been set. Add this to your wishlist to help us decide what to develop or source first.

Future candidates expose no add-to-bag control, price, in-stock status, checkout path, or Product Offer structured data.

KS Active remains live and purchasable with 14 visible archive products, 104 physical SKUs and 111 units.

## Wishlist UX

- Native button with heart/bookmark state.
- Visible CTA copy.
- `aria-pressed` state.
- Keyboard support through native button semantics.
- 46px minimum mobile target.
- LocalStorage persistence.
- Add/remove support.
- Anonymous use without email.
- Optional preference panel for size, colour and price band.
- Optional launch-notification email.
- Notification consent is separate.
- Marketing consent is separate and unticked by default.

## Storage method

Netlify Forms fallback: `kalm-future-demand-event`.

This repo is a static storefront and does not currently contain a supported authenticated persistent function/store for production aggregate dashboards. The preview therefore captures schema-complete public events through Netlify Forms and provides a read-only browser-local KALM Ops preview summary with CSV export. A protected KALM Ops aggregate endpoint remains a production follow-up before any private aggregate reporting goes live.

## A/B experiment

- Experiment ID: `wishlist-cta-copy-v1`
- Variant A: `Add to wishlist`
- Variant B: `Vote for this product`
- Assignment persists in localStorage.
- Product order, pricing and imagery are not changed by the experiment.

## Local smoke result

See `LOCAL-SMOKE-TEST.json`.

Key result:

- Demand lab loaded on mobile viewport.
- 12 candidates rendered.
- Lab page add-to-bag count: 0.
- Wishlist add persisted.
- Preference event recorded.
- Marketing consent default unchecked.
- KS Active Racer Knit Bra still had add-to-bag.
- Future candidate page add-to-bag count: 0.
- Future candidate structured data included no `Offer`.

## Preview verification

- Preview URL: https://6a5770dc223557c36fb6383c--kalm-collective-storefront.netlify.app
- Deploy ID: `6a5770dc223557c36fb6383c`
- Branch commit used for preview: `cf6789a`

See `PREVIEW-SMOKE-TEST.json`.

Key preview result:

- `/future-demand` clean route rendered the demand lab.
- 12 future candidates rendered.
- Demand lab add-to-bag count: 0.
- Wishlist add persisted and changed the CTA to `On your wishlist`.
- Candidate page label: `In consideration`.
- Candidate page add-to-bag count: 0.
- Candidate page structured data included no `Offer`.
- KS Active Racer Knit Bra still had add-to-bag.
- Production deployment was not run for Release B.
