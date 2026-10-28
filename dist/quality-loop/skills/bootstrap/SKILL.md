---
name: bootstrap
description: This skill should be used when the user asks to "bootstrap this project", "set up Claude for this repo", "generate a project profile", "onboard this codebase", "configure rules for this project", or when a session starts in a repository that has no AGENTS.md, no CLAUDE.md, and no .claude/project-profile.md. Detects the stack, interviews briefly, and generates a tailored per-project Claude layer without overwriting the project's existing instructions.
argument-hint: "[path to project, defaults to cwd]"
version: 0.1.0
---

# Bootstrap a project layer

Generate the per-project Claude layer: path-scoped rules, a recorded profile, and
project-specific reviewer criteria. Detect the stack rather than assuming it, read
what the project already says before writing anything, and prove the result works
before reporting success.

## Hard rule: never suppress existing instructions

Claude reads `AGENTS.md` **only when no `CLAUDE.md` exists in the working directory
or above it.** Creating a project `CLAUDE.md` next to an `AGENTS.md` silently
destroys the project's best documentation.

Before writing any file, check:

```bash
ls AGENTS.md CLAUDE.md .claude/CLAUDE.md CLAUDE.local.md .claude/project-profile.md 2>/dev/null
```

- `AGENTS.md` exists → **never create `CLAUDE.md` or `.claude/CLAUDE.md`.** Put new
  guidance in `.claude/rules/` (which does not count against `AGENTS.md`) or extend
  `AGENTS.md` itself with the user's approval.
- Both already exist → report it as a defect. The `AGENTS.md` is currently dead
  weight. Offer to merge it into `CLAUDE.md` or delete the `CLAUDE.md`.
- Neither exists → a project `CLAUDE.md` is safe, but prefer `.claude/rules/`
  anyway so stack knowledge loads only when relevant.

Never rewrite an existing `AGENTS.md` wholesale. It is hand-written and load-bearing.
Propose diffs; do not replace.

## Step 1 — Detect, never assume

Look for markers before asking. A repository may match more than one; treat that as
normal rather than a conflict.

| Markers found | Profile |
|---|---|
| `default.project.json`, `*.rbxl`, `*.rbxlx`, `game:GetService` in source | `profiles/roblox-luau.md` |
| `package.json` | `profiles/node-web.md` |
| `pyproject.toml`, `requirements.txt`, `setup.py`, `*.py` entrypoint | `profiles/python.md` |
| `*.sln`, `*.csproj`, `*.fsproj` | `profiles/dotnet.md` |
| `index.html` with no `package.json` and no build config | `profiles/static.md` |
| anything else, or nothing recognisable | `profiles/unknown.md` |

Read only the profiles that matched. Report which markers drove the decision — a
detection the user can audit is worth more than a confident guess.

**Multi-stack repositories are the common case, not the exception.** A repo with a
Python backend, vanilla JS frontend, and an embedded Lua kernel needs three sets of
path-scoped rules, not one compromise. Scope each rule file by path and say so.

Check also whether a `.lua`/`.luau` file is actually Roblox. LuaJIT kernels, Love2D
games, and Neovim config are plain Lua; applying Roblox rules to them produces
confident nonsense.

## Step 2 — Read what exists before writing

Read, in this order:

1. `AGENTS.md`, `CLAUDE.md`, `.claude/rules/*`
2. `README`, `docs/`, `CONTRIBUTING`
3. The dependency manifest and lockfile — what is *actually* installed
4. Config files that reveal adopted tooling: `.prettierrc`, `eslint.config.*`,
   `biome.json`, `ruff.toml`, `stylua.toml`, `selene.toml`, `tsconfig.json`,
   `.editorconfig`
5. `package.json` scripts, `Makefile`, `*.cmd` wrappers — the project's own commands
6. `.gitignore` — what is deliberately untracked and therefore off-limits

Extract the project's real verification commands from these. Never invent an
invocation; a wrong test command is worse than none.

## Step 3 — Interview, briefly

Ask only what cannot be read from the repository. Use `AskUserQuestion`, cap it at
four questions, and skip any the repo already answers:

- What is this project for, and who uses it?
- What does "done" mean here — which command or check has to pass?
- For anything with a visual surface: what should it feel like, and are there
  reference images? (If the answer is thin, say that the design cannot be judged
  without a brief rather than inventing one.)
- Anything that is off-limits — vendored trees, generated files, pinned versions,
  data directories?

Confirm detection results in the same pass rather than asking separately.

## Step 4 — Pull vault references

If a taste vault exists — `~/Documents/Vault` by default — search its `references/` and
`playbooks/` for notes whose frontmatter `tags` or `type` match this project's stack
and purpose. Report which notes were used and which were ignored. If the vault is
absent or empty, skip silently — do not block on it.

## Step 5 — Generate only what is missing

The global layer at `~/.claude/` already provides: syntax and type gates on every
write, a Stop gate that asks for evidence, Playwright and Roblox Studio MCP at user
scope, path-scoped rules for Luau / Python / web UI, and the `art-director`,
`code-reviewer`, and `luau-reviewer` agents.

**Do not regenerate any of that per project.** Write only what the global layer
cannot know:

| File | Write it when |
|---|---|
| `.claude/rules/<area>.md` | The project has conventions, invariants, or commands worth loading on matching files. Use `paths:` frontmatter. This is the main deliverable. |
| `.claude/project-profile.md` | Always. Record what was detected, which markers proved it, the verification commands, what is off-limits, and what was deliberately not generated. |
| `.claude/agents/<name>.md` | The project needs reviewer criteria the global agents lack — a specific visual language, a domain invariant, a state model. |
| `.mcp.json` | The project needs a server beyond the user-scope ones. Usually nothing. |
| `.claude/settings.json` | Only for a genuinely project-specific need: a fast targeted check the global hook cannot infer, or an `additionalDirectories` entry. A slow full test suite does not belong in a per-edit hook. |

Write rules as invariants and commands, not as prose about the architecture. "Money
is integer cents; never float" earns its place. "This project uses a layered
architecture" does not.

## Step 6 — Prove it

Do not report success on an unexercised layer. Run at least one real check:

- Trigger the global write gate by touching a source file, and confirm it reports
  through the project's own tooling.
- Run the verification command recorded in the profile. If it fails, that is a
  finding about the project, not a reason to omit it.
- Anything with a visual surface: capture one screenshot and have `art-director`
  critique it against the brief from Step 3.
- Roblox: confirm Studio is connected and capture one Edit-mode viewport.

Report what ran and what it printed. If something could not run, say which and why.

## Step 7 — Unknown stack

For an unrecognised stack, follow `profiles/unknown.md`: research the current
standard tooling for that ecosystem, confirm what the repository actually uses,
generate the layer, and then **propose saving a new profile** so the next project of
that kind is not researched from scratch. Do not save it without asking.

## Never generate

- A formatter, linter, framework, bundler, or build step the project has not already
  adopted. A config file must already exist. Reformatting an unadopted project buries
  real changes in a thousand-line diff.
- A test file in a style the project does not use — match `unittest` vs `pytest`,
  and the existing directory layout.
- A `CLAUDE.md` in a repo that has an `AGENTS.md`.
- Rules restating what the global layer already says.
- Placeholder content in any generated rule or profile. If a value is unknown, ask
  or omit the line.

## Profiles

Read the matched profile(s) only:

- **`profiles/roblox-luau.md`** — Rojo projects, Studio MCP loop, Luau toolchain
- **`profiles/node-web.md`** — Node and browser projects, with and without a build step
- **`profiles/python.md`** — stdlib-first Python, test placement, adopted tooling
- **`profiles/dotnet.md`** — C#/.NET solutions
- **`profiles/static.md`** — hand-written HTML/CSS/JS with no build
- **`profiles/unknown.md`** — research procedure and new-profile template
