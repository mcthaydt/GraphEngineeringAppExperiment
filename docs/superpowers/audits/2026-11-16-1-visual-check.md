# Visual check, cycle 1: the todo list screen

- **Commit examined:** `a4aa2fbc790ad602bf21bd58f4bc4616ac978e29` on `todo-app` (PR #2). A push that changes
  `src/` makes this check stale.
- **Brief:** PR #2's acceptance criteria 1 to 11, plus the `visual-check` rule that no screen is a dead end and every
  error says what to do next.
- **Steps run:** step 1 (words and design) and step 2 (end-to-end walk), by a fresh session. Step 3 (last look) waits
  for the fixes.
- **How:** `npm ci && npm run build && npm run preview` (port 4173), driven by a Playwright script on the three
  profiles in `playwright.config.ts` (small phone = iPhone SE 320x568, tablet = iPad Mini 768x1024, computer = Desktop
  Chrome 1280x720), Chromium, light and dark scheme. Emulation evidence, not real devices. Every screenshot below was
  looked at.
- **Screenshots:** a copy of the small-phone ones is in the project files under `todo-app-previews/visual-check/`.

## Result

**1 red, 6 notes.** Every journey works on all three profiles; the one red is the "won't save" warning, which says what
will go wrong but not what to do about it.

## What was walked

| Journey | Small phone | Tablet | Computer |
|---|---|---|---|
| Empty state on first open ("Nothing on your list yet…") | pass | pass | pass |
| Blank add, and spaces only: note shown, nothing added | pass | pass | pass |
| Add with Enter and with the Add button; box empties, focus stays | pass | pass | pass |
| Tick crosses out, tick again un-crosses | pass | pass | pass |
| Remove the last item of an 8-item list: banner shows, focus and scroll move to "Put it back" | pass | pass | pass |
| Put it back restores the same place, focus returns to the box | pass | pass | pass |
| Reload keeps all 8 items and the tick | pass | pass | pass |
| Keyboard order: box, Add, then tick and Remove for each row; 4px orange focus ring visible | pass | pass | pass |
| Dark scheme: empty screen readable, Add button contrast fine | pass | pass | pass |
| `Storage.prototype.setItem` throws: list still works this session, warning appears | red R1 | red R1 | red R1 |
| `todo-app.list.v1` set to `{garbage!!`: warning, fresh list, garbage kept under `todo-app.list.v1.unreadable`, next add saves, reload clean | pass | pass | pass |
| No console errors or page errors during any walk | pass | pass | pass |

Measured on all profiles: the Add button is 96x60 px and every Remove and "Put it back" button is 56 px tall
(criterion 11 asks for at least 56). The Add button is visible without scrolling on every profile, including with a
long list (it sits at y=125 px).

## Findings

### R1

UNIT: `src/features/todos/TodoApp.svelte`, the "won't save" warning (`loadProblem === 'unavailable' || saveFailed`).
VERDICT: red.
REQUIREMENT: `visual-check` step 2, "every error says what to do next"; PR #2 criterion 6 (error state).
REASON: the warning says the list will be lost but gives no next step, so the person is left with bad news and no way
forward.
EVIDENCE: with `Storage.prototype.setItem` overridden to throw, adding "Buy milk" shows only "This browser won't let us
save your list. It will be gone when you close this page." on all three profiles (screenshot
`small-phone-6-blocked-add.png`). Nothing on the screen says whether to keep going or what would make saving work.
EXPECTED: the warning keeps the plain bad news and adds one plain next step, for example that the list still works
until the page is closed, and that opening the page in a normal (not private) window lets it save. Wording is the
implementer's, inside the drunk-grandma test.
FIX: change that warning's text in `src/features/todos/TodoApp.svelte` only. Optional, same scope: an e2e step in
`tests/routes/page.e2e.ts` that blocks `setItem` and checks the new wording, since no test or screenshot shows this
banner today.

### Notes (recorded, not fixed here)

N1. **Warning comes late when only writing is blocked.** With `getItem` working and `setItem` throwing, nothing warns
on open; the warning appears only after the first add. When `localStorage` itself throws, it warns on open. Today's
behaviour still tells the person before anything is lost, so this is a note. `src/features/todos/saved.ts`.

N2. **"The old one is kept safe on this device" promises something the person cannot use.** No screen gets the old
list back, and the message disappears on the next reload. It is not a dead end (the empty-state line under it says
what to do), but "kept safe" may make someone look for it. Possible wording: "…so you're starting a fresh one." and
drop the last sentence, or keep it if a way back is planned. `src/features/todos/TodoApp.svelte`.

N3. **A second unreadable list replaces the first kept copy.** After `{garbage!!` is kept, then a fresh list is saved,
then `todo-app.list.v1` is made unreadable again with `[{"wrong":1}]`, the `.unreadable` key now holds
`[{"wrong":1}]` and `{garbage!!` is gone. Needs two separate corruptions, so very unlikely, but it is the one case
where the "kept safe" promise breaks. Changing it after the format ships is lane 3. `src/features/todos/saved.ts`.

N4. **Removing a second item drops the first "Put it back".** Only the last removed item can be put back; the earlier
one goes without a word. Matches criterion 4 as written. `src/features/todos/TodoApp.svelte`.

N5. **Long to-dos wrap to one or two words a line on the small phone.** The 122 px Remove button leaves about 150 px
for text at 320 px wide, so "Pay the gas bill before Friday…" runs ten lines (`small-phone-light-3-list.png`). Readable,
not broken. A layout change (Remove under the text on narrow screens, or a shorter button) would help.

N6. **Without JavaScript the page says "Getting your list…" forever.** The prerendered page ships the loading line, and
nothing replaces it if scripts never run. Outside the brief's supported browsers, so a note only.
