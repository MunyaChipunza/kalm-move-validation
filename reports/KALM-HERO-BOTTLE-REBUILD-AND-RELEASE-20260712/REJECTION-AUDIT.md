# Rejected Asset Audit: Hero and Bottle Rebuild

## Retired from active use

| Family | Retired active path / pattern | Reason | Replacement |
| --- | --- | --- |
| Six-person hero | `assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-{desktop,tablet,mobile}.webp` | Rejected: pasted/malformed buffalo marks and white artefact risk | `assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-{desktop,tablet,mobile}.webp` |
| Bottle imagery | `assets/images/products/kalm-move/bottles-v2/**` | Rejected historical integration lane | No active reference |
| Bottle imagery | `assets/images/products/kalm-move/bottles-v3/**` | Rejected: soft/smudged customer-facing result and unusable detail crops | `assets/images/products/kalm-move/bottles-v4/**` |
| Bottle detail crops | all `*/detail.*` in V2/V3 galleries | Rejected: enlarged front-image crops rather than useful product views | No V4 detail assets: each colour uses a native front and native alternate view only |

Historical files remain retained as audit evidence and are not deleted. `products.json`, `merchandising.js` and `index.html` no longer map the retired hero or bottle families into customer-facing surfaces.

## V4 safeguards

- Every V4 product image is a new native 1122 × 1402 generated source, converted once to quality-95 WebP.
- No V2 or V3 image was read as a visual master, copied into V4, or referenced by an active bottle record.
- All twenty colourways use a complete two-image native gallery: front plus alternate view.
- All-Day Straw Tumbler remains visible but Coming soon, without price or purchase controls.
