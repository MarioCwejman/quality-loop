---
name: retro
description: This skill should be used when the user wants to review how a working session went and capture what should change — triggers include "retro", "retrospective", "run a retro", "what did we learn", "capture lessons from this", "review this session", "that keeps happening", and at the end of a long or frustrating session. Extracts durable lessons, decides the narrowest layer each one belongs in, promotes a lesson to an enforced rule only on the second independent occurrence, and prunes rules that have gone stale.
---

# Retro

Review the work just done and decide what, if anything, should change so the same friction
does not recur.

## The two failure modes this guards against

1. **Nothing is captured**, so the same mistake is made in three months.
2. **Everything is captured**, so the rule layer fills with over-generalised advice drawn
   from one incident. Stale or wrong guidance is worse than none — it is followed
   confidently.

The second is the more common and more damaging. Be reluctant.

## Steps

### 1. Gather what actually happened

From the current session, and only from evidence — not from what should have happened:

- Commands that failed and had to be retried differently.
- Wrong assumptions that cost real time.
- Things that had to be discovered by probing because no rule recorded them.
- Anything the user had to correct more than once.
- Decisions made that a future session would need to know.

If the session was uneventful, say so and stop. A retro that invents lessons is worse than
no retro.

### 2. Classify each candidate

For every candidate lesson, answer both questions **before** deciding where it goes:

**Is it true beyond this instance?**

- Happened once → an **observation**. Goes to the vault's `retro/` as a dated note. Nothing
  else changes.
- Happened **twice independently** → a **rule**. Now it may be written into an enforcing
  layer.

Two occurrences in the same session, from the same root cause, is **one** occurrence. The
bar is independence, not repetition.

**What is the narrowest layer where it is still true?** Default to the narrowest:

| Scope | Lives in | Test |
|---|---|---|
| This repo only | that project's `.claude/rules/<topic>.md`, `paths:`-scoped | Would it be wrong in another repo of the same stack? |
| This stack | `~/.claude/rules/<stack>.md` | Would it be wrong in a different stack? |
| Any project | `~/.claude/CLAUDE.md` | Is it genuinely universal, or just feels like it? |
| Taste / reference | vault `playbooks/` | Is it judgment rather than a rule? |
| Environment trap | the project memory file for the active project | Is it about this machine, not the code? |

A project quirk promoted to the global layer becomes confident nonsense in the next
project. When torn between two levels, pick the narrower one; it can be promoted later when
a second project confirms it.

### 3. Prune before adding

Adding is the easy half. Before writing anything new, check what is already there:

- Read `~/.claude/rules/` and the active project's `.claude/rules/`.
- Flag any rule that is **contradicted** by what happened this session, **superseded** by a
  tool or version change, **duplicated** across layers, or that names a file, command or
  flag that no longer exists — verify these rather than assuming.
- Propose deletions explicitly. A rule nobody can justify should go.

Report pruning candidates even when there are no additions to make.

### 4. Propose, do not apply

Present findings as a numbered list, each with the exact target file and the exact text to
add or remove. Then let the user pick.

```
OBSERVATIONS (recorded, no rule change) — <n>
  1. <lesson> → vault retro/YYYY-MM-DD-<slug>.md

PROPOSED RULES (second occurrence, so they qualify) — <n>
  2. <lesson>
     where: <exact path>
     why narrowest: <reason this layer and not a broader one>
     text: <the actual lines>

PRUNE — <n>
  3. <path>:<lines> — <why it should go>

NOT PROMOTED (one occurrence only) — <n>
  4. <lesson> — recorded as an observation; promote if it recurs.
```

Apply only what the user approves. Write the vault `retro/` note regardless — that is a
record, not a rule change, and the vault's `CLAUDE.md` allows agents to write there freely.

### 5. Verify after applying

If a rule was added to a `paths:`-scoped file, confirm it loads: start a fresh
`claude -p` session, touch a matching file, and ask which rules are in context. A rule
with a wrong `paths:` glob is invisible and therefore worthless — and it will look
installed.

Report what you ran and what it printed.

## Note on the vault

The vault lives at `~/Documents/Vault` by default, and its `CLAUDE.md` is authoritative on
folder permissions. `retro/` is free to write. `playbooks/` and `references/` are
**propose-only** — route those through `inbox/` with a `promote-to:` field rather than
writing them directly.
