# History

## Standing permissions

- **2026-11-16, repo setup.** Owner instruction (project thread, 2026-11-16 16:00 UTC): create the public repo
  `mcthaydt/GraphEngineeringAppExperiment`, add the CI workflow and the rules files (CLAUDE.md and the `review`,
  `release` and `visual-check` skills), and set branch protection on `main` requiring the CI gate. Scope: those
  actions only, for the first setup. The owner created the repo themselves (this runtime cannot create repos).
  It does not cover later edits to the CI workflow or the rules files.
- **2026-11-16, plan audit waiver.** Owner's choice on a decision card (16:22 UTC): the lane 3 plan audit is waived
  for the setup pull request (#1) only, this once. The implementation audit still applies. Every later lane 3 change
  gets its plan audit.
- **2026-11-16, record keeping.** Owner's choice on a decision card (16:23 UTC, "Let the implementer write them"):
  the implementer may write `progress.md` and `history.md` on the coordinator's behalf, because the coordinator has
  no checkout of this repo. Standing until the owner changes it.

## Setup

Setup check run 2026-11-16 by the first session.

- Stack commands: `npm ci`, `npm run lint`, `npm run check`, `npm test` and `npm run build` exit 0 on the setup
  branch (audited at 7222d58). `npm run test:e2e` exits 1 ("No tests found") until the app pull request (#2) adds the
  Playwright test; CI runs each browser test piece with `--pass-with-no-tests` because 6 pieces can leave some empty.
  Status on `main`: to be recorded after the setup merges (`main` holds only the README until then).
- CI gate (`.github/workflows/ci.yml`): added. Triggers include `ready_for_review`; the `decide checks` job decides
  which checks apply; the `gate` job is the single aggregate check.
- Branch protection on `main` requiring `gate` (strict, no force-push, no deletion): added by the owner with the
  `gh api` command at 16:14 UTC, because this runtime may not write branch protection; verified with
  `gh api .../branches/main/protection`. No earlier required checks existed.
- Session tools, as seen from a project thread: messaging the coordinator and other threads: found. Starting
  sessions: missing in the thread, found in the coordinator (it starts threads on request). Choosing a model:
  missing in the thread. Archiving: missing in the thread.
- Superpowers: plugin version 7.0.2. Where it differs from these rules, these rules win; known differences: its
  brainstorming and writing-plans skills write a design document for every feature, while the short path here uses
  the pull request as the brief; its subagent-driven-development skill uses subagents, which the rules forbid
  without the owner's say-so.

## Deviations

- **2026-11-16, setup (PR #1), lane 3: the plan audit was skipped** by the implementer, who judged it adds nothing
  because the owner supplied the rules text and `release` fixes the setup steps. Found red by the implementation audit
  (`docs/superpowers/audits/2026-11-16-1-implementation-audit.md`, finding 1). Owner decision,
  2026-11-16 16:22 UTC: waived for PR #1 only (decision card "Waive it this once"). See Standing permissions.

- **2026-11-16, record keeping: the implementer wrote `progress.md` and `history.md`** while the coordinator was
  active, against CLAUDE.md (The staged path, Writing). Found red by the implementation audit (finding 4). Owner
  decision, 2026-11-16 16:23 UTC: allowed as a standing deviation until the owner changes it. See
  Standing permissions.

## Approved screens

None yet.

## Lessons

None yet.
