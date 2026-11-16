# Implementation audit: repo setup (PR #1), cycle 1

- Pull request: https://github.com/mcthaydt/GraphEngineeringAppExperiment/pull/1
- Commit examined: `7222d58346aa6e3472a40f635cd83053ab3a0efb` (branch `setup`). The audit was first pointed at
  `ebe510c`; the target moved to `7222d58` before the audit was written. Any later push makes this audit stale.
- Lane: 3 (CI workflow file, CLAUDE.md and the skills).
- Judged against: the acceptance criteria in the PR body, the owner's request in the project thread (2026-11-16 16:00
  UTC), CLAUDE.md and the `review` and `release` skills.
- Prompt: Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative
  to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete
  implementations or incomplete integrations. Do your best work.

## Result

5 red, 9 notes. Not ready to merge until the red findings are fixed or, for finding 1, decided by the owner.

## What ran

| Check | How | Result |
|---|---|---|
| Rules files match the owner's text | Owner's four sections saved verbatim, `diff` against each repo file | `review`, `release`, `visual-check`: byte-identical. `CLAUDE.md`: differs only on the placeholder lines (title, purpose, stack, five commands, commit author, owner name, lane 2 paths, lane 3 paths) |
| `ebe510c..7222d58` holds only the claimed change | `git diff --stat ebe510c 7222d58` | 1 file, 1 line: the lane 3 placeholder in `CLAUDE.md`. Claim confirmed |
| `npm ci` | local, Node 22.23.4 | exit 0 |
| `npm run lint` | local | exit 0 |
| `npm run check` | local | exit 0, 0 errors, 0 warnings |
| `npm test` | local | exit 0, 4 of 4 pass |
| `npm run build` | local | exit 0 |
| `npm run test:e2e` | local, with and without `CI=1` | **exit 1**, "Error: No tests found" |
| Architecture test fails by itself | Injected one fault at a time, ran it, reverted | Upward import (relative and `$lib`): red. Two-file cycle: red. File in `src/features/` (unlisted layer): red. Test file with no `src/` twin: red. Mirrored test `tests/index.test.ts`: green |
| `decide checks` logic | The job's shell extracted and run on sample diffs | `.md` docs: code=false. `CLAUDE.md`, `.claude/*`: code=true. Lockfile, workflow: full=true even on a draft. `.svelte`: screens=true. Push or non-draft: full=true |
| CI on `7222d58` | PR check runs | All 12 green: decide checks, lint, typecheck, build, unit, e2e 1 to 6, gate (draft run, full because the workflow and lockfile changed) |
| Commit identity | `git log` on both commits | Author and committer `mcthaydt <107786093+mcthaydt@users.noreply.github.com>`, no trailers |

## Red findings

### 1. The lane 3 plan audit was skipped

UNIT: the setup unit as a whole (process), PR #1.
VERDICT: red
REQUIREMENT: CLAUDE.md Settings, "Audits by lane: ... lane 3 a plan audit and an implementation audit"; The staged
path, "Stage the work when ... it is lane 3"; Risk, lane 3 "Requires its lane's checks and reviews plus the owner's
approval or a recorded standing permission".
REASON: no spec and no plan audit exist for a lane 3 change; the implementer chose to skip it.
EVIDENCE: no `docs/superpowers/specs/` or `...-plan-audit.md` at `7222d58`. The implementer told the owner in the
thread at 16:11 UTC: "I skipped a separate plan audit for the setup ... It's recorded as a deviation. If you'd rather
have one, say so." `grep -rni "deviation\|plan audit"` outside the rules files finds nothing: the deviation is not
recorded in the repo or the PR body. The owner has not answered, and silence never creates an approval (CLAUDE.md,
Owner visibility).
EXPECTED: either a plan audit by a fresh session, or the owner's explicit choice to waive it for this setup unit,
recorded with its scope.
FIX: needs the owner's choice, so ask it as a decision card (options: waive the plan audit for the first setup only,
recorded under Standing permissions in `history.md`; or run a retroactive plan audit on this PR's description as the
plan). Recommendation: waive for this unit only, because the owner supplied the rules text verbatim and the setup steps
are fixed by `release`. Whichever is chosen, record the deviation and the decision in the PR body. Files: PR body;
`docs/superpowers/history.md` (by the coordinator, see finding 4).

### 2. Acceptance criterion 2 is false: `npm run test:e2e` exits 1

UNIT: `package.json` script `test:e2e`; PR body acceptance criterion 2; `docs/superpowers/history.md` Setup.
VERDICT: red
REQUIREMENT: PR acceptance criterion 2, "`npm ci`, `npm run lint`, `npm run check`, `npm test`, `npm run test:e2e`
and `npm run build` all exit 0"; release Setup check, "The commands in Stack and checks (CLAUDE.md) run, and pass".
REASON: there is no Playwright test at this commit, so the documented e2e command fails.
EVIDENCE: `npm run test:e2e` at `7222d58` prints "Error: No tests found" and exits 1, locally and with `CI=1`. CI is
green only because the workflow adds `--pass-with-no-tests` (`.github/workflows/ci.yml`, Browser tests step).
EXPECTED: every command in Stack and checks exits 0 on this commit, or the criterion says honestly that `test:e2e`
passes only once the app PR adds its Playwright test.
FIX: reword criterion 2 in the PR body to state that `npm run test:e2e` exits 1 until PR #2 adds the Playwright test,
and that this PR's CI runs it with `--pass-with-no-tests`; and make the history.md Setup line say the same. Do not
add `--pass-with-no-tests` to the `test:e2e` script, which would hide a lost test. Files: PR body;
`docs/superpowers/history.md` (by the coordinator).

### 3. CI uploads screenshots that are never taken

UNIT: `playwright.config.ts`, `.github/workflows/ci.yml` (e2e job, Screenshots step).
VERDICT: red
REQUIREMENT: release, Fast CI: "Screenshots and playtest video are taken automatically when the diff touches screens
... (the workflow lists those paths), with no label needed."
REASON: the workflow lists screen paths and uploads `test-results/`, but nothing writes a screenshot there on a passing
run.
EVIDENCE: `playwright.config.ts` sets `use: { baseURL, trace: 'off' }` with no `screenshot` option (Playwright default
`off`), and no test calls `page.screenshot` (`grep -rn screenshot playwright.config.ts tests`: no match). The upload
step uses `if-no-files-found: ignore`, so the missing screenshots pass silently.
EXPECTED: when `screens == 'true'`, each browser test run leaves at least one screenshot per device profile in the
uploaded artifact.
FIX: set `screenshot: 'on'` in `playwright.config.ts` `use` (or have the e2e test write named screenshots), and
change the upload step to `if-no-files-found: error` so a run that should have screenshots and has none fails. Files:
`playwright.config.ts`, `.github/workflows/ci.yml` (both already lane 3 in this PR).

### 4. The implementer wrote `progress.md` and `history.md` while the coordinator was active

UNIT: `docs/superpowers/progress.md`, `docs/superpowers/history.md`.
VERDICT: red
REQUIREMENT: project instructions, "The coordinator alone writes docs/superpowers/progress.md and history.md while it is
active"; CLAUDE.md, The staged path, Writing: "The coordinator is the only writer of `progress.md` and `history.md`
while active, including for delegated short-path work."
REASON: both files arrive in the implementer's commit `ebe510c` while the coordinator was running and relaying messages.
EVIDENCE: `git log` shows both files added in `ebe510c` ("Add the rules files, CI gate and project skeleton"); the
implementer's thread checklist reads "Save CLAUDE.md, the three skills and the progress/history records". The
coordinator was active from 16:02 UTC (relayed the repo creation). `progress.md` is already stale at this commit: it
still lists branch protection as a blocker, which the owner has since cleared.
EXPECTED: the coordinator creates and keeps these two files; the implementer reports to it instead.
FIX: the coordinator reviews both files and commits any corrections (including findings 1 and 2 and the cleared
blocker) in its own commit; the implementer makes no further edits to them. Files: `docs/superpowers/progress.md`,
`docs/superpowers/history.md`, coordinator only.

### 5. The PR body does not end with the owner line and carries a Claude Code footer

UNIT: PR #1 description.
VERDICT: red
REQUIREMENT: CLAUDE.md, Rules that never bend, Identity: "No ... 'Generated with Claude Code' line in commits, pull
request bodies or docs. Pull requests end with 'Requested by **The Realest Alive**'."
REASON: the body ends with a "Generated by Claude Code" footer after the owner line.
EVIDENCE: the PR body's last lines are `Requested by **The Realest Alive**`, then `---` and
`_Generated by [Claude Code](https://claude.ai/code/session_01QYLU1gpZccj3bcZHsGJgXs)_`.
EXPECTED: the last line of the body is `Requested by **The Realest Alive**`, with no Claude Code line anywhere.
FIX: edit the PR body to delete the `---` and footer lines, keeping the two attribution lines at the top. Files: PR
body only.

## Notes (recorded, not fixed here)

1. **Draft runs skip the architecture test after a source change.** `unit` uses `vitest run --changed <base>`, which
   follows imports; `tests/architecture.test.ts` reads `src/` with `fs` and imports nothing from it, so a draft that
   adds an upward import stays green until the full run. The full run on ready for review catches it. Consider forcing
   `tests/architecture.test.ts` into the quick run.
2. **Draft runs skip the Playwright test for non-screen code.** A draft touching `src/features/todos/*.ts` gets
   `screens=false`, so e2e does not run even though the Playwright walk-through reaches that code. The release rule asks
   for "only the tests the change reaches"; e2e reaches all app code.
3. **The saved-list format is not treated as "the database".** release says a change to the database makes even a draft
   run everything. The app's only stored data lives in `src/features/todos/library/` (per CLAUDE.md lane 3), but
   `decide checks` does not set `full=true` for that path. Once PR #2 lands, consider adding it.
4. **`--pass-with-no-tests` in CI cannot tell a lost Playwright test from an empty shard.** It is needed because one
   test across 6 shards leaves shards empty. Once PR #2 lands, a check that at least one `.e2e.ts` exists would close
   the gap.
5. **Lane 3 wording "once it has shipped".** Confirmed as the only change in `7222d58`. "Shipped" is undefined; reading
   it as "merged to `main`" makes PR #2's first creation of the format lane 1 and every later change lane 3, which
   matches the commit message. The path `src/features/todos/library/` does not exist yet at this commit.
6. **Standing permission scope.** `history.md` records branch protection as covered by the owner's instruction. The
   owner's message asked for the repo, GitHub Actions CI and the rules files; branch protection comes from the
   `release` setup check, not from the owner's words. The owner ran the command themselves, so this is moot for this
   unit.
7. **Setup check, "pass on `main`".** `main` holds only the README, so the commands cannot pass there yet.
   `history.md` says their status on `main` "is recorded in that pull request", but the PR body does not record it.
   Record it after the merge.
8. **`src/index.ts` has `import './lib';`**, a side-effect import of a module that exports nothing. Harmless, but it
   has no reason given.
9. **Housekeeping.** `.npmrc` sets `engine-strict=true` with no `engines` field in `package.json`, so it does nothing.
   Actions are pinned to major tags (`@v5`, `@v4`), not commit SHAs.

## Deviation noted

The implementer skipped the separate lane 3 plan audit and told the owner in the thread that it was recorded as a
deviation. It is not recorded in any committed file or in the PR body. See red finding 1.
