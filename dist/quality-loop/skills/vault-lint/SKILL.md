---
name: vault-lint
description: This skill should be used when the user wants to check or tidy their taste vault — triggers include "vault lint", "lint the vault", "check the vault", "tidy the vault", "clean up my inbox", "what is in my inbox", "is my vault a mess", and when the SessionStart hook has reported a vault inbox backlog. Audits the vault for missing frontmatter, missing provenance, stale inbox items, broken wiki-links, duplicates and orphaned assets, then reports findings and proposes filings without making curation decisions unilaterally.
---

# Lint the taste vault

Audit the taste vault — `~/Documents/Vault` by default — and report what needs attention.
If that directory does not exist, say so in one line and stop.

Read the vault's `CLAUDE.md` first — it defines folder meanings and write permissions, and it
is the authority if it disagrees with this skill.

## Stance

**This skill reports and proposes. It does not curate.** The curated layer (`references/`,
`playbooks/`, `assets/`) is valuable precisely because a human chose each entry. Moving
things there automatically would hollow that out.

So: **never delete anything, never promote anything, never rewrite an existing note's
content.** Adding missing frontmatter to a note that has none is the only in-place edit
allowed, and only with the user's go-ahead.

## Checks

Run these and report findings grouped by severity. Use `rg`/`grep` and `find` rather than
reading every file.

### Blocking — the note is unusable as-is

1. **Missing frontmatter.** Any `.md` outside the vault root with no `---` block.
2. **Missing provenance.** Anything in `references/` or `assets/**` with no `source:`.
   Per the vault's rules, `source: unknown` stated explicitly is acceptable; a *missing*
   field is not.
3. **Missing licence on third-party assets.** Anything in `assets/**` whose `source:` is a
   URL but has no `licence:`.

### Worth fixing

4. **Stale inbox.** Items in `inbox/` older than 21 days. These were captured and never
   filed, which usually means they were not worth keeping — say that plainly rather than
   proposing a filing for each.
5. **Inbox backlog.** More than 10 items in `inbox/`. Group them by theme so filing is one
   decision per theme instead of per file.
6. **Broken wiki-links.** `[[target]]` where no `target.md` exists anywhere in the vault.
   Distinguish two cases: a typo of an existing note (propose the fix) versus a deliberate
   placeholder for something unwritten (leave it — the vault's `CLAUDE.md` explicitly allows
   these).
7. **Duplicates.** Notes whose titles or `source:` values match. Propose merging into the
   older one; never merge automatically.
8. **Orphaned assets.** Binary files in `inbox/` or `assets/**` that no `.md` references.
9. **Notes with no observation.** A note whose body is only a title and a link — stored
   evidence with no extracted lesson. These are the ones most likely to be worthless later.

### Informational

10. **Promotion candidates.** `inbox/` notes carrying a `promote-to:` field. List them for
    the user to approve. Apply the scoping ladder — project → stack → taste, default
    narrowest — and require **two independent occurrences** before endorsing a `playbooks/`
    promotion. One example is evidence, not a pattern.
11. **Counts per folder**, so the shape of the vault is visible at a glance.

## Report format

```
Vault: <n> notes, <n> assets, inbox <n> items

BLOCKING (<n>)
  <path> — <what is missing>

WORTH FIXING (<n>)
  <path> — <finding, and the proposed action>

PROMOTION CANDIDATES (<n>)
  <path> — proposes <target>; <endorse / not yet: one occurrence only>

Nothing was changed.
```

Cap each group at the 10 most consequential items and say how many were omitted. A
forty-item list gets ignored, which makes it worse than a five-item one.

If the vault is clean, say so in one line. Do not manufacture findings to look thorough.

## Then

Offer the fixes as a numbered list the user can accept selectively. Apply only what they
pick. If they accept filings or frontmatter repairs, make them, then show `git status` in the
vault so they can see exactly what changed — but do not commit unless asked.
