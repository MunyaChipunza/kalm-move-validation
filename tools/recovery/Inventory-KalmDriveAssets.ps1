[CmdletBinding()]
param(
    [string] $RepoRoot = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent),
    [string] $DriveRoot = 'G:\',
    [switch] $SkipWholeDriveTargetSearch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ReportRoot = Join-Path $RepoRoot 'reports\drive-recovery'
$CandidateRoot = Join-Path $ReportRoot 'candidates'
$ContactSheetRoot = Join-Path $ReportRoot 'contact-sheets'
$ManifestRoot = Join-Path $ReportRoot 'manifests'
@($ReportRoot, $CandidateRoot, $ContactSheetRoot, $ManifestRoot) | ForEach-Object {
    New-Item -ItemType Directory -Path $_ -Force | Out-Null
}

if (-not (Test-Path -LiteralPath $DriveRoot)) {
    throw "Mounted Drive root is unavailable: $DriveRoot"
}

$KnownLocations = @(
    [pscustomobject]@{ Label = 'kalm-variant-fix-recovery'; Path = 'G:\My Drive\kalm-variant-fix-recovery' },
    [pscustomobject]@{ Label = 'kalm-variant-fix-work'; Path = 'G:\My Drive\kalm-variant-fix-work' },
    [pscustomobject]@{ Label = 'kalm-variant-fix-work.clean'; Path = 'G:\My Drive\kalm-variant-fix-work.clean' },
    [pscustomobject]@{ Label = 'kalm-variant-fix-work.partial'; Path = 'G:\My Drive\kalm-variant-fix-work.partial' },
    [pscustomobject]@{ Label = 'KALM Backups'; Path = 'G:\My Drive\KALM Backups' },
    [pscustomobject]@{ Label = 'KALM Holdings'; Path = 'G:\My Drive\Master Folder\08 Business Documents\KALM Holdings' },
    [pscustomobject]@{ Label = 'KS active'; Path = 'G:\My Drive\Master Folder\08 Business Documents\KS active' }
)

$TargetTerms = @(
    'brand-tiles', 'brands-page', 'brand-lifestyle', 'kalm-move-tile', 'kalm-outdoor-tile',
    'kalm-home-tile', 'kalm-wellness-tile', 'ks-active-tile', 'men-embedded-logo-v3',
    'MEN_EMBEDDED_LOGO_V3_MANIFEST.md', 'MEN_IMAGE_STAGING_MANIFEST.md',
    'KALM_MOVE_IMAGE_REBUILD_AUDIT.md', 'PRODUCT_IMAGE_QA_AUDIT.md',
    'MODEL_DIVERSITY_AUDIT.md', 'OUTDOOR_IMAGE_ASSET_INDEX.md', 'IMAGE_ASSET_INDEX.md',
    'BRAND_ASSET_MAP.md', 'contact-sheet', 'lifestyle', 'campaign', 'movement', 'walking',
    'outdoor', 'hosting', 'cooking', 'braai', 'patio', 'garden'
)

$ImageExtensions = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.svg', '.avif', '.heic') | ForEach-Object { [void]$ImageExtensions.Add($_) }

$MimeByExtension = @{
    '.avif' = 'image/avif'; '.bmp' = 'image/bmp'; '.gif' = 'image/gif'; '.heic' = 'image/heic'
    '.jpeg' = 'image/jpeg'; '.jpg' = 'image/jpeg'; '.png' = 'image/png'; '.svg' = 'image/svg+xml'
    '.tif' = 'image/tiff'; '.tiff' = 'image/tiff'; '.webp' = 'image/webp'; '.json' = 'application/json'
    '.csv' = 'text/csv'; '.md' = 'text/markdown'; '.pdf' = 'application/pdf'; '.txt' = 'text/plain'
}

function Get-SourceWorkspace {
    param([string] $Path)
    foreach ($location in $KnownLocations) {
        if ($Path.StartsWith($location.Path, [System.StringComparison]::OrdinalIgnoreCase)) { return $location.Label }
    }
    return 'mounted-drive-targeted-search'
}

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
        @{ Match = 'studio[-_ ]?bottle'; Name = 'Studio Bottle' },
        @{ Match = 'everyday[-_ ]?bottle'; Name = 'Everyday Bottle' },
        @{ Match = 'slim[-_ ]?wellness[-_ ]?bottle'; Name = 'Slim Wellness Bottle' },
        @{ Match = 'flow[-_ ]?training[-_ ]?short'; Name = 'Flow Training Short' },
        @{ Match = 'sprint[-_ ]?running[-_ ]?short'; Name = 'Sprint Running Short' },
        @{ Match = 'core[-_ ]?performance[-_ ]?tee'; Name = 'Core Performance Tee' },
        @{ Match = 'lift[-_ ]?tank'; Name = 'Lift Tank' },
        @{ Match = 'pace[-_ ]?jogger'; Name = 'Pace Jogger' },
        @{ Match = 'motion[-_ ]?hoodie'; Name = 'Motion Hoodie' },
        @{ Match = 'base[-_ ]?compression[-_ ]?short'; Name = 'Base Compression Short' },
        @{ Match = 'move[-_ ]?cap'; Name = 'Move Cap' },
        @{ Match = 'training[-_ ]?sock'; Name = 'Training Sock 3-Pack' },
        @{ Match = 'utility[-_ ]?gym[-_ ]?bag'; Name = 'Utility Gym Bag' },
        @{ Match = 'protein[-_ ]?shaker'; Name = 'Protein Shaker Bottle' },
        @{ Match = 'form[-_ ]?short[-_ ]?set'; Name = 'Form Short Set' },
        @{ Match = 'open[-_ ]?back[-_ ]?short[-_ ]?romper'; Name = 'Open Back Short Romper' },
        @{ Match = 'ease[-_ ]?flare[-_ ]?set'; Name = 'Ease Flare Set' },
        @{ Match = 'align[-_ ]?halter[-_ ]?legging[-_ ]?set'; Name = 'Align Halter Legging Set' },
        @{ Match = 'ember'; Name = 'Ember Outdoor range' },
        @{ Match = 'forge'; Name = 'Forge Outdoor range' },
        @{ Match = 'ridge'; Name = 'Ridge Outdoor range' }
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

function Get-SvgDimensions {
    param([string] $Path)
    try {
        $head = [System.IO.File]::ReadAllText($Path)
        $viewBox = [regex]::Match($head, 'viewBox\s*=\s*["'']\s*[^\d-]*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)')
        if ($viewBox.Success) { return [pscustomobject]@{ Width = [int][double]$viewBox.Groups[3].Value; Height = [int][double]$viewBox.Groups[4].Value; Format = 'SVG' } }
        $width = [regex]::Match($head, 'width\s*=\s*["'']([\d.]+)')
        $height = [regex]::Match($head, 'height\s*=\s*["'']([\d.]+)')
        if ($width.Success -and $height.Success) { return [pscustomobject]@{ Width = [int][double]$width.Groups[1].Value; Height = [int][double]$height.Groups[1].Value; Format = 'SVG' } }
    } catch { }
    return $null
}

function Get-PillowMetadata {
    param([System.IO.FileInfo[]] $Files)
    $result = @{}
    $python = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($null -eq $python -or $Files.Count -eq 0) { return $result }
    $listPath = Join-Path $env:TEMP ("kalm-drive-images-{0}.txt" -f [guid]::NewGuid().ToString('N'))
    $helperPath = Join-Path $env:TEMP ("kalm-drive-pillow-{0}.py" -f [guid]::NewGuid().ToString('N'))
    $progressPath = Join-Path $env:TEMP ("kalm-drive-pillow-progress-{0}.json" -f [guid]::NewGuid().ToString('N'))
    try {
        $Files.FullName | Set-Content -LiteralPath $listPath -Encoding UTF8
        $pythonCode = @'
import json, sys
from pathlib import Path
from PIL import Image
progress = Path(sys.argv[2])
for index, raw in enumerate(open(sys.argv[1], encoding="utf-8-sig"), start=1):
    path = raw.rstrip("\n")
    if not path:
        continue
    progress.write_text(json.dumps({"index": index, "path": path}, ensure_ascii=True), encoding="utf-8")
    try:
        with Image.open(path) as image:
            print(json.dumps({"path": path, "width": image.width, "height": image.height, "format": image.format}, ensure_ascii=True))
    except Exception as error:
        print(json.dumps({"path": path, "error": str(error)}, ensure_ascii=True))
'@
        Set-Content -LiteralPath $helperPath -Value $pythonCode -Encoding UTF8
        foreach ($line in (& $python.Source $helperPath $listPath $progressPath)) {
            try {
                $item = $line | ConvertFrom-Json
                $result[$item.path] = $item
            } catch { }
        }
    } finally {
        Remove-Item -LiteralPath $listPath -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $helperPath -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $progressPath -Force -ErrorAction SilentlyContinue
    }
    return $result
}

function Get-ImageMetadata {
    param([System.IO.FileInfo] $File, [hashtable] $PillowMetadata)
    $extension = $File.Extension.ToLowerInvariant()
    if (-not $ImageExtensions.Contains($extension)) { return $null }
    if ($extension -eq '.svg') { return Get-SvgDimensions -Path $File.FullName }
    if ($PillowMetadata.ContainsKey($File.FullName)) {
        $item = $PillowMetadata[$File.FullName]
        if ($null -ne $item.width -and $null -ne $item.height) {
            return [pscustomobject]@{ Width = [int]$item.width; Height = [int]$item.height; Format = $item.format }
        }
    }
    try {
        Add-Type -AssemblyName System.Drawing -ErrorAction SilentlyContinue
        $image = [System.Drawing.Image]::FromFile($File.FullName)
        try { return [pscustomobject]@{ Width = $image.Width; Height = $image.Height; Format = $image.RawFormat.ToString() } }
        finally { $image.Dispose() }
    } catch { return $null }
}

function Add-FileIfNew {
    param([System.IO.FileInfo] $File, [System.Collections.Generic.HashSet[string]] $Seen, [System.Collections.Generic.List[System.IO.FileInfo]] $Destination)
    if ($Seen.Add($File.FullName)) { [void]$Destination.Add($File) }
}

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

Write-Host 'Building current repository hash and evidence indexes...'
$repoHashPaths = @{}
$productsJsonPath = Join-Path $RepoRoot 'products.json'
$productsText = if (Test-Path -LiteralPath $productsJsonPath) { [System.IO.File]::ReadAllText($productsJsonPath) } else { '' }
$productReferences = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($match in [regex]::Matches($productsText, 'assets/[A-Za-z0-9_./-]+')) { [void]$productReferences.Add($match.Value.Replace('/', '\')) }

$reportManifestNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$reportEvidenceNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$repoFiles = Get-ChildItem -LiteralPath $RepoRoot -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\.git\\|\\node_modules\\|\\.netlify\\' }
foreach ($repoFile in $repoFiles) {
    try {
        $hash = Get-Sha256 -Path $repoFile.FullName
        if (-not $repoHashPaths.ContainsKey($hash)) { $repoHashPaths[$hash] = [System.Collections.Generic.List[string]]::new() }
        [void]$repoHashPaths[$hash].Add($repoFile.FullName.Substring($RepoRoot.Length).TrimStart('\'))
    } catch { }
    if ($repoFile.Extension -in @('.md', '.json', '.csv', '.txt')) {
        [void]$reportManifestNames.Add($repoFile.Name)
        [void]$reportEvidenceNames.Add($repoFile.Name)
        if ($repoFile.Length -le 5MB) {
            try {
                $reportContent = [System.IO.File]::ReadAllText($repoFile.FullName)
                foreach ($token in [regex]::Matches($reportContent, '[A-Za-z0-9][A-Za-z0-9._-]{1,255}')) {
                    [void]$reportEvidenceNames.Add($token.Value)
                }
            } catch { }
        }
    }
}

$historyNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($line in (& git.exe -C $RepoRoot rev-list --all --objects)) {
    $parts = $line -split ' ', 2
    if ($parts.Count -eq 2) { [void]$historyNames.Add([System.IO.Path]::GetFileName($parts[1])) }
}

Write-Host 'Enumerating known Drive recovery locations...'
$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$driveFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($location in $KnownLocations) {
    if (-not (Test-Path -LiteralPath $location.Path)) {
        Write-Warning "Known Drive recovery location unavailable: $($location.Path)"
        continue
    }
    Get-ChildItem -LiteralPath $location.Path -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Add-FileIfNew -File $_ -Seen $seen -Destination $driveFiles
    }
}

if (-not $SkipWholeDriveTargetSearch) {
    Write-Host 'Searching the entire mounted Drive for the required names and concepts...'
    $escapedTerms = $TargetTerms | ForEach-Object { [regex]::Escape($_) }
    $targetPattern = '(?i)' + ($escapedTerms -join '|')
    Get-ChildItem -LiteralPath $DriveRoot -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match $targetPattern } | ForEach-Object {
        Add-FileIfNew -File $_ -Seen $seen -Destination $driveFiles
    }
}

Write-Host ("Collecting image dimensions with Pillow where available for {0} files..." -f $driveFiles.Count)
$imageFiles = @($driveFiles | Where-Object { $ImageExtensions.Contains($_.Extension) })
$pillowMetadata = Get-PillowMetadata -Files $imageFiles

Write-Host 'Hashing and classifying Drive inventory files...'
$records = foreach ($file in ($driveFiles | Sort-Object FullName)) {
    $extension = $file.Extension.ToLowerInvariant()
    $hash = $null
    $hashError = $null
    try { $hash = Get-Sha256 -Path $file.FullName } catch { $hashError = $_.Exception.Message }
    $imageInfo = Get-ImageMetadata -File $file -PillowMetadata $pillowMetadata
    $repoMatches = if ($hash -and $repoHashPaths.ContainsKey($hash)) { @($repoHashPaths[$hash].ToArray()) } else { @() }
    $repoMatchCount = @($repoMatches).Count
    $referencedByProducts = @($repoMatches | Where-Object { $productReferences.Contains($_.Replace('/', '\')) }).Count -gt 0
    $pathText = $file.FullName.ToLowerInvariant()
    $appearsInReports = $pathText -match '\\reports\\|manifest|audit|index' -or $reportManifestNames.Contains($file.Name) -or $reportEvidenceNames.Contains($file.Name)
    $isImage = $ImageExtensions.Contains($extension)
    $sourceWorkspace = 'mounted-drive-targeted-search'
    foreach ($knownLocation in @($KnownLocations)) {
        if ($file.FullName.StartsWith($knownLocation.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
            $sourceWorkspace = [string]$knownLocation.Label
            break
        }
    }
    [pscustomobject][ordered]@{
        FullDrivePath = $file.FullName
        FileName = $file.Name
        Extension = $extension
        SizeBytes = $file.Length
        CreatedTime = $file.CreationTimeUtc.ToString('o')
        ModifiedTime = $file.LastWriteTimeUtc.ToString('o')
        Sha256 = $hash
        HashError = $hashError
        Width = if ($imageInfo) { $imageInfo.Width } else { $null }
        Height = if ($imageInfo) { $imageInfo.Height } else { $null }
        DetectedFormat = if ($imageInfo) { $imageInfo.Format } elseif ($MimeByExtension.ContainsKey($extension)) { $MimeByExtension[$extension] } else { 'application/octet-stream' }
        MimeType = if ($MimeByExtension.ContainsKey($extension)) { $MimeByExtension[$extension] } else { 'application/octet-stream' }
        ParentFolders = $file.DirectoryName
        BrandClassification = Get-BrandClassification -Text $file.FullName
        ProductClassification = Get-ProductClassification -Text $file.FullName
        LikelyUse = Get-LikelyUse -Path $file.FullName -Extension $extension
        SourceWorkspace = $sourceWorkspace
        SameHashExistsInCurrentRepository = $repoMatchCount -gt 0
        MatchingRepositoryPaths = $repoMatches
        ReferencedByCurrentProductsJson = $referencedByProducts
        AppearsInGitHistory = $historyNames.Contains($file.Name)
        AppearsInReportOrManifest = $appearsInReports
        RecoveryStatus = if ($file.FullName.StartsWith('G:\My Drive\kalm-variant-fix-recovery', [System.StringComparison]::OrdinalIgnoreCase)) { 'known_recovery_location' } else { 'targeted_drive_inventory' }
        ReviewStatus = if ($isImage) { 'found_pending_review' } elseif ($file.Name -match 'manifest|audit|index') { 'manifest_or_audit_pending_read' } else { 'inventory_only' }
    }
}

$jsonPath = Join-Path $ReportRoot 'drive-asset-inventory.json'
$csvPath = Join-Path $ReportRoot 'drive-asset-inventory.csv'
$markdownPath = Join-Path $ReportRoot 'drive-asset-inventory.md'
$records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
$records | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

$brandSummary = $records | Group-Object BrandClassification | Sort-Object Name | ForEach-Object { "| $($_.Name) | $($_.Count) |" }
$workspaceSummary = $records | Group-Object SourceWorkspace | Sort-Object Name | ForEach-Object { "| $($_.Name) | $($_.Count) |" }
$candidateSummary = $records | Where-Object { $_.LikelyUse -match 'Brands page|lifestyle' } | Select-Object -First 100
$candidateRows = foreach ($candidate in $candidateSummary) {
    $hashPrefix = if ($candidate.Sha256) { $candidate.Sha256.Substring(0, [Math]::Min(12, $candidate.Sha256.Length)) } else { 'unavailable' }
    "| $($candidate.BrandClassification) | $($candidate.FileName.Replace('|', '\|')) | $($candidate.Width)x$($candidate.Height) | $($candidate.SourceWorkspace) | $hashPrefix | $($candidate.ReviewStatus) |"
}
$markdown = @(
    '# KALM Drive recovery asset inventory',
    '',
    "Generated: $(Get-Date -Format o)",
    '',
    "- Drive root: $DriveRoot",
    "- Files inventoried: $($records.Count)",
    "- Images inventoried: $(@($records | Where-Object { $ImageExtensions.Contains($_.Extension) }).Count)",
    "- Repository hash matches: $(@($records | Where-Object SameHashExistsInCurrentRepository).Count)",
    "- Product JSON references by matching hash: $(@($records | Where-Object ReferencedByCurrentProductsJson).Count)",
    '',
    '## Source workspaces',
    '',
    '| Workspace | Files |',
    '| --- | ---: |'
) + $workspaceSummary + @(
    '',
    '## Brand classification',
    '',
    '| Brand | Files |',
    '| --- | ---: |'
) + $brandSummary + @(
    '',
    '## First 100 lifestyle and Brands-page candidates',
    '',
    '| Brand | File | Dimensions | Source workspace | SHA-256 prefix | Review status |',
    '| --- | --- | --- | --- | --- | --- |'
) + $candidateRows
$markdown | Set-Content -LiteralPath $markdownPath -Encoding UTF8

Write-Host ("Inventory complete: {0} files. JSON: {1}" -f $records.Count, $jsonPath)
