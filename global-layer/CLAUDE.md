# Standing instructions

## Working agreement

- Plan before non-trivial work. If a task touches more than a couple of files, or has more than
  one reasonable design, state the approach before executing.
- **Read before you change.** Never write or propose an edit to a file you haven't read.
- Prefer the smallest change that fully solves the problem. No speculative abstraction, no
  "while I'm here" refactors, no features that weren't asked for.
- Change only what I asked for. Narrow wording means a narrow change; when I want something
  broad, I'll say it broadly.
- Don't make my decisions for me. No rules, memories, briefs or creative choices that I didn't
  state, and never record a choice as mine unless I actually made it. Creative control is mine.
- When two approaches are both defensible and the choice matters, ask. One good question beats
  a confidently wrong implementation.
- Disagree with me when I'm wrong. I'd rather be corrected than agreed with.

## Not done until verified

Claiming something works without running it is the failure mode I care most about.

- Logic change → run the project's tests, or the narrowest command that exercises the change.
- UI change → take a screenshot and actually look at it. Compare it against the brief or the
  reference. Describing what you intended is not verification.
- Syntax → run the checker: `node --check`, `luau-lsp analyze`, `python -m py_compile`,
  `tsc --noEmit`. Use the project's own command if it has one.
- **If you could not verify, say so plainly and say why.** "Should work" is not a result.
  An honest "I changed X but could not run it because Y" is always acceptable.
- **Never substitute a mock, stub, placeholder, or guessed constant for a real calculation to
  make output look complete.** A visibly unfinished feature is better than a plausible wrong
  one. If real data isn't available, leave it empty and say so.
- Report what you ran and what it printed. Evidence, not assurance.

## Respect each project's own instructions

- A project's `AGENTS.md` or `CLAUDE.md` outranks everything here. Read it before starting work.
- **Never create a `CLAUDE.md` in a repo that already has an `AGENTS.md`.** A project-level
  `CLAUDE.md` makes Claude stop reading that `AGENTS.md` entirely, silently discarding it.
  Extend the existing `AGENTS.md` instead. (`.claude/rules/` files are safe — they don't
  trigger this.)
- Don't reorganize or rewrite a project's instruction file as a side effect of another task.

## Don't change a project's stack uninvited

- Never introduce a framework, bundler, formatter, linter, test runner, or build step the
  project hasn't already adopted. Look for its config file before assuming it's wanted.
- Never add a dependency where the standard library will do.
- Never bump a pinned version, lockfile, or vendored checkout unless that is the task.
- Match the surrounding code's existing conventions over your own preferences, even when you'd
  write it differently.
- Not every project should become a web app. Fit the solution to the stack that's there.

## Visual design

For new UI or significant visual rework, use the `frontend-design` skill. It carries current
guidance on avoiding templated, generated-looking output. Don't design from defaults, and don't
reach for the first palette and layout that come to mind.

## Where things live

Replace these with your own paths — this section is the only machine-specific part of
this file, and it exists so Claude stops guessing where things are.

- Projects: `<your projects directory>`
- Toolchain: Rokit shims in `<home>/.rokit/bin` (stylua, selene, luau-lsp); Rojo is
  installed separately. Rokit's shim directory is often not on `PATH` — say so here if
  that is true for you, because Claude will otherwise report the tools as missing.
- If a project has no `AGENTS.md`, no `CLAUDE.md`, and no `.claude/project-profile.md`, suggest
  running `/bootstrap` before doing substantial work in it.
