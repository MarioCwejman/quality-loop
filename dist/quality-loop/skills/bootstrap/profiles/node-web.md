# Profile: Node / web

Triggered by `package.json`. That marker covers a wide range — a React app, an
Express API, a CLI, and a no-build vanilla-JS page all have one. Narrow it before
writing anything.

## Narrow the stack from the manifest, not from impressions

Read `package.json` and the lockfile. Decide from **declared dependencies**:

| Look for | Means |
|---|---|
| `react`, `vue`, `svelte`, `@angular/core`, `solid-js` | Component framework; tokens and component discipline apply |
| `next`, `nuxt`, `astro`, `remix`, `sveltekit` | Meta-framework; routing and build conventions are its own |
| `vite`, `webpack`, `rollup`, `esbuild`, `parcel` | There is a build step and a dev server |
| `typescript` + `tsconfig.json` | Type checking is part of "done" |
| `tailwindcss`, `@emotion/*`, `styled-components` | Adopted styling system — use it, do not add another |
| `express`, `fastify`, `hono`, `koa` | Server; no visual surface unless it also serves pages |
| none of the above, no build config | Node scripts or a no-build page. Treat it as such. |

**A `package.json` does not imply a build step.** A project with no bundler, no
lockfile, and plain `<script src>` tags is a no-build project; read
`profiles/static.md` alongside this one and do not introduce a bundler.

Check whether `node_modules` is actually installed. A manifest listing a tool the
project has never installed is not an adopted tool.

## Verification commands

Take them from `package.json` scripts. Do not invent them. Common real forms:

- `npm test` / `npm run test` — read what it actually shells out to
- `node --test` with `tests/*.test.mjs` or `*.test.cjs` — the stdlib runner, no deps
- `vitest run`, `jest`, `mocha` — only if declared
- `npm run build`, `tsc --noEmit`, `npm run lint`

Record the exact command in the profile.

**Keep `tsc --noEmit` out of a per-edit hook.** A whole-project typecheck on every
write is far too slow to run on each edit. It belongs to the reviewer or to a
pre-commit step. The global gate already runs `node --check` per file, which catches
syntax immediately and costs nothing.

## Formatters and linters

Only adopted ones. The config file must already exist:

| Config present | Tool is adopted |
|---|---|
| `.prettierrc*`, `prettier` key in `package.json` | Prettier |
| `eslint.config.*`, `.eslintrc*` | ESLint |
| `biome.json`, `biome.jsonc` | Biome |

No config means the project has not adopted it. Do not add one, and do not run the
tool. The global gate already enforces this condition.

## Rules worth writing

Scope by path — a repo with `src/`, `server/`, and `scripts/` usually wants
different rules for each. Put in `.claude/rules/`:

- Module system reality: ESM vs CJS, `"type"` in `package.json`, and which
  directories deviate. This is the most common source of wasted time in Node repos.
- Where tests live and what they are named, matching what is already there.
- The data flow or state model if the project has one worth stating.
- API route conventions, error-shape conventions, validation boundaries.
- Any dependency that is pinned deliberately, and why.

Do not restate `~/.claude/rules/web-ui.md`; it already carries token discipline, the
quality floor, real-content requirements, and the no-stack-expansion rule.

## Verification loop

Playwright MCP is wired at user scope as `playwright`.

1. Start the project's own dev server with its own command, in the background
2. `mcp__playwright__browser_navigate` to the served URL — or a `file://` URL
   directly for a no-build page, which needs no server at all
3. `mcp__playwright__browser_resize` and screenshot at the design width and at a
   narrow width around 390px
4. `mcp__playwright__browser_console_messages` — a page with an exception behind it
   is not done
5. `mcp__playwright__browser_snapshot` for heading structure and control reachability

If the repo already has a `.playwright-mcp/` directory, that is the established
convention for where captures land; follow it.

## Reviewer

`code-reviewer` for logic, `art-director` for anything rendered. Generate a project
art-director variant when the project has a specific visual language worth encoding —
its palette, its density, its type treatment, its stated feel. Lift the criteria from
the project's own docs rather than inventing them.

## Prove it

Touch one `.js`/`.ts` file to trigger the global gate. Run the project's recorded test
command. For a visual surface, capture one screenshot at two widths and have
`art-director` critique it. Report what each printed.

## Traps

- Introducing TypeScript, Tailwind, a component library, or a bundler into a project
  that is not using one.
- Assuming a popular package is available. Check the manifest and the lockfile.
- Writing a test in a runner the project does not have installed.
- Treating a monorepo root manifest as the whole story — check for workspaces and
  per-package manifests.
