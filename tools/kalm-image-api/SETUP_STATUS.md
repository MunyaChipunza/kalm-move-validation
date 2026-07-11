# KALM Image API Setup Status

## Current Status

- API workflow folder created: `tools/kalm-image-api/`
- Bundled image CLI configured: `C:\Users\Dell\.codex\skills\.system\imagegen\scripts\image_gen.py`
- Bundled Python configured: `C:\Users\Dell\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`
- OpenAI Python package installed in bundled Python runtime
- Batch 05 job file created: `tools/kalm-image-api/jobs/batch-05-wide-leg-pants.jsonl`
- Batch 05 runner created: `tools/kalm-image-api/run-batch-05.ps1`
- Windows wrapper created: `tools/kalm-image-api/run-batch-05.cmd`
- Dry-run validation: passed
- Live API generation: completed for Batch 05
- Review sheets: created

## Batch 05 Coverage

- Product: KALM Move standalone high-waist wide-leg yoga pants
- Colours: Light Blue, Gray, Cream Yellow, Gray Blue, Pink, Dark Purple, Black, Burgundy Red, Brown, Rose Red, Light Grey, Blue
- Angles per colour: front, side/angle, back
- Total jobs: 36
- Output folder: `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-05`

## NCC Bible Rules Hardwired

- Generate from scratch after failed renders
- Supplier garment construction must be preserved
- One fixed logo location per product
- No logo moved to back views
- No logo on styling tops
- Explicit model diversity across race, skin tone, body type, and hairstyle
- No screenshots, UI, text, labels, watermarks, colour smudging, or pasted clothing
- Review images are generated first; storefront upload happens only after approval

## Review Output

- Generated images: `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-05`
- Review sheet 1: `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-05\batch-05-review-sheet-1.png`
- Review sheet 2: `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-05\batch-05-review-sheet-2.png`
- Review sheet 3: `C:\Users\Dell\.codex\qa\kalm-api-generated\batch-05\batch-05-review-sheet-3.png`

## Live Generation Command

```powershell
tools\kalm-image-api\run-batch-05.cmd -Live
```

Dry-run can be repeated without a key:

```powershell
tools\kalm-image-api\run-batch-05.cmd
```
