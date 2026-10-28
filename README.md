# quality-loop

A verification-first working layer for Claude Code.

The premise is that output quality is set by constraints and feedback loops rather than by
model choice. So this adds three things: hooks that refuse to let an edit pass unchecked,
reviewer agents that judge the rendered result instead of the intent, and skills that put
knowledge where it survives past the session.

The thing it is actually built to stop: Claude ending a turn saying something works when
nothing has been run.

**[Read the manual](https://MarioCwejman.github.io/quality-loop/guide.html)** — or the
[overview](https://MarioCwejman.github.io/quality-loop/). Source in [`docs/`](docs/).

---

## Install

Requires [Node.js](https://nodejs.org) on your `PATH` for the hooks. Language checkers are
optional — each is skipped when the tool is absent rather than failing.

```bash
git clone https://github.com/MarioCwejman/quality-loop.git
cd quality-loop
claude plugin marketplace add ./dist
claude plugin install quality-loop@mario-cwejman
```

Then start a new session — skills, agents and hooks are read when a session opens.

Check what landed:

```bash
claude plugin details quality-loop@mario-cwejman
```

Four skills, three agents and three hook events.

### Also copy the global layer

A plugin can carry skills, agents, commands, hooks and MCP servers. There is **no `rules`
component**, and no way to ship a global `CLAUDE.md`. Those parts live in
[`global-layer/`](global-layer/) and are copied by hand:

```bash
cp -r global-layer/rules ~/.claude/rules
cp global-layer/CLAUDE.md ~/.claude/CLAUDE.md
```

Edit the "Where things live" section of `CLAUDE.md` afterwards — it is the only
machine-specific part, and it is there so Claude stops guessing where your projects and
toolchain are.

---

## What's in it

### Hooks — these run on their own

| Hook | Runs | Does |
|---|---|---|
| `verify-edit` | after a file is written | Runs that language's real syntax checker — `node --check`, a Python parse, `bash -n`, `luau-lsp analyze`, `tsc --noEmit`. Report-only: it never blocks and never reformats, because rewriting a file Claude just wrote desyncs its next edit. |
| `track-verification` | after a command or MCP tool | Records that something real was run. Silent; it exists so the stop-gate knows the work was checked. |
| `stop-gate` | when Claude tries to end a turn | Blocks the ending if code was edited and nothing was run against it. |
| `session-start` | on open, resume or clear | Warns when a `CLAUDE.md` is suppressing an `AGENTS.md`, suggests `/bootstrap` in a project with no setup, and flags a notes backlog. |

### Reviewers — a second opinion on work they didn't write

- **`art-director`** — opens the running page, captures it at two widths, and judges it
  against the project's own brief. Critique only; it never edits. If it cannot capture a
  screenshot it says so rather than reading the source and implying it looked.
- **`code-reviewer`** — reviews the local working tree. No GitHub remote required.
- **`luau-reviewer`** — Roblox specifics: remote boundaries, instance lifetime, Rojo tree
  correctness. Declines non-Roblox Lua, which is a different language.

### Skills — type the slash command

- **`/bootstrap`** — detects a repo's stack, interviews briefly, and generates a tailored
  per-project layer. Will not create a `CLAUDE.md` where an `AGENTS.md` exists, because
  that silently suppresses it. Ships six stack profiles: Roblox/Luau, Node web, Python,
  .NET, static sites, and unknown.
- **`/retro`** — reviews a session and promotes a lesson to an enforced rule only on its
  **second independent** occurrence, written at the narrowest scope that still holds. Also
  proposes deletions: an out-of-date rule still gets followed.
- **`/ingest`** — captures a reference, asset or observation into a notes vault with its
  provenance, extracting the reusable part rather than just storing the file.
- **`/vault-lint`** — audits those notes for missing sources, stale captures, broken links
  and duplicates. Reports and proposes; never curates on its own.

---

## Rebuilding the plugin

`dist/` is a build artifact. The sources of truth are `plugin-src/` for the manifests and
your live `~/.claude` for the components.

```bash
./build-plugin.sh
```

It is a one-way copy into `dist/`, it touches nothing outside it, and it fails loudly
rather than shipping a package that will not load.

---

## Known limits

- **It cannot carry `rules/` or a global `CLAUDE.md`.** See above — those are copied by
  hand, which is why `global-layer/` exists.
- **Hooks declared in both `~/.claude/settings.json` and a plugin will both fire.** If you
  set this up by hand first, remove the `hooks` block from `settings.json` before enabling
  the plugin, or every edit gets checked twice.
- **The packaged hooks have not been run end to end from inside a plugin.** The scripts
  themselves are well tested, and the plugin's structure validates, but their paths resolve
  differently as plugin paths. Until that is exercised, running the hand-installed copies
  is the safer configuration.
- **Rules decay.** Guidance that was true when written stops being true, and a stale rule
  is followed as confidently as a good one. `/retro` prunes, but only when you run it.
  Practical heuristic: when Claude says something odd about your code, suspect the rules
  before the model.
- **It adds latency and context.** A checker runs on every file write — usually well under
  a second. The components cost roughly 980 tokens per session before you do anything.

---

## Licence

MIT. See [LICENSE](LICENSE).
