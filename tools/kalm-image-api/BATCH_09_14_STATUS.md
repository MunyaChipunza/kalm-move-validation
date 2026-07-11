# Batches 09-14 Status

## Status

- Batch file created and dry-run validated.
- Live generation completed after billing was restored.
- Review sheets created for Munya approval.
- No storefront upload has been done.
- Generated images are review-only until Munya approves the variants.

## Previous Blocking Error

The first live attempt returned:

`Billing hard limit has been reached.`

This was an account/project billing limit, not a prompt, folder, or code issue. The batch was rerun successfully after billing was sorted.

## Coverage Prepared

| Batch | Supplier folder | Product | Colours prepared | Views per colour | Planned images |
|---|---|---|---:|---:|---:|
| 09 | `C:\Users\Dell\Downloads\QuickShare_2607092323\9` | Hooded windbreaker jacket and running short set | 1 visible colour | 3 | 3 |
| 10 | `C:\Users\Dell\Downloads\QuickShare_2607092323\10` | Cropped full-zip yoga jacket | 1 visible colour | 3 | 3 |
| 11 | `C:\Users\Dell\Downloads\QuickShare_2607092323\11` | Strappy open-back short unitard | 10 visible colours | 3 | 30 |
| 12 | `C:\Users\Dell\Downloads\QuickShare_2607092323\12` | Ruched high-waist biker shorts | 8 visible colours | 3 | 24 |
| 13 | `C:\Users\Dell\Downloads\QuickShare_2607092323\13` | Loose split running shorts | 3 visible colours | 3 | 9 |
| 14 | `C:\Users\Dell\Downloads\QuickShare_2607092323\14` | Split running skort with inner short | 3 visible colours | 3 | 9 |

Total planned images: 78.

Hidden or unreadable supplier colours were not included.

## Completed Output

Output folder:

`C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14`

Generated product images: 78.

Review sheets:

- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-09-review-sheet-1.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-10-review-sheet-1.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-11-review-sheet-1.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-11-review-sheet-2.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-11-review-sheet-3.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-12-review-sheet-1.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-12-review-sheet-2.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-13-review-sheet-1.png`
- `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14\batch-14-review-sheet-1.png`

## QA Notes

- Quick visual review passed for source-locked garment shape, visible colour consistency, front/angle/back coverage, and restrained front/side buffalo logo placement.
- No generated images were uploaded to the storefront.
- No storefront product data, deployment settings, Netlify settings, or task-app files were changed.
- The API key was not written to repo files or generated output logs.

## Ready Commands

Dry-run:

```powershell
tools\kalm-image-api\run-batches-09-14.cmd
```

Live run after billing is unlocked:

```powershell
tools\kalm-image-api\run-batches-09-14.cmd -Live
```

The live runner uses `--fail-fast` so a billing issue stops immediately instead of attempting every job.

## Approval Rule

Do not upload any generated images to the storefront until Munya approves the variants.
