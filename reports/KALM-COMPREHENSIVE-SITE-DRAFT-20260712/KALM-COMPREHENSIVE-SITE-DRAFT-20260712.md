# KALM Comprehensive Site Merchandising and Homepage Recovery — Draft Only

## Review status

Awaiting Munya visual approval. This branch is a draft-only recovery; no production deployment, production merge or master update has been requested or performed.

## Scope outcome

| Area | Draft result | Status |
| --- | --- | --- |
| Homepage hero | New inclusive six-adult KALM Move campaign, with separate desktop, tablet and mobile assets | Awaiting visual approval |
| Find Your Edit | Four square, full-tile category cards with attached captions and explicit product-colour allocation | Implemented |
| Featured Edit | Three image- and product-colour-distinct editorial cards | Implemented |
| Featured Collection | Dedicated KALM Move Performance Essentials campaign with desktop and mobile crops | Awaiting visual approval |
| Archive Sale | KS Active-only genuine sale products | Implemented |
| Most Wanted | Unique, current product-colour allocation | Implemented |
| New In | Nine current non-KS Active new-in products | Implemented |
| Activewear | Ten current KALM Move performance and accessory products | Implemented |
| Sale | Fourteen genuine sale product-colour cards | Implemented |
| Outdoor | Exactly Ember 16, Forge 2 and Ridge 4 appliance products | Implemented |
| Logo treatment | Approved KALM Collective source retained; its opaque white field is neutralised visually through CSS blending, not source editing | Implemented |
| Discoverability | Public paths, SPA rewrites, canonical/OG metadata, JSON-LD, robots, sitemap and llms.txt | Implemented |

## Allocation and validation

- Central source of truth: `merchandising.js`.
- Allocated cards: 49, with one product-colour key per requested merchandising surface.
- Comprehensive validator: 172 checks passed.
- Existing catalogue, recovery, KALM Move men/women, bottle, Outdoor, rejected-asset, mobile-first and image-dimension validators passed.
- See `MERCHANDISING-MAP.json`, `MERCHANDISING-UNIQUENESS.md` and `VALIDATION.json`.

## Campaign asset review

Two asset classes were authorised: homepage hero and Featured Collection. Three controlled generation calls were used because the homepage required a mobile-specific art direction after its first crop removed people from the six-person cast. The rejected/not-used derivatives are retained outside public asset paths. See `CAMPAIGN-IMAGE-AUDIT.md`, `HERO-REFERENCE-LOCK.md`, `FEATURED-COLLECTION-REFERENCE-LOCK.md`, and the campaign contact sheets.

## Visual evidence

See `SCREENSHOT-MANIFEST.json`, `HOMEPAGE-BEFORE-AFTER-COMPARISON.jpg`, `LOGO-TREATMENT-COMPARISON.jpg`, `HERO-GENERATION-CONTACT-SHEET.jpg`, and `FEATURED-COLLECTION-CONTACT-SHEET.jpg`.

## Machine-discoverability boundary

The draft exposes stable, crawlable public paths and machine-readable discovery files. Search and AI inclusion cannot be guaranteed; it remains each service's policy and indexing decision. See `DISCOVERABILITY.md`.

## Deployment control

Netlify draft URL: pending final draft deployment.

Production baseline remains the previously verified KALM Storefront Site production deployment `6a53ce7fb63d08e5a8f70e8a`. The Munya task application has not been changed.
