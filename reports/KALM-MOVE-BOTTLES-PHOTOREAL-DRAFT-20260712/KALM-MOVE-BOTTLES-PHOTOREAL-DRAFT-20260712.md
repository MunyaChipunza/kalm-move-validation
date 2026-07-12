# KALM Move Bottles: photorealistic image review pack

**Date:** 12 July 2026  
**Stage:** 1, image generation and visual review only  
**Decision required:** Munya visual approval before any separate Stage 2 storefront task  
**Storefront / deployment state:** no catalogue wiring, Netlify draft, production deployment, merge, or upload was performed in this stage.

## Exception and boundaries

NCC records **“KALM Bottle Photorealistic Generation Exception, 12 July 2026.”** It was re-fetched after the update. The narrowly authorised exception applies only to the five KALM Move hydration products in this pack. It does not approve a product listing, supplier lock, storefront integration, production deployment, or future paid image generation.

All newly created assets live under this review directory. `PUBLIC_REVIEW_PATH_REFERENCES=0` was verified outside `reports/` and the pre-existing V1 draft asset directory.

## Review files

- [Reference lock](REFERENCE-LOCK.md)
- [Accepted photography style board](STYLE-REFERENCE-BOARD.jpg)
- [Complete range contact sheet](contact-sheets/complete-range-contact-sheet.jpg)
- [Everyday Bottle contact sheet](contact-sheets/everyday-bottle-contact-sheet.jpg)
- [Slim Wellness Bottle contact sheet](contact-sheets/slim-wellness-bottle-contact-sheet.jpg)
- [Studio Bottle contact sheet](contact-sheets/studio-bottle-contact-sheet.jpg)
- [Protein Shaker Bottle contact sheet](contact-sheets/protein-shaker-bottle-contact-sheet.jpg)
- [All-Day Straw Tumbler contact sheet](contact-sheets/all-day-straw-tumbler-contact-sheet.jpg)
- [Rejected CAD-like V1 versus accepted source photography versus corrected output](comparison/rejected-vs-accepted-vs-corrected.jpg)
- [Final controlled-colour manifest](audit/controlled-colour-manifest.json)
- [Stage 1 QA results](audit/qa-results.json)

## Range summary

| Product | Status | Colours | Views per colour | Silhouette consistency | Photography QA | Supplier lock |
|---|---|---:|---:|---|---|---|
| KALM Move Everyday Bottle | Review-only candidate | 4 | 3 | One locked cylindrical body, cap and carry loop | Pass, logo-free masters plus exact source-mark application | Approved existing source |
| KALM Move Slim Wellness Bottle | Review-only candidate | 4 | 3 | One locked slim body and screw cap | Pass after source-faithful hand-locked colour mask | Approved existing source |
| KALM Move Studio Bottle | Review-only candidate | 4 | 3 | One locked tall body, cap and arched handle | Pass, restrained studio light; detail is a locked master crop | Approved existing source |
| KALM Move Protein Shaker Bottle | Review-only candidate | 4 | 3 | One locked athletic shaker, flip lid, lever and measurement window | Pass, source geometry retained | Approved existing source |
| KALM Move All-Day Straw Tumbler | Provisional concept for review | 4 | 3 | One original locked tumbler body, handle, lid and straw | Pass for visual review only | Provisional reference only |

The 20 colour variants have three views each: front, restrained three-quarter angle and a locked master-derived top/lid detail. Every colour in a SKU comes from the same master image per view, so geometry, crop, light direction, lid, handle/loop, base and logo placement do not drift. The exact plain buffalo source is used only as a small, low-opacity source-mark application on front and angle views.

## Generation and rejection record

| Measure | Result |
|---|---:|
| Image-generation system | OpenAI image generation with controlled colour variation and approved-mark application |
| Generation calls | 16 |
| Final retained generated photo masters | 10 |
| Final review assets | 60 |
| Rejected generated frames | 6 |
| Rejected first colour-control derivatives | 60, retained as one audit batch |
| Generation cost | Not surfaced by the image-generation system |

Rejected-frame reasons:

- `everyday-bottle-black-front-v1-rejected.png`: oversized, approximate generated buffalo mark. It is audit-only.
- Five first-pass generated close-up frames: rejected from the final set to eliminate stray highlight shapes that could read as invented branding or synthetic surface artefacts. All final detail views are clean crops from their locked front masters instead.
- The first 60 colour derivatives were rejected as a batch after QA exposed coloured contact-shadow fragments. The evidence is retained in `audit/rejected/controlled-colour-pass-v1-rejected-shadow-artifacts.jpg`; the final set uses connected-component masks, with Slim Wellness corrected again using a hand-locked source silhouette.

## Validation

- 60 of 60 expected review assets exist.
- All 60 final review assets are 1122 × 1402.
- All generated review assets are kept under `reports/KALM-MOVE-BOTTLES-PHOTOREAL-DRAFT-20260712/`.
- No public storefront file references this review-pack path.
- The approved plain buffalo source hash is `994b2e455cb441eaa1b04b26899a13ebb096fc389d59c64718bc5140ecda7ea2`.
- NCC exception update was written and re-fetched successfully.

## Important workspace note

The branch already contained a stopped V1 bottle draft before this Stage 1 began: `products.json`, `script.js`, several validator files, `assets/images/drafts/`, and the earlier `reports/KALM-MOVE-BOTTLES-DRAFT-20260712/` are pre-existing dirty-worktree items. They were not changed, staged, deployed, or used by this photoreal review pack. The V1 assets remain rejected and are not referenced by this pack.

## Remaining gates

1. Munya visual approval of the five contact sheets and the complete range.
2. Exact Alibaba supplier listing and physical sample lock for the All-Day Straw Tumbler.
3. A separate authorised Stage 2 task before any catalogue path, product record, Netlify draft, or deployment work.

The photorealistic five-product bottle image review pack is ready for Munya. No storefront integration or deployment has been performed.
