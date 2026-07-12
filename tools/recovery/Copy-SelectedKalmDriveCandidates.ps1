[CmdletBinding()]
param(
    [string] $RepoRoot = 'C:\CodexWork\kalm-recovery'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Sha256 {
    param([string] $Path)
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    try { return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '') }
    finally { $stream.Dispose(); $algorithm.Dispose() }
}

$selections = @(
    [pscustomobject]@{
        DriveSourcePath = 'G:\My Drive\kalm_collective_ks_active_relaunch_pack\kalm_move_validation_sprint_pack\kalm_move_simulation_baseline\site\assets\images\generated\brand-heroes\kalm-move-brand-hero-lifestyle-v1.webp'
        DestinationRelativePath = 'assets\images\recovered\brands-v1\kalm-move-brand-hero-lifestyle-v1.webp'
        ExpectedSha256 = '6B723801B84821D933CDDEA5CCDA4186BCF303D01FC9FD9BD9E3BC0D10426CE1'
        ReasonSelected = 'Adult man and woman wearing KALM Move attire in a natural walking setting; satisfies the pending Brands-page lifestyle requirement.'
        PreviewUse = 'KALM Move Brands-page lifestyle panel'
        ApprovalState = 'preview_candidate_pending_munya_visual_approval'
    },
    [pscustomobject]@{
        DriveSourcePath = 'G:\My Drive\kalm_collective_ks_active_relaunch_pack\kalm_move_validation_sprint_pack\kalm_move_simulation_baseline\site\assets\images\generated\brand-heroes\kalm-outdoor-brand-hero-lifestyle-v1.webp'
        DestinationRelativePath = 'assets\images\recovered\brands-v1\kalm-outdoor-brand-hero-lifestyle-v1.webp'
        ExpectedSha256 = '9FE5532ABA7B44328376F85C07C88D308635709ED3930747E4AB6975D2639EE8'
        ReasonSelected = 'Adults cooking and gathering around KALM Outdoor equipment; satisfies the pending Brands-page outdoor lifestyle requirement.'
        PreviewUse = 'KALM Outdoor Brands-page lifestyle panel'
        ApprovalState = 'preview_candidate_pending_munya_visual_approval'
    }
)

$copiedAt = (Get-Date).ToUniversalTime().ToString('o')
$records = foreach ($selection in $selections) {
    if (-not (Test-Path -LiteralPath $selection.DriveSourcePath)) { throw "Drive source is unavailable: $($selection.DriveSourcePath)" }
    $sourceHash = Get-Sha256 -Path $selection.DriveSourcePath
    if ($sourceHash -ne $selection.ExpectedSha256) { throw "Unexpected source hash for $($selection.DriveSourcePath)" }
    $destination = Join-Path $RepoRoot $selection.DestinationRelativePath
    New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $selection.DriveSourcePath -Destination $destination -Force
    $destinationHash = Get-Sha256 -Path $destination
    if ($destinationHash -ne $sourceHash) { throw "Hash mismatch after copying $($selection.DriveSourcePath)" }
    [pscustomobject][ordered]@{
        DriveSourcePath = $selection.DriveSourcePath
        SourceSha256 = $sourceHash
        LocalDestination = $selection.DestinationRelativePath.Replace('\', '/')
        LocalSha256 = $destinationHash
        CopiedAtUtc = $copiedAt
        ReasonSelected = $selection.ReasonSelected
        PreviewUse = $selection.PreviewUse
        ApprovalState = $selection.ApprovalState
    }
}

$reportPath = Join-Path $RepoRoot 'reports\drive-recovery\selected-recovery-files.json'
$records | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $reportPath -Encoding UTF8
Write-Host ("Copied and hash-verified {0} selected Drive candidates. Record: {1}" -f $records.Count, $reportPath)
