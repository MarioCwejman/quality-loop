# Profile: Static site, no build

Triggered by `index.html` with no `package.json` and no build config. Also read this
alongside `profiles/node-web.md` when a `package.json` exists but declares no
bundler — a manifest does not imply a build step.

## The defining constraint

There is no build step, and that is a decision to respect, not a deficiency to fix.

Plain CSS in a plain-CSS project is the correct answer. Do not introduce Tailwind,
Sass, a component library, a CSS-in-JS runtime, a bundler, TypeScript, or a framework.
Every one of those converts a project anyone can open in a browser into one that
requires a toolchain, and none of them were asked for.

If the project genuinely needs a build step, say why and let the user decide. Do not
add it as a side effect of a feature request.

## What to read

- `index.html` and every other `*.html` — how scripts and styles are included,
  whether `type="module"` is used, what is shared between pages
- The CSS: whether custom properties already exist, and where they are declared.
  This is the token system; find it before writing any value.
- `*.js`: module vs classic scripts, and whether anything depends on load order
- `.nojekyll`, `CNAME`, `netlify.toml`, `vercel.json` — how it is deployed, which
  constrains what paths work
- Any `fonts/`, `assets/`, `img/` directory — what is vendored locally versus
  loaded from a CDN

## Verification commands

There is no test command unless the project added one. The gates are:

- `node --check <file>` per JavaScript file — the global write gate already runs this
- HTML and CSS have no syntax gate worth running; the browser console is the gate

So verification here is **almost entirely visual**, which makes the screenshot loop
mandatory rather than optional.

## Verification loop

A static page needs no server. Playwright can open it directly:

1. `mcp__playwright__browser_navigate` to a `file:///C:/path/to/index.html` URL
2. Screenshot at the design width and at a narrow width around 390px
3. `mcp__playwright__browser_console_messages` — catches the broken relative path,
   the missing asset, the typo'd selector
4. `mcp__playwright__browser_snapshot` — heading order, control reachability,
   keyboard focus

A `file://` URL will not work if the page uses `fetch` on a relative path or ES
modules with CORS restrictions. In that case serve it with whatever the project
documents, or `python -m http.server` as a neutral fallback that adds no dependency.

## Rules worth writing

Put in `.claude/rules/` scoped to `**/*.{html,css,js}`:

- **Where the custom properties live and what they are named.** The single most
  valuable rule for a no-build site, because without it every edit hardcodes a new
  hex value.
- The type scale and spacing scale actually in use, as values.
- Which stylesheet is loaded on which page, and the cascade order.
- Shared partials or includes, if the project has a convention for them.
- The deploy target and any path constraint it imposes (a GitHub Pages subpath
  breaks absolute `/asset` references).

Do not restate `~/.claude/rules/web-ui.md`; it already carries token discipline,
real-content requirements, the quality floor, and the no-stack-expansion rule.

## Watch selector specificity

In hand-written CSS that has grown, section-level and element-level selectors
cancelling each other out is the usual cause of a mysterious spacing bug. Before
adding a rule to fix spacing, find the rule already setting it.

## Reviewer

`art-director` is the primary reviewer for this stack — the work is mostly visual, so
the screenshot critique *is* the review. `code-reviewer` for any non-trivial
JavaScript.

Generate a project art-director variant when the site has a stated visual language;
lift the criteria from the project's own brief or docs rather than inventing them.

## Prove it

Open the page in Playwright, capture it at two widths, read the console, and have
`art-director` critique it against the brief. A static-site layer reported without a
screenshot is not verified.

## Traps

- Adding a toolchain. The most likely failure for this profile, and the most costly.
- Hardcoding a hex, font stack, or pixel value when custom properties already exist.
- Two near-identical implementations of the same component in different files.
- Assuming a `file://` capture proves the deployed site works, when the deploy target
  rewrites paths.
- Placeholder content left in. A static site is usually the deliverable itself, so
  `Lorem` ships.
