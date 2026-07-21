# Munya authentication architecture

## Objective

Replace repeated interactive login blockers with a fail-fast authentication preflight and a tightly scoped internal operations runner.

## Installed local commands

- `C:\CodexTools\munya-auth\munya-auth.ps1`
- `C:\CodexTools\munya-auth\munya-auth.cmd`
- `C:\CodexTools\munya-auth\munya-ops.ps1`
- `C:\CodexTools\munya-auth\munya-ops.cmd`
- PATH-backed wrappers in `C:\CodexTools\kalm-release\munya-auth.cmd` and `C:\CodexTools\kalm-release\munya-ops.cmd`

## Preflight rule

`C:\CodexWork\AGENTS.md` and `C:\Users\Dell\.codex\AGENTS.md` now require `munya-auth doctor` before any task involving GitHub, Netlify, Zoho, Google Drive or authenticated Chrome.

## Classification rule

- True owner authentication: password, OTP, biometric confirmation, OAuth consent or account ownership approval.
- Configuration failures: missing Git remote, wrong repo/branch, missing env context, expired CLI session, wrong Netlify project, wrong Chrome profile, masked server secrets requested locally, incorrect Zoho data centre.

Codex fixes configuration failures itself and pauses only for true owner authentication.

## Internal operations runner

Local intranet commit `010cf0d` adds a permanent allowlisted Netlify Function:

- function file: `netlify/functions/internal-ops-jobs.mts`
- route: `/api/internal-ops/jobs`
- required header: bearer token matching `MUNYA_OPS_RUNNER_TOKEN`
- allowed operations only: `STATUS`, `DRY_RUN`, `PILOT`, `VERIFY_PILOT`, `APPLY`, `VERIFY_ALL`
- rejects arbitrary scripts, item IDs, file paths, URLs, SQL and shell commands by not accepting those inputs.

The runner reuses the verified 104-item manifest and protected-field comparison logic from the existing local runtime runner.

## Current blocker

The runner is implemented and builds locally, but cannot be deployed through the mandated Git-connected workflow until the canonical intranet repository is identified or the existing Netlify intranet project is Git-connected to the correct existing repository.

## Secret handling

No passwords, refresh tokens, access tokens, client secrets, Netlify tokens, Google credentials or bearer tokens are printed in reports. The local operator token is stored in Windows Credential Manager under `MUNYA_OPS_RUNNER_TOKEN`; the server copy has not been printed or committed.
