# KALM Move Women back-first — production release

## Release record

- Production baseline before release: `44d46ed8ce10817de05773984d9efda98d4b3153`
- Prior production deploy: `6a540dc418f635bbf3009367`
- Rollback tag: `rollback/kalm-before-women-back-first-and-ksactive-redirect-20260713`
- Implementation commit: `c0140fc`
- Approved evidence commit: `a16418a734a3518ae865938f646d6338eb923e6a`
- Deployment source commit: `48a395a003f29ef60bc44227eac4c0aa7e173a30`
- Production deploy: `6a5526020de52ac89c54c14a`
- Immutable deploy URL: `https://6a5526020de52ac89c54c14a--kalm-collective-storefront.netlify.app`
- Production URL: `https://kalmcollective.co.za`

## Verified scope

Exactly eight audited KALM Move Women products now use the correct back-first image order for every available colour: back, side/three-quarter, then front. The affected list and excluded list remain authoritative in this report directory.

No men’s product, excluded KALM Move Women product, KS Active product, accessory, bottle, Outdoor, Home, Wellness, price, stock, name, description, checkout flow, or bag flow was changed.

## Production proof

- `production-screenshots/open-back-short-romper-production.png` — live Open Back Short Romper loads Black back, angle, front in that order.
- `production-screenshots/cropped-zip-yoga-jacket-unchanged-production.png` — excluded Cropped Zip Yoga Jacket retains front, angle, back order.
- `production-screenshots/ks-active-canonical-destination.png` — canonical KS Active route renders the KS Active landing page.
- Existing draft mobile 375 × 812 and 430 × 932 evidence remains in `mobile-screenshots/`; the underlying approved mapping is unchanged between the draft and production deploy.

## Validation rerun

All checks passed before publication:

| Validation | Result |
|---|---:|
| Catalogue validation | pass — 70 products, 716 variants |
| Scoped ordering and redirect checks | pass — 326 checks |
| Comprehensive storefront checks | pass — 173 checks |
| Final correction checks | pass — 22 checks |
| Mobile-first public-path checks | pass — 888 paths |
| Women branding, rejected-assets, zero-paid-assets, bottle-stage2 checks | pass |
| Product-image dimensions and JavaScript syntax | pass |

The Munya task application (`inquisitive-pastelito-bd6463.netlify.app`) was not deployed, attached as a domain, or otherwise changed.
