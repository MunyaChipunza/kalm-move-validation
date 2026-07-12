[CmdletBinding()]
param(
    [string] $RepoRoot = 'C:\CodexWork\kalm-recovery',
    [string] $InventoryPath = 'C:\CodexWork\kalm-recovery\reports\drive-recovery\drive-asset-inventory.json'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Sha256 {
    param([string] $Path)
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    try {
        return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '')
    } finally {
        $stream.Dispose()
        $algorithm.Dispose()
    }
}

$records = @((Get-Content -LiteralPath $InventoryPath -Raw | ConvertFrom-Json))
$productsPath = Join-Path $RepoRoot 'products.json'
$productsText = [System.IO.File]::ReadAllText($productsPath)
$productReferences = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($match in [regex]::Matches($productsText, 'assets/[A-Za-z0-9_./-]+')) { [void]$productReferences.Add($match.Value.Replace('/', '\')) }

Write-Host 'Hashing current repository files...'
$repoHashPaths = @{}
Get-ChildItem -LiteralPath $RepoRoot -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\.git\\|\\node_modules\\|\\.netlify\\' } | ForEach-Object {
    try {
        $hash = Get-Sha256 -Path $_.FullName
        if (-not $repoHashPaths.ContainsKey($hash)) { $repoHashPaths[$hash] = [System.Collections.Generic.List[string]]::new() }
        [void]$repoHashPaths[$hash].Add($_.FullName.Substring($RepoRoot.Length).TrimStart('\'))
    } catch { }
}

Write-Host ("Hashing {0} Drive inventory records..." -f $records.Count)
$index = 0
foreach ($record in $records) {
    $index++
    try {
        $hash = Get-Sha256 -Path $record.FullDrivePath
        $record.Sha256 = $hash
        $record.HashError = $null
        $matches = if ($repoHashPaths.ContainsKey($hash)) { @($repoHashPaths[$hash].ToArray()) } else { @() }
        $record.MatchingRepositoryPaths = $matches
        $record.SameHashExistsInCurrentRepository = @($matches).Count -gt 0
        $record.ReferencedByCurrentProductsJson = @($matches | Where-Object { $productReferences.Contains($_.Replace('/', '\')) }).Count -gt 0
    } catch {
        $record.Sha256 = $null
        $record.HashError = $_.Exception.Message
        $record.MatchingRepositoryPaths = @()
        $record.SameHashExistsInCurrentRepository = $false
        $record.ReferencedByCurrentProductsJson = $false
    }
    if ($index % 100 -eq 0) { Write-Host ("Hashed {0} of {1} Drive records" -f $index, $records.Count) }
}

$reportRoot = Split-Path $InventoryPath -Parent
$csvPath = Join-Path $reportRoot 'drive-asset-inventory.csv'
$markdownPath = Join-Path $reportRoot 'drive-asset-inventory.md'
$records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $InventoryPath -Encoding UTF8
$records | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8
$hashCount = @($records | Where-Object Sha256).Count
$hashErrors = @($records | Where-Object HashError).Count
$markdown = @(
    '# KALM Drive recovery asset inventory',
    '',
    "SHA-256 backfill completed: $(Get-Date -Format o)",
    '',
    "- Files inventoried: $($records.Count)",
    "- SHA-256 hashes recorded: $hashCount",
    "- Hash read errors: $hashErrors",
    '- Hash routine: .NET `System.Security.Cryptography.SHA256`, read-only against Drive.'
)
$markdown | Set-Content -LiteralPath $markdownPath -Encoding UTF8
Write-Host ("Hash completion finished: {0} hashes, {1} errors." -f $hashCount, $hashErrors)
