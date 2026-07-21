# Owner actions

No owner authentication prompt is active right now.

Blocked configuration that still needs an owner/business decision before Codex can complete the final upload/deploy path:

1. Canonical intranet Git repository is not discoverable. Both local intranet worktrees have no `origin`; GitHub account discovery currently exposes only `MunyaChipunza/kalm-move-validation`, which is the storefront repository and must not be guessed as the intranet remote.
2. Netlify intranet site `kalm-collective-intranet` is accessible, but current metadata shows CLI/manual deploy origin, empty `build_settings`, and no Git-connected repository. This prevents the mandated Git push → Netlify branch deploy workflow.
3. `MUNYA_OPS_RUNNER_TOKEN` local operator copy has been stored in Windows Credential Manager. The server copy still needs to be set securely in Netlify Functions scope without putting the token into command-line arguments or logs.

Codex must not ask for passwords, OTPs, tokens, cookies, or recovery codes. If UI owner consent becomes necessary, Codex should open the exact page and request only that single approval.
