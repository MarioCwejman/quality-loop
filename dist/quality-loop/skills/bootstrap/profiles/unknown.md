# Profile: Unknown stack

Reached when no marker matched, when markers conflict, or when the stack is real but
has no profile yet — Java, Go, Rust, Ruby, PHP, Elixir, Swift, embedded C, a
game engine other than Roblox.

The goal is the same layer the other profiles produce, plus a reusable profile so the
next project of this kind is not researched from scratch.

## Step 1 — Establish what it is from the repository

Do not guess from the language alone; the build tool determines the loop.

```bash
git ls-files 2>/dev/null | head -100
ls -a
```

Look for the build or dependency manifest, which names the ecosystem precisely:

| File | Ecosystem |
|---|---|
| `pom.xml`, `build.gradle`, `build.gradle.kts`, `gradlew` | Java / Kotlin |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `Gemfile` | Ruby |
| `composer.json` | PHP |
| `mix.exs` | Elixir |
| `Package.swift`, `*.xcodeproj` | Swift |
| `CMakeLists.txt`, `Makefile`, `meson.build` | C / C++ |
| `*.uproject`, `*.unity`, `project.godot` | Game engine |

Count file extensions to find the dominant language, and read the README for the
project's own stated build and test commands. **The project's documented command
always beats a researched one.**

If nothing identifies it, ask. A wrong guess here propagates into every generated
rule.

## Step 2 — Research current practice

Only for what the repository could not answer. Search for the ecosystem's current
standard, and check the date on what is found — tooling advice goes stale, and a
deprecated tool recommended confidently is worse than no recommendation.

Establish four things:

1. **The syntax or type gate** — the cheapest per-file check (`go vet`,
   `cargo check`, `javac`, `ruby -c`, `php -l`)
2. **The test command** — and the runner the ecosystem actually uses now
3. **The formatter** — and critically, whether it is *conventionally always on* (Go
   and Rust: `gofmt` and `rustfmt` are universal) or *opt-in per project* (most
   others). Only the universal ones may be assumed adopted.
4. **Whether a visual loop exists** — a served page reachable by Playwright, or no
   visual surface at all

Then verify each against the repository. A tool the ecosystem recommends but this
project has not adopted is still not adopted.

## Step 3 — Confirm the tools exist

Check before recording a command that cannot run:

```bash
for t in <candidate tools>; do printf '%s: ' "$t"; command -v "$t" || echo missing; done
```

Record missing tools in the profile as a known gap. Do not install anything without
asking.

## Step 4 — Generate the layer

Follow Step 5 of the main skill. The per-project deliverables are unchanged:
`.claude/rules/` scoped by path, `.claude/project-profile.md`, and a project reviewer
agent only if the global ones lack necessary criteria.

Be explicit in the profile about what the global write gate does **not** cover. It
handles JavaScript, Python, Luau, and JSON. For any other language a file edit is
tracked as unverified until a build or test runs, and the Stop gate will ask for
that. This is correct behaviour, not a bug — but record it so a future session
understands why.

## Step 5 — Propose a new profile

Having done the research once, offer to save it. Ask first; do not write it silently.

Write to `~/.claude/skills/bootstrap/profiles/<ecosystem>.md`, matching the structure
the existing profiles use:

```markdown
# Profile: <Ecosystem>

Triggered by <exact marker files>.

## Confirm before committing to this profile
<markers that are necessary, and lookalikes to rule out>

## What to read
<manifests, configs, and what each reveals>

## Verification commands
<syntax gate, test command, build — with the rule for taking the project's own>

## Formatters and linters
<table: config file present -> tool is adopted. Note any universally-adopted tool.>

## Rules worth writing
<what belongs in .claude/rules/ for this stack, and what the global layer already covers>

## Verification loop
<the concrete steps, or an honest statement that no automated visual loop exists>

## Reviewer
<which global agent applies; what a project agent would need to add>

## Prove it
<the minimum real check before reporting success>

## Traps
<failures specific to this ecosystem, especially Windows-specific ones>
```

Then add the marker row to the detection table in `SKILL.md` so the next project
matches automatically instead of landing here again.

## Honesty requirements

- State plainly which parts of the layer are researched rather than observed.
- Never record a command that was not run at least once.
- If no automated verification is possible for this stack on this machine, say so in
  the profile. An honest gap is useful; a fabricated loop is worse than nothing.
