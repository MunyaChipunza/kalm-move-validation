# KALM Comprehensive Site Merchandising and Homepage Recovery: Draft Only

## Control record

| Item | Value |
| --- | --- |
| Base master SHA | `cde8186d1490a42e86fcc9759111f4a0318b6332` |
| Bottle release SHA | `cde8186d1490a42e86fcc9759111f4a0318b6332` |
| Draft branch | `codex/kalm-comprehensive-site-draft-20260712` |
| Storefront implementation commit | `09bead2` |
| Evidence commit | `70b39b6c635e5a62e262726a869b4847032490be` |
| Safety tag | `checkpoint/pre-comprehensive-site-draft-20260712` at the verified baseline |
| Draft deploy ID | `6a53dde0bbb3f85835f404b8` |
| Draft URL | https://6a53dde0bbb3f85835f404b8--kalm-collective-storefront.netlify.app |
| Production deploy unchanged | `6a53ce7fb63d08e5a8f70e8a` |

## Completed checklist

| Requirement | Result |
| --- | --- |
| Inclusive desktop, tablet and mobile hero with six adults | Pass: separate responsive assets, final mobile crop retains the full cast |
| Find Your Edit square, tap-safe, caption-attached cards | Pass |
| Featured Edit image and product-colour separation | Pass |
| Dedicated Featured Collection campaign | Pass, awaiting Munya visual approval |
| KS Active-only Archive Sale | Pass |
| Unique Most Wanted, New In, Activewear and Sale allocations | Pass |
| New In excludes KS Active | Pass |
| Outdoor exactly Ember 16, Forge 2 and Ridge 4 | Pass |
| Approved KALM Collective logo without visible white rectangle | Pass: approved source retained and CSS visual treatment applied |
| Selected display colour opens selected product colour | Pass |
| Product/collection public paths and structured data | Pass |
| Standard crawler and AI discovery files | Pass: robots, sitemap and llms files included without index-inclusion claims |
| Draft-only Netlify deployment | Pass |
| Production, master and Munya task application unchanged | Pass |

## Validation

All checks passed:

- Catalogue: 70 products, 716 variants, zero errors.
- Comprehensive draft validator: 173 checks, 49 allocated product-colour cards.
- Existing KALM Move men/women, bottle, Outdoor, rejected-asset, zero-paid-image, mobile-first and image-dimension validators: pass.
- Direct draft routes verified: `/collections/outdoor` rendered three appliance cards; `/products/kalm-move-everyday-bottle?colour=Lilac` opened with Lilac selected, a canonical URL and Product JSON-LD.

## Campaign provenance and evidence

The narrow image-generation exception covered the homepage hero and Featured Collection asset classes only. Three controlled generation calls were used, including one mobile art-direction correction. The original six-person mobile crop and unused derivative remain under `reports/KALM-COMPREHENSIVE-SITE-DRAFT-20260712/audit/rejected/`, outside public image paths.

The detailed evidence pack is [KALM-COMPREHENSIVE-SITE-DRAFT-20260712](KALM-COMPREHENSIVE-SITE-DRAFT-20260712/): reference locks, generation audit, campaign contact sheets, before/after and logo comparison sheets, merchandising map, validation JSON, discoverability report, and desktop/mobile captures.

## Key changed files

- Storefront: `index.html`, `script.js`, `styles.css`, `merchandising.js`, `netlify.toml`.
- Discovery: `robots.txt`, `sitemap.xml`, `llms.txt`.
- Campaign assets: `assets/images/recovered/campaigns-v1/`.
- Review pack and tooling: `reports/KALM-COMPREHENSIVE-SITE-DRAFT-20260712/`, `tools/validate-kalm-comprehensive-site-draft.mjs`, `tools/generate-sitemap.mjs`.

## Known limitations and approval gate

Search and AI access cannot guarantee indexing or inclusion. The homepage hero and Featured Collection image are pending Munya's visual approval. This is a draft-only implementation: no production approval, production deployment or merge to `master` has occurred.

NCC draft-status entry was updated and re-fetched successfully. The Munya task application was not changed.
