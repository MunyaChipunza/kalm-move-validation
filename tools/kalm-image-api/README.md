# KALM Image API Workflow

This folder is the API/CLI workflow for KALM product imagery. It uses the bundled Codex image CLI:

`C:\Users\Dell\.codex\skills\.system\imagegen\scripts\image_gen.py`

The workflow is intentionally separate from the storefront. Running these jobs creates review images only. Do not wire images into `products.json` or deploy until Munya approves the generated variants.

## Status

- Python runtime: `C:\Users\Dell\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`
- API package: `openai` installed in the bundled Python runtime
- Current blocker for live API calls: OpenAI API returns `billing_hard_limit_reached` for the connected Personal / Default project
- Dry-run validation: supported without an API key

## Operating Standard

Use the NCC image bible rules:

- Generate from scratch after a failed render. Do not patch a bad render.
- One product, one colour, one angle per job.
- Preserve supplier garment construction exactly.
- Match the sold colour in the image.
- Keep logo placement small, premium and consistent.
- Do not move the logo to the back if the chosen spot is not visible there.
- Use diverse adult models across each product set.
- Generate review images first. Upload only after approval.

## Recommended Command Pattern

Dry run, no API call:

```powershell
tools\kalm-image-api\run-batch-05.cmd
```

Live run, requires `OPENAI_API_KEY`:

```powershell
tools\kalm-image-api\run-batch-05.cmd -Live
```

Use `-Force` to overwrite existing generated files in the output folder.

## API Key Setup

The API key must be stored locally as an environment variable. Do not paste the key into chat.

Temporary for the current PowerShell session:

```powershell
$env:OPENAI_API_KEY = "sk-..."
```

Persistent for future PowerShell sessions:

```powershell
setx OPENAI_API_KEY "sk-..."
```

After setting a persistent key, restart Codex or open a new terminal so the environment refreshes.

## Approval Flow

1. Run API generation into `C:\Users\Dell\.codex\qa\kalm-api-generated\[batch]`.
2. Build or inspect the review set.
3. Munya approves or rejects images.
4. Only approved images are copied into storefront assets.
5. Only after approval are `products.json`, QA docs, commits or deploys allowed.

## Three-Batch Workflow

For multi-batch API generation, use the three-batch runner with conservative concurrency:

```powershell
tools\kalm-image-api\run-batches-06-08.cmd -Live
```

Current rate-limit finding: concurrency `6` was too aggressive for the active key. Concurrency `2` completed cleanly and is the default.

## Remaining Folders Workflow

Folders `9` through `14` are prepared in:

```powershell
tools\kalm-image-api\jobs\batches-09-14.jsonl
```

Run after billing is available:

```powershell
tools\kalm-image-api\run-batches-09-14.cmd -Live
```

The Batch 09-14 runner uses `--fail-fast` to stop immediately if billing or account limits block generation.
