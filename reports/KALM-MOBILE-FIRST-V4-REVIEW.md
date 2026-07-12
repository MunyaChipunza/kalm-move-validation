# KALM Mobile-First Fourth Draft Review

- Draft preview: https://6a53638bbbb3f8a3fbf40378--kalm-collective-storefront.netlify.app
- Branch: `codex/kalm-mobile-first-men-v4-preview-20260712`
- Preview code commit: `39b65299007d45d7cd28ae1670e120d8f94b045c`
- Production: unchanged

## Men V3 decision

- Reviewed: 46/46
- Approved for this preview: 46
- Rejected: 0
- Active men products: 11
- Active men product colours: 46
- Active V3 files: 46

Every active colour uses a new versioned `-v4` front-image path. The gallery deliberately contains that one correctly labelled front view only, rather than mixing historical angle or movement assets.

## Mobile QA

- Viewports: 320x568, 360x800, 375x812, 390x844, 412x915, 430x932, 768x1024, 844x390-landscape
- Every viewport: no horizontal overflow recorded.
- 320px: one-column cards. 360px and above: two-column cards.
- Colour switching: 46 selections tested; 0 failed.
- Product detail: 11/11 first gallery images use the V4 path, `contain` fit and natural 1200 × 1500 proportions.
- Filter sheet: opens and closes with accessible state.
- Cart drawer: constrained to the viewport width.
- Footer: compact accordion treatment; the small KALM Collective lock-up loads directly.

## Included evidence

- Four Men V3 contact sheets: current lane, all candidates, old-versus-V3 comparison, final selections
- All 11 Men V4 product-detail first-image captures
- Responsive catalogue captures for the requested viewport matrix
- Mobile header, filter and footer captures, plus cart drawer runtime evidence
- Product/colour audit, active manifest, responsive-image manifest and runtime QA JSON

## Remaining visual limitation

The recovered Men V3 source set contains one vetted front image per colour. This fourth draft does not claim a multi-angle gallery where no corresponding V3 angle/back assets were recovered. Munya approval remains required.
