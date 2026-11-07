# Authenticated host evidence

Select one route that is actually authorized: `mesh-uia`, `mesh-browser`, or an already-authorized loopback `--cdp-url`. No automatic fallback, debugging/profile changes, hidden MCP client, credentials, connection creation or permission bypass is implemented. A denied Mesh tool is authoritative; record denial and stop that scope. Locked/unavailable access is blocked, not authentication. Continue useful local checks and resume only when the prerequisite changes.

## Mesh handoff: one observation pass, one finalization

```powershell
npm run verify -- --host-route mesh-uia --out ".\evidence\verification-01"
```

Use `mesh-browser` instead if that authorized tool owns the signed-in browser. The runner emits `host-request.json` plus a non-passing receipt template and continues local checks. The request binds a random challenge to the app origin, environment, verification run and all current source/dependency/kit/configuration/acceptance inputs. It expires after 15 minutes. A consumed, expired or changed-input request cannot authorize reuse of an old host pass.

Open the EXACT requested URL with the selected Mesh tools. Observe the Power Apps parent URL and its expected app frame. `PowerAppsHostStatus` displays the request's `proofText` only inside a frame after the SDK verifies environment, signed-in user and host session. The text contains only environment/origin/challenge, never user/session identifiers. Standalone preview plus a nonce is not authentication.

For UI Automation, observe the browser address and the proof text inside the app; the nonce-bearing app URL, visible origin/environment and SDK proof bind the expected frame. For the Mesh browser, inspect the matching parent/frame and the same proof through that tool. Never claim access just because a transport exists. Use Mesh window-control/release conventions when controlling a visible window, preserve existing drafts, and do not capture unrelated browser/profile data.

If the request has an `edit`, use only that named synthetic record and plain text field. Retain the original value privately, fill the unique requested value, save, reload the Power Apps parent, reopen the same record and observe it. Then restore the original value, save, reload and verify restoration. Stop on concurrent changes or a dirty draft rather than discarding/overwriting the owner's work. Restoration reverses the field value, not the revision counter or audit history. These bindings are inappropriate for production-side-effecting records.

Save sanitized observations under this run folder (for example `host.txt`, `reload.txt`, `restore.txt`), using only actual Mesh tool results. Do not save raw session/identity details. Fill the emitted template as `mesh-receipt.json`; unfilled templates cannot pass. The top-level `parentUrl`, `frameUrl`, `proofText`, timestamps and outcome must describe what was observed, not merely copy expected values. Each observation names its real Mesh tool, phase, timestamp and a distinct nonempty evidence path relative to the run folder. UIA evidence tools are `mesh-find_element`, `mesh-screenshot_window` or `mesh-crop_screenshot`; browser observations use `mesh-browser`.

For a saved edit, `edit` can supply observed synthetic `beforeValue`, `afterReloadValue` and `restoredValue`; the verifier computes hashes and checks the requested changed value plus restoration. Alternatively supply only `beforeSha256`, `reloadedSha256`, `restoredSha256` (SHA-256 of exact UTF-8 field strings). Never mix formats. Raw synthetic values stay only in the local receipt; normalized reports retain no field contents. Missing/different values fail, not pass.

For blocked/denied access, use outcome `blocked` or `denied`, a fresh timestamp and concise reason; do not fabricate positive observations. A denial is retained across this run and cannot be bypassed by selecting another route. No tool permission is granted by a request/template.

```powershell
npm run finalize -- --resume ".\evidence\verification-01" --host-receipt ".\evidence\verification-01\mesh-receipt.json" --events "<authorized-events>" --phases ".\evidence\phases.json" --usd-per-credit 0.01
```

Finalization validates the receipt in the SAME workflow, checks the live app server and current inputs, consumes the challenge once, reuses only intact local evidence and reports accounting together. External evidence is labeled **agent-observed Mesh output**, not independently re-executed by Node. Hashes protect scope/integrity; they cannot prove that an observer told the truth. The agent remains responsible for truthful observations and permissions. Synthetic test drivers cannot yield a real authentication claim.

## App-owned edit binding

Provide `tests\local-play.json` in an integrated definition, or add it explicitly to an existing app:

```json
{
  "schemaVersion": 1,
  "dataScope": "synthetic-demo",
  "collection": "Items",
  "recordLabel": "Verification fixture",
  "field": "Notes",
  "valueTemplate": "Local Play verification {verificationId}",
  "restore": true
}
```

The live edit driver requires the stock 2.5 form dirty/saving hooks and refuses missing or unknown state; it does not assume an incompatible custom/legacy editor is clean. The field must be an ordinary text/textarea field, not the record label, a secret, or a side-effecting operation. Presence of this file retains saved-edit scope across resumes. `--host-edit` requires it explicitly; without it a host-only check must not be reported as saved-edit verification. App authors supply a real valid synthetic fixture; the toolkit never guesses one from field names.

## Existing authorized CDP

`--cdp-url http://localhost:<port>` explicitly selects CDP and uses the same workflow/bindings. The driver requires exactly one matching Power Apps parent and loopback app frame, waits boundedly for the SDK state and performs the bound reversible edit when requested. It connects only to the approved existing browser; it never enables debugging, launches a profile, navigates an unrelated tab or kills a process. Original `verify-local-play.mjs` remains an authentication-only compatibility command.
