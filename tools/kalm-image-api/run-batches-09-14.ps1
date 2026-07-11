param(
  [switch]$Live,
  [switch]$Force,
  [int]$Concurrency = 2
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Python = "C:\Users\Dell\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$ImageCli = "C:\Users\Dell\.codex\skills\.system\imagegen\scripts\image_gen.py"
$InputFile = Join-Path $RepoRoot "tools\kalm-image-api\jobs\batches-09-14.jsonl"
$OutputDir = "C:\Users\Dell\.codex\qa\kalm-api-generated\batch-09-14"

if (-not (Test-Path $Python)) {
  throw "Bundled Python was not found at $Python"
}

if (-not (Test-Path $ImageCli)) {
  throw "Image CLI was not found at $ImageCli"
}

if (-not (Test-Path $InputFile)) {
  throw "Batch input file was not found at $InputFile"
}

New-Item -ItemType Directory -Force $OutputDir | Out-Null

$ArgsList = @(
  $ImageCli,
  "generate-batch",
  "--input", $InputFile,
  "--out-dir", $OutputDir,
  "--concurrency", "$Concurrency",
  "--max-attempts", "8"
)

if ($Force) {
  $ArgsList += "--force"
}

if ($Live) {
  if (-not $env:OPENAI_API_KEY) {
    throw "OPENAI_API_KEY is not set. Set it locally before running live API generation."
  }
  $ArgsList += "--fail-fast"
} else {
  $ArgsList += "--dry-run"
}

& $Python @ArgsList
