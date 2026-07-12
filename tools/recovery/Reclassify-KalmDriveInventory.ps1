[CmdletBinding()]
param(
    [string] $InventoryPath = 'C:\CodexWork\kalm-recovery\reports\drive-recovery\drive-asset-inventory.json'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-AssetRelativeText {
    param([string] $Text)
    $marker = '\assets\'
    $index = $Text.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase)
    if ($index -ge 0) { return $Text.Substring($index) }
    return $Text
}

function Get-BrandClassification {
    param([string] $Text)
    $value = (Get-AssetRelativeText -Text $Text).ToLowerInvariant()
    if ($value -match 'ks[-_ ]?active') { return 'KS Active' }
    if ($value -match 'kalm[-_ ]?move|movement|activewear') { return 'KALM Move' }
    if ($value -match 'kalm[-_ ]?outdoor|outdoor|braai|patio|garden|ember|forge|ridge') { return 'KALM Outdoor' }
    if ($value -match 'kalm[-_ ]?wellness|wellness|recovery') { return 'KALM Wellness' }
    if ($value -match 'kalm[-_ ]?home|home|bath|bed') { return 'KALM Home' }
    return 'Unclassified'
}

function Get-ProductClassification {
    param([string] $Text)
    $value = (Get-AssetRelativeText -Text $Text).ToLowerInvariant()
    $patterns = @(
        @{ Match = 'studio[-_ ]?bottle'; Name = 'Studio Bottle' }, @{ Match = 'everyday[-_ ]?bottle'; Name = 'Everyday Bottle' },
        @{ Match = 'slim[-_ ]?wellness[-_ ]?bottle'; Name = 'Slim Wellness Bottle' }, @{ Match = 'flow[-_ ]?training[-_ ]?short'; Name = 'Flow Training Short' },
        @{ Match = 'sprint[-_ ]?running[-_ ]?short'; Name = 'Sprint Running Short' }, @{ Match = 'core[-_ ]?performance[-_ ]?tee'; Name = 'Core Performance Tee' },
        @{ Match = 'lift[-_ ]?tank'; Name = 'Lift Tank' }, @{ Match = 'pace[-_ ]?jogger'; Name = 'Pace Jogger' },
        @{ Match = 'motion[-_ ]?hoodie'; Name = 'Motion Hoodie' }, @{ Match = 'base[-_ ]?compression[-_ ]?short'; Name = 'Base Compression Short' },
        @{ Match = 'move[-_ ]?cap'; Name = 'Move Cap' }, @{ Match = 'training[-_ ]?sock'; Name = 'Training Sock 3-Pack' },
        @{ Match = 'utility[-_ ]?gym[-_ ]?bag'; Name = 'Utility Gym Bag' }, @{ Match = 'protein[-_ ]?shaker'; Name = 'Protein Shaker Bottle' },
        @{ Match = 'form[-_ ]?short[-_ ]?set'; Name = 'Form Short Set' }, @{ Match = 'open[-_ ]?back[-_ ]?short[-_ ]?romper'; Name = 'Open Back Short Romper' },
        @{ Match = 'ease[-_ ]?flare[-_ ]?set'; Name = 'Ease Flare Set' }, @{ Match = 'align[-_ ]?halter[-_ ]?legging[-_ ]?set'; Name = 'Align Halter Legging Set' },
        @{ Match = 'ember'; Name = 'Ember Outdoor range' }, @{ Match = 'forge'; Name = 'Forge Outdoor range' }, @{ Match = 'ridge'; Name = 'Ridge Outdoor range' }
    )
    foreach ($pattern in $patterns) { if ($value -match $pattern.Match) { return $pattern.Name } }
    if ($value -match 'women') { return 'KALM Move Women - unclassified product' }
    if ($value -match 'men') { return 'KALM Move Men - unclassified product' }
    return 'Unclassified'
}

function Get-LikelyUse {
    param([string] $Path, [string] $Extension)
    $value = (Get-AssetRelativeText -Text $Path).ToLowerInvariant()
    if ($Extension -in @('.md', '.json', '.csv', '.txt')) { return 'report-or-manifest evidence' }
    if ($value -match 'contact[-_ ]?sheet') { return 'visual candidate review contact sheet' }
    if ($value -match 'brand[-_ ]?tiles|brand[-_ ]?lifestyle|brands[-_ ]?page|[-_ ]tile') { return 'Brands page lifestyle or tile candidate' }
    if ($value -match 'lifestyle|campaign|movement|walking|hosting|cooking|braai|patio|garden|scene') { return 'lifestyle or campaign candidate' }
    if ($value -match 'products|women|men|bottle|ember|forge|ridge') { return 'catalogue or product imagery candidate' }
    return 'needs visual classification'
}

$records = @((Get-Content -LiteralPath $InventoryPath -Raw | ConvertFrom-Json))
foreach ($record in $records) {
    $record.BrandClassification = Get-BrandClassification -Text $record.FullDrivePath
    $record.ProductClassification = Get-ProductClassification -Text $record.FullDrivePath
    $record.LikelyUse = Get-LikelyUse -Path $record.FullDrivePath -Extension $record.Extension
}

$reportRoot = Split-Path $InventoryPath -Parent
$csvPath = Join-Path $reportRoot 'drive-asset-inventory.csv'
$markdownPath = Join-Path $reportRoot 'drive-asset-inventory.md'
$records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $InventoryPath -Encoding UTF8
$records | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8
$brandRows = $records | Group-Object BrandClassification | Sort-Object Name | ForEach-Object { "| $($_.Name) | $($_.Count) |" }
$workspaceRows = $records | Group-Object SourceWorkspace | Sort-Object Name | ForEach-Object { "| $($_.Name) | $($_.Count) |" }
$hashCount = @($records | Where-Object Sha256).Count
$hashErrors = @($records | Where-Object HashError).Count
@(
    '# KALM Drive recovery asset inventory',
    '',
    "Reclassified: $(Get-Date -Format o)",
    '',
    '- Classification source: asset-relative path. Workspace names are excluded from brand/product classification.',
    "- Files inventoried: $($records.Count)",
    "- SHA-256 hashes recorded: $hashCount",
    "- Explicit hash read errors: $hashErrors",
    '',
    '## Source workspaces',
    '',
    '| Workspace | Files |',
    '| --- | ---: |'
) + $workspaceRows + @(
    '',
    '## Brand classification',
    '',
    '| Brand | Files |',
    '| --- | ---: |'
) + $brandRows | Set-Content -LiteralPath $markdownPath -Encoding UTF8

Write-Host ("Reclassified {0} inventory records from their asset-relative paths." -f $records.Count)
