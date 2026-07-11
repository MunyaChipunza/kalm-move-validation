[CmdletBinding()]
param(
  [string]$Root = ''
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) {
  $Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}
$reportPath = Join-Path $Root 'reports\zero-paid-image-assertion.json'
$prohibitedPattern = '(?i)(api\.openai\.com|images\.openai\.com|replicate\.com|api\.stability\.ai|fal\.ai|runpod\.io|openai\.images|images\.generate|replicate\.run|stability[_-]?api)'
$pipelineRoot = Join-Path $Root 'tools\local-image-pipeline'
$pipelineFiles = Get-ChildItem -LiteralPath $pipelineRoot -Recurse -File -Exclude '*.pyc' |
  Where-Object { $_.FullName -notmatch '\\.venv\\' -and $_.Name -ne 'assert-zero-paid-image.ps1' }
$pipelineMatches = @()
foreach ($file in $pipelineFiles) {
  $matches = Select-String -LiteralPath $file.FullName -Pattern $prohibitedPattern -AllMatches -ErrorAction SilentlyContinue
  foreach ($match in $matches) {
    $pipelineMatches += [ordered]@{ path = $file.FullName.Substring($Root.Length + 1); line = $match.LineNumber; match = $match.Matches[0].Value }
  }
}

$currentLogs = @()
$logRoots = @(
  (Join-Path $Root 'reports\zero-paid-image-execution-log.md'),
  (Join-Path $Root 'reports\zero-paid-image-assertion.json')
) | Where-Object { Test-Path -LiteralPath $_ }
foreach ($log in $logRoots) {
  $matches = Select-String -LiteralPath $log -Pattern $prohibitedPattern -AllMatches -ErrorAction SilentlyContinue
  foreach ($match in $matches) {
    $currentLogs += [ordered]@{ path = $log.Substring($Root.Length + 1); line = $match.LineNumber; match = $match.Matches[0].Value }
  }
}

$legacyRoot = Join-Path $Root 'tools\kalm-image-api'
$legacyReferences = 0
if (Test-Path -LiteralPath $legacyRoot) {
  $legacyReferences = @(Get-ChildItem -LiteralPath $legacyRoot -Recurse -File | ForEach-Object {
    (Select-String -LiteralPath $_.FullName -Pattern $prohibitedPattern -AllMatches -ErrorAction SilentlyContinue).Count
  } | Measure-Object -Sum).Sum
  if ($null -eq $legacyReferences) { $legacyReferences = 0 }
}

$result = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  status = if ($pipelineMatches.Count -eq 0 -and $currentLogs.Count -eq 0) { 'passed' } else { 'failed' }
  paidImageUsage = 0
  prohibitedPipelineReferences = $pipelineMatches
  paidRequestEvidenceInCurrentRun = $currentLogs
  legacyQuarantinedReferenceCount = $legacyReferences
  legacyQuarantineNote = 'Historical tools/kalm-image-api files are read-only legacy evidence and are not part of this local pipeline. Their presence is reported, not executed or approved.'
  checkedPaths = @('tools/local-image-pipeline', 'reports/zero-paid-image-execution-log.md', 'reports/zero-paid-image-assertion.json')
}
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $reportPath -Encoding utf8
if ($result.status -ne 'passed') {
  throw 'Zero-paid-image assertion failed: prohibited paid-image references were found in the active pipeline or current-run logs.'
}
Write-Output "Zero-paid image assertion passed. Legacy quarantined references: $legacyReferences."
