---
paths:
  - "**/*.luau"
  - "**/*.lua"
---

# Luau / Roblox

**Scope check first.** This file describes *Roblox* Luau. Plenty of `.lua` is not Roblox —
PoB2 / LuaJIT kernels, Love2D, Neovim config, embedded scripting. If the project has no
`default.project.json`, no `*.rbxl`/`*.rbxlx`, and no `game:GetService` anywhere, then ignore
everything below about Roblox APIs, Rojo, and Studio, and follow the project's own conventions.

## Rojo projects: the filesystem is the source of truth

- When a `default.project.json` exists, edit files on disk. Don't instruct me to paste code into
  Studio, and don't write logic that depends on instances only created by hand in Studio.
- File suffix decides the class: `.server.luau` → `Script`, `.client.luau` → `LocalScript`,
  plain `.luau` → `ModuleScript`. `init.luau` makes its folder a module.
- Watch `$ignoreUnknownInstances`. Where it is `false`, Rojo removes children it doesn't know
  about on sync — anything built by hand in Studio under that node will be destroyed. Say so
  before suggesting someone build there manually.
- Don't edit `*.rbxl`/`*.rbxlx` as text, and don't commit place files as a way to ship code.

## Correctness habits that actually bite

- `task.wait` / `task.spawn` / `task.delay` / `task.defer`, never the deprecated globals
  `wait`, `spawn`, `delay`.
- `game:GetService("Players")`, not `game.Players`.
- Give `WaitForChild` a timeout and handle the nil. Without one it waits forever.
- Disconnect every `RBXScriptConnection` you create, and `:Destroy()` every instance you create.
  A live connection keeps its instance alive — this is the usual memory leak.
- Validate anything crossing a RemoteEvent/RemoteFunction boundary. The client is hostile;
  never trust a client-supplied amount, position, or id.
- Don't guess the API surface. If you're unsure whether a property, method, or enum exists,
  check the Roblox docs or read it back from the DataModel rather than writing plausible code.

## Types

- Annotate function parameters and return types. Prefer `--!strict` on new files; keep whatever
  mode an existing file already declares.
- Don't add `any` to silence the analyzer — fix the type or say why it can't be fixed.

## Checking your work

- `luau-lsp analyze <file>` is the always-available gate. For Roblox projects pass the
  generated `globalTypes.d.luau` via `--definitions` when the project has one; otherwise expect
  a warning about missing definitions and read past it.
- `selene` requires a `selene.toml` with `std = "roblox"`. Without that config it parses as
  Lua 5.1 and reports **false** syntax errors on typed Luau. Only run it where that file exists.
- `stylua` only where a `stylua.toml` or `.stylua.toml` exists. Don't reformat a project that
  hasn't adopted it.
- Behaviour claims need a playtest. Use the Studio MCP server to run the place and read the
  console rather than asserting it works.
