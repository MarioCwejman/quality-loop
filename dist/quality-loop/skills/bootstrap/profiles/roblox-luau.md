# Profile: Roblox / Luau

## Confirm before committing to this profile

Roblox requires at least one of: `default.project.json`, a `*.rbxl`/`*.rbxlx`, or
`game:GetService` in source. A bare `.lua` or `.luau` file proves nothing — LuaJIT
kernels, Love2D games, and Neovim config all use the same extensions and none of the
Roblox rules apply to them. If the markers are absent, use `profiles/unknown.md`.

Record in the profile which marker proved it.

## What to read

- `default.project.json` — the tree, and every `$path` mapping
- `$ignoreUnknownInstances` on each node
- `rokit.toml` / `wally.toml` / `aftman.toml` — pinned tool and package versions
- `selene.toml`, `stylua.toml`, `.stylua.toml` — adopted linters and formatters
- `globalTypes.d.luau` or `globalTypes.d.lua` — generated API definitions, if present
- `sourcemap.json` — present only if Rojo was run with `--output`

## Toolchain facts that matter

The Rokit shims live in `~/.rokit/bin`. That directory is on the user PATH but is
often **missing from an already-running process's PATH**. Invoke by full path when
the bare name fails rather than concluding the tool is absent.

| Tool | When to run it |
|---|---|
| `luau-lsp analyze <file>` | Always available. Pass `--definitions=globalTypes.d.luau` when the project has one. Without definitions it warns about missing definitions and about `--platform=roblox`; read past both. |
| `selene` | **Only where `selene.toml` exists.** Without it selene parses as Lua 5.1 and reports false syntax errors on every type annotation — six bogus parse errors on a four-line typed file is typical. Verified behaviour, not a guess. |
| `stylua --check` | Only where `stylua.toml` or `.stylua.toml` exists. |

The global write gate already applies exactly these conditions. Do not duplicate them
in a project hook.

If the project has `selene.toml` but no `std = "roblox"` line, flag it — the config
exists but is configured for the wrong standard library.

## Rules worth writing

Scope by path. Put in `.claude/rules/`:

- The Rojo tree's non-obvious mappings, and specifically every node where
  `$ignoreUnknownInstances` is `false` — anything hand-built under those nodes is
  destroyed on sync. Name the nodes.
- The project's own module layout and how modules are required (a `Shared` folder
  reached by `ReplicatedStorage`, a Knit/Flamework-style framework, plain
  `require(script.Parent)`).
- Remote boundaries: which events exist, what each one is allowed to receive, and
  where validation lives.
- Data persistence shape if the project uses DataStores — the schema and the
  migration rule are invariants worth loading.
- The project's branch and sync workflow if it has one.

Do not restate the generic Luau rules; `~/.claude/rules/luau.md` already carries
`task.*` over deprecated globals, `GetService`, `WaitForChild` timeouts, connection
lifetime, and Remote distrust.

## Verification loop

Studio's built-in MCP server is wired at user scope as `Roblox_Studio`. It needs
Studio **open** with MCP enabled; there is no headless path.

1. `mcp__Roblox_Studio__list_roblox_studios` — confirm the right place is open
2. `mcp__Roblox_Studio__get_studio_state` — confirm Edit vs Play mode
3. `mcp__Roblox_Studio__screen_capture` — Edit-mode capture is the reliable path;
   play-mode capture has historically been unreliable
4. `mcp__Roblox_Studio__get_console_output` — read it after any run rather than
   asserting behaviour
5. `mcp__Roblox_Studio__execute_luau` for targeted checks against the live DataModel

Record in the profile that behaviour claims require Studio open, so a future session
knows why a check was skipped rather than silently claiming success.

## Reviewer

`luau-reviewer` covers Remote boundaries, instance and connection lifetime, the
Rojo/Studio boundary, invented API surface, and typed Luau. Generate a project agent
only to add domain invariants it cannot know — an economy's currency rules, a
replication model, a state machine's legal transitions.

## Prove it

Touch one `.luau` file to trigger the global gate and confirm `luau-lsp` reports
through it. Then confirm Studio connectivity and capture one Edit-mode viewport. If
Studio is closed, say so — do not record the loop as verified.

## Traps

- Editing `*.rbxl`/`*.rbxlx` as text, or shipping code by committing a place file.
- Writing logic that depends on instances only created by hand in Studio.
- Assuming a property, method, or enum exists because it sounds plausible. Check the
  docs or read it back from the DataModel.
- A file suffix that contradicts intent: `.server.luau` → `Script`,
  `.client.luau` → `LocalScript`, plain `.luau` → `ModuleScript`, `init.luau` makes
  its folder a module.
