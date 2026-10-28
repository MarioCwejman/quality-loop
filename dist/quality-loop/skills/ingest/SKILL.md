---
name: ingest
description: This skill should be used when the user wants to capture something into their taste vault — a reference image, a screenshot, a URL, a design observation, a palette, an asset, or a lesson worth keeping. Triggers include "ingest this", "save this to the vault", "add this reference", "capture this", "remember this design", "file this", and any time the user shares a visual reference or link and says it is worth keeping. Files the item into the vault with correct frontmatter and provenance, and extracts the reusable observation rather than just storing the artifact.
---

# Ingest into the taste vault

Capture something into the taste vault — `~/Documents/Vault` by default — so it is useful
later rather than merely stored. If that directory does not exist, say so and offer to
create it rather than writing notes into a path nobody reads.

The vault's own `CLAUDE.md` is the authority on folder meanings and write permissions. Read
it first; it may have changed since this skill was written.

## The point

A stored screenshot with no note is nearly worthless — in three months nobody remembers why
it was saved. **The observation is the asset; the file is the evidence.** So every ingest
produces a note, even when the thing being ingested is an image.

## Steps

### 1. Identify what you have

- **URL** → fetch it. Capture what is actually interesting, not the whole page.
- **Local image** → look at it. Describe what makes it work.
- **Pasted text / an observation** → the note *is* the content.
- **Asset file** (texture, model, audio) → provenance and licence are mandatory.
- **Nothing concrete** — the user said "save this" with no referent → ask what they mean
  rather than inventing one.

### 2. Decide destination

Per the vault's `CLAUDE.md`:

- `inbox/` — **the default.** Use it whenever you are unsure.
- `projects/<project>.md` — tied to one specific repo.
- `retro/` — only `/retro` writes here.
- `references/`, `playbooks/`, `assets/**` — **propose only.** Write to `inbox/` and state in
  the note what it should be promoted to and why. Do not write these directly.

When in doubt, `inbox/`. Filing something into the curated layer unasked is the failure mode
this split exists to prevent.

### 3. Write the note

Filename: `inbox/YYYY-MM-DD-kebab-slug.md`. Use today's real date.

```markdown
---
type: reference | observation | asset | lesson
created: YYYY-MM-DD
source: <URL, or filename, or "conversation", or "unknown">
licence: <only for assets and third-party work; omit otherwise>
tags: [<stack or domain>, <what it is about>]
promote-to: <references/ or playbooks/ — only if it deserves it, with a reason>
---

# <What this is>

## What is worth copying

The specific, reusable mechanism. Name values: sizes, colours, ratios, timings.

## Why it works

One or two sentences of actual reasoning, not adjectives.

## Where it would apply

Which stack or which kind of interface. If it is narrow, say so — a trick that only works
for dense desktop tools should say that, not pretend to be universal.
```

Save binary assets alongside at `inbox/<same-slug>.<ext>` and reference them from the note.
Never embed a large base64 blob in a markdown file.

### 4. Be honest about value

If the thing is unremarkable, say so and ask whether to keep it. A vault full of mediocre
references is worse than a small sharp one, because it stops being worth reading.

If it duplicates an existing note, link the existing one instead of writing a second.
`grep -ril "<keyword>"` across the vault before writing.

### 5. Report

Give the path written, the one-line observation extracted, and whether anything is proposed
for promotion. Do not commit to the vault's git repo unless the user asks.

## Scoping

Before proposing a promotion to `playbooks/`, apply the vault's scoping ladder: project →
stack → taste, **default narrowest**. Most captures are stack-level at best. A single
example is evidence, not a pattern; two independent occurrences are the bar for a playbook.
