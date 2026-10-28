---
paths:
  - "**/*.{css,scss,sass,less}"
  - "**/*.{html,htm}"
  - "**/*.{tsx,jsx,svelte,vue,astro}"
---

# UI work

## Before writing any new interface

Use the `frontend-design` skill for new UI or significant visual rework. It holds the current
guidance on aesthetic direction and on what makes output read as machine-generated. This file
only covers the mechanical discipline around it.

If there's no brief, get one before building: what the thing is, who it's for, what job the
screen does, and any references. Two sentences is enough, but guessing is not.

## Tokens before components before pages

- Establish colors, type scale, and spacing as named values first, then build components from
  them, then assemble pages. Don't retrofit a token system onto finished screens.
- Once a project has variables, never hardcode a hex, a font stack, or a magic pixel value in
  component code. If you need a value the token set doesn't have, add it to the token set.
- Reuse the project's existing primitives before writing a new one. Two near-identical button
  implementations is a defect.

## Real content

Never ship lorem ipsum, `Card Title`, `Lorem`, placeholder avatars, or fake metrics. Write the
actual copy the screen would carry, in the product's own voice. Placeholder text makes a design
impossible to judge and is a reliable tell of unfinished work.

## Quality floor

Meet these without being asked, and without announcing them: responsive down to mobile unless
the project is explicitly desktop-only, visible keyboard focus, `prefers-reduced-motion`
respected, text contrast that passes, and no interactive element reachable only by hover.

## Verify by looking

- Screenshot every visual change and actually examine it. Playwright MCP for web.
- Compare against the brief and any reference images, point by point. Name what matches and
  what doesn't.
- Check at least one narrow viewport, not just the one you designed at.
- "Should render correctly" is not verification. If you couldn't capture a screenshot, say so.

## Don't expand the stack

Don't introduce Tailwind, a component library, a CSS-in-JS runtime, a preprocessor, or a
bundler into a project that isn't already using it. Plain CSS in a plain-CSS project is the
correct answer. Check for the config file before assuming.

Watch selector specificity when editing existing CSS — section-level and element-level
selectors cancelling each other out is a common source of mysterious spacing bugs.
