# quality-loop

A verification-first working layer for Claude Code. Its premise is that output quality is
set by constraints and feedback loops rather than by model choice, so it supplies three
things: hooks that refuse to let an edit pass unchecked, reviewer agents that judge the
rendered result instead of the intent, and skills that capture knowledge where it survives.

## What is inside

### Hooks (enforcement)

| Hook | Event | Does |
|---|---|---|
| `verify-edit.mjs` | `PostToolUse` on `Write\|Edit\|NotebookEdit` | Runs the real syntax checker for the file's language — `node --check`, `python -m py_compile`, `luau-lsp analyze`, `tsc --noEmit` — and reports failures. Check-only; it never reformats. Luau checks are gated on the project actually being a Roblox project. |
| `track-verification.mjs` | `PostToolUse` on `Bash` and MCP tools | Records that a verification command was run, per session. Async. |
| `stop-gate.mjs` | `Stop` | Blocks finishing when code was edited but nothing was ever run to verify it. |
| `session-start.mjs` | `SessionStart` | Reports an `AGENTS.md` being suppressed by a `CLAUDE.md`, suggests `/bootstrap` in a real project with no layer, and nudges when the reference vault's inbox backs up. |

### Agents (outside eye)

- **`art-director`** — critiques UI by actually capturing and looking at it, at two
  viewports, against the project's own brief. Never edits.
- **`code-reviewer`** — reviews a local working tree. Works without a GitHub remote.
- **`luau-reviewer`** — Roblox Luau specifically: remote boundaries, instance lifetime,
  Rojo tree correctness. Explicitly not for LuaJIT or Love2D.

### Skills (on-demand knowledge)

- **`bootstrap`** — detects a repo's stack, interviews briefly, and generates a tailored
  per-project layer. Never creates a `CLAUDE.md` where an `AGENTS.md` exists, because that
  would silently suppress it. Ships six stack profiles: Roblox/Luau, Node web, Python,
  .NET, static sites, and unknown.
- **`ingest`** — captures a reference, asset or observation into a notes vault with
  provenance, extracting the reusable lesson rather than just storing the file.
- **`vault-lint`** — audits that vault for missing provenance, stale captures, broken
  links and duplicates. Reports and proposes; never curates on its own.
- **`retro`** — reviews a session, promotes a lesson to an enforced rule only on its
  **second independent** occurrence, writes it at the narrowest scope that is still true,
  and prunes rules that have gone stale.

## Install

```
claude plugin marketplace add <path-to-this-repo>/dist
claude plugin install quality-loop@mario-local
```

Requires **Node.js** on `PATH` for the hooks. Language checkers are optional — each hook
skips its check when the tool is absent rather than failing.

## Two things to know before enabling

**1. It will double-run hooks if you already have these in `~/.claude/settings.json`.**
Plugin hooks and user-settings hooks both fire. If you installed this layer by hand first,
remove the four entries from `settings.json`'s `hooks` block before enabling the plugin, or
every edit gets checked twice.

**2. It cannot carry `rules/` or a global `CLAUDE.md`.** Plugins package skills, agents,
commands, hooks and MCP servers — there is no `rules` component. Path-scoped guidance in
`~/.claude/rules/*.md` and the global `CLAUDE.md` have to be copied manually. This plugin is
therefore most of the layer, not all of it.

## Rebuilding

`dist/` is an artifact. `~/.claude` is the source of truth. After changing a skill, agent or
hook there, re-run `build-plugin.sh` from the repository root to refresh the package; it is
a one-way copy and does not touch the live layer.

## Licence

MIT. See `LICENSE`.
