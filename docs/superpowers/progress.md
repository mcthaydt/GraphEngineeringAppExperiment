# Progress

Last updated: 2026-11-16 16:12 UTC

## Active milestone: a simple todo app, merged and green on `main`

Brief: the owner's request in the project thread (2026-11-16 16:00 UTC) plus the acceptance criteria in each pull
request. Short path for the app; the setup pull request is lane 3 under the standing permission in `history.md`.

| Unit | Lane | State |
|---|---|---|
| Setup: rules files, CI gate, branch protection, project skeleton | 3 | in progress |
| Todo app: add, tick off, remove, saved in the browser | 1 | not started |

### Decisions

- Owner instruction: TypeScript, SvelteKit, SQLite or browser storage, Vitest plus one Playwright test, GitHub
  Actions; no sign-in, no Cloudflare.
- Agent-selected: browser localStorage instead of SQLite, because the app has one user and no server; changing it
  later means adding a server. Static site build (adapter-static). Chromium for every device profile.

### Blockers

- Branch protection on `main` needs the owner to run one `gh api` command (this runtime may not write it).

### Previews

None yet.
