# Batches 06-08 Review

## Status

- Live API generation completed for three batches.
- Review-only output created.
- No storefront upload has been done.
- User approval is still required before copying any image into storefront assets.

## Output

- Output folder: `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08`
- Product images generated: 84
- Review sheets generated: 8

## Batch Coverage

| Batch | Supplier folder | Product | Colours generated | Views per colour | Images |
|---|---|---|---:|---:|---:|
| 06 | `C:\Users\Dell\Downloads\QuickShare_2607092323\6` | X-back bra and leggings set | 10 visible colours | 3 | 30 |
| 07 | `C:\Users\Dell\Downloads\QuickShare_2607092323\7` | Halter open-back biker short set | 7 visible colours | 3 | 21 |
| 08 | `C:\Users\Dell\Downloads\QuickShare_2607092323\8` | Cropped zip jacket and leggings set | 11 visible colours | 3 | 33 |

Hidden `Show more` supplier colours were not generated because they were not visible in the attached screenshots.

## Review Sheets

- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08\batch-06-review-sheet-1.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08\batch-06-review-sheet-2.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08\batch-06-review-sheet-3.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08\batch-07-review-sheet-1.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08\batch-07-review-sheet-2.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08\batch-08-review-sheet-1.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08\batch-08-review-sheet-2.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-06-08\batch-08-review-sheet-3.png`

## QA Notes

- The first live run at concurrency 6 hit API rate limits and generated only 33 images.
- The missing 51 images completed successfully at concurrency 2 with higher retry allowance.
- Use concurrency 2 as the current stable default for three-batch generation.
- Logo placement stays small and restrained on the front or side-visible lower garment area.
- Back views do not move the logo to the back.
- Model diversity is visible across the three batches.
- Output remains review-only until Munya approves.

## Approval Rule

Do not upload these images to the storefront until Munya approves the variants.
