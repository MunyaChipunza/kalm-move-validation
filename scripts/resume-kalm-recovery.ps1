param()
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$statePath = Join-Path $repo "reports\autonomous-execution-state.json"
if (-not (Test-Path -LiteralPath $statePath)) { throw "Missing execution state: $statePath" }
$state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
Write-Host "Project: $($state.project)"
Write-Host "Status: $($state.status)"
Write-Host "Phase: $($state.currentPhase)"
Write-Host "Branch: $($state.workingBranch)"
git -C $repo status --short
Write-Host "Resume from first incomplete action in reports/autonomous-execution-log.md"
