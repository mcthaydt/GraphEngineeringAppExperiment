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

## Fix check, round 1 (commit `b5e77dfd88164e2df05211da976473a63b1241c3`)

Checked by this audit session, not the implementer. Diff `147c49c..b5e77df`: `.github/workflows/ci.yml`,
`playwright.config.ts`, `src/index.ts`, `docs/superpowers/progress.md`, `docs/superpowers/history.md`, plus the PR
body. At `b5e77df`: `npm run lint`, `npm run check`, `npm test` (4 of 4) and `npm run build` exit 0; `npm run test:e2e`
exits 1 ("No tests found"), as the reworded criterion now says. CI on `b5e77df`: all 12 checks green.

| Finding | Verdict | Evidence |
|---|---|---|
| 1. Plan audit skipped | **open**, waits on the owner | Now recorded under "Deviations" in `history.md` and in the PR body, with "Owner decision: pending" and "this PR does not merge until then". The decision itself has not been made. |
| 2. `test:e2e` exits 1 | **pass** | PR criterion 2 now says `test:e2e` exits 1 until #2 adds the Playwright test and why CI uses `--pass-with-no-tests`; `history.md` Setup says the same. Measured: exit 1 at `b5e77df`, matching the text. The script was not loosened. |
| 3. Screenshots never taken | **pass** | `playwright.config.ts` sets `screenshot: 'on'`; the upload takes `test-results/**/*.png` with `if-no-files-found: error`, only for pieces that hold tests. Checked with a temporary `tests/routes/page.e2e.ts` (removed after): the count step gives 1, 1, 1, 0, 0, 0 across the 6 pieces (0 handled without a shell error), and piece 1 wrote `test-results/routes-page.e2e.ts-shows-the-heading-small-phone/test-finished-1.png`. |
| 4. Implementer writes `progress.md` and `history.md` | **still red** | The content corrections are right (e2e status, branch protection, deviation, cleared blocker). But `b5e77df` is again the implementer writing both files, now "as the coordinator's delegate; the coordinator has no checkout". CLAUDE.md makes the coordinator the only writer "including for delegated short-path work", so delegation does not satisfy the rule. New in this round: `progress.md` says "Last updated: 2026-11-16 16:25 UTC", but the commit is dated 16:19:32 UTC. The time was written by hand and is later than the commit, against "Hashes, sizes and timings are measured, never written by hand". |
| 5. PR body footer | **pass** | The PR body's last line is `Requested by **The Realest Alive**`; no Claude Code line remains. |
| Note 8. `import './lib';` | **resolved** | Removed from `src/index.ts`; the architecture test still passes. The line was already present at `7222d58`, so it shipped in the audited commit. |

### Finding 4, round 2

UNIT: `docs/superpowers/progress.md`, `docs/superpowers/history.md`.
VERDICT: red
REQUIREMENT: CLAUDE.md, The staged path, Writing (the coordinator is the only writer while active, including for
delegated work); project instructions (same rule); Report honestly ("timings are measured, never written by hand").
REASON: the writer rule cannot be met as things stand, because the coordinator has no checkout, and the stamp in
`progress.md` was typed by hand.
EVIDENCE: `git log -1 --format=%an b5e77df` gives mcthaydt, from the implementer's session (its commit message says
"as the coordinator's delegate"); the commit date is `2026-11-16T16:19:32+00:00` against the "16:25 UTC" stamp.
EXPECTED: either the coordinator writes these files, or the owner records that the implementer may write them for the
coordinator while it has no checkout, as a deviation with its scope. The last-updated time is taken from the clock when
the file is written.
FIX: needs the owner's choice. Options: (a) record a deviation under "Deviations" in `history.md` letting the implementer
write `progress.md` and `history.md` on the coordinator's instruction while the coordinator has no checkout
(recommended: the CLAUDE.md "Reporting" rule treats a missing tool replaced by an authorized alternative as a
deviation, not a stop); (b) give the coordinator a checkout and let it take the files over. Either way, replace
"16:25 UTC" with the measured time (`date -u`) in the same commit. Files: `docs/superpowers/progress.md`,
`docs/superpowers/history.md`.

### Result after round 1

2 red still open: finding 1 (the owner's choice on the plan audit) and finding 4 (the owner's choice on who writes
the records, plus the hand-written time). Findings 2, 3 and 5 pass at `b5e77df`. PR #1 is not ready to merge.

## Fix check, round 2 (commit `381e8f2609efb973e8a7c62db916511d35c6e180`)

Diff `e800e14..381e8f2`: `docs/superpowers/history.md` and `docs/superpowers/progress.md` only. I checked the owner's
decisions in the project chat directly, not through the coordinator's summary.

| Finding | Verdict | Evidence |
|---|---|---|
| 1. Plan audit skipped | **pass** (waived by the owner) | Decision card "The setup PR skipped its plan audit ... Should it go ahead without one?" was answered "Waive it this once" by the owner's account at 16:22:20 UTC. `history.md` records it under Standing permissions ("waived for the setup pull request (#1) only, this once ... Every later lane 3 change gets its plan audit") and under Deviations, with the same 16:22 UTC time. The scope matches the card. |
| 4. Who writes `progress.md` and `history.md`, hand-written time | **pass** (allowed by the owner) | Decision card "Can the implementer write them for me?" was answered "Let the implementer write them" ("Recorded as a standing deviation, with real clock times") by the owner's account at 16:23:15 UTC. `history.md` records it under Standing permissions and Deviations at 16:23 UTC. The `progress.md` stamp now reads "2026-11-16 16:23 UTC", and the commit is dated `2026-11-16T16:23:42+00:00`: same minute, not ahead of the commit. |

### Notes from round 2 (not blocking)

1. **The PR body is stale.** Its Audit section still says red 1 "waits on the owner's choice: this PR does not merge
   until then". Update it to name the waiver, this audit's final commit and the result before merging.
2. **The record-keeping scope is worded two ways.** Standing permissions says "Standing until the owner changes it";
   Deviations says "while the coordinator has no checkout". The owner's card said only "a standing deviation". The
   two readings agree for now. Pick one wording at the next edit.
3. **`progress.md` Blockers** says PR #1 waits on this re-check. That is true as of 16:23 and is cleared by this
   commit.
4. **CI on `381e8f2`** was queued when this was written: the PR is now marked ready, so this is the full run the merge
   gate counts. This audit does not cover CI. The merge still needs `gate` green on the head commit.

### Result after round 2

No red findings remain open at `381e8f2`. Findings 2, 3 and 5 passed at `b5e77df` and are unchanged by `381e8f2`
(it touches only the two records). Findings 1 and 4 pass on the owner's recorded decisions. From this audit's side,
PR #1 can merge once the full CI run on its head is green. Any later push other than this audit file makes this
audit stale.
