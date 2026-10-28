#!/usr/bin/env bash
# Package the global layer into a distributable plugin at dist/.
#
#   plugin-src/   hand-written manifests, README, LICENSE  (source of truth)
#   ~/.claude/    live skills, agents and hook scripts     (source of truth)
#   dist/         generated artifact                       (safe to delete)
#
# Re-run after changing a skill, agent or hook in ~/.claude, or after editing
# anything in plugin-src/. Idempotent: dist/ is rebuilt from scratch each time
# and nothing outside dist/ is written.
set -eu

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$HOME/.claude"
IN="$ROOT/plugin-src"
OUT="$ROOT/dist"
PLUGIN="$OUT/quality-loop"

SKILLS="bootstrap ingest vault-lint retro"
AGENTS="art-director code-reviewer luau-reviewer"
HOOKS="session-start stop-gate track-verification verify-edit"

missing=0

rm -rf "$OUT"
mkdir -p "$PLUGIN/skills" "$PLUGIN/agents" "$PLUGIN/hooks-handlers"

# --- hand-written manifests, README, LICENSE, marketplace -------------------
cp -r "$IN/." "$OUT/"

# --- skills -----------------------------------------------------------------
for s in $SKILLS; do
  if [ -d "$SRC/skills/$s" ]; then
    cp -r "$SRC/skills/$s" "$PLUGIN/skills/"
  else
    echo "MISSING skill: $SRC/skills/$s" >&2; missing=1
  fi
done

# --- agents -----------------------------------------------------------------
for a in $AGENTS; do
  if [ -f "$SRC/agents/$a.md" ]; then
    cp "$SRC/agents/$a.md" "$PLUGIN/agents/"
  else
    echo "MISSING agent: $SRC/agents/$a.md" >&2; missing=1
  fi
done

# --- hook handlers ----------------------------------------------------------
for h in $HOOKS; do
  if [ -f "$SRC/hooks/$h.mjs" ]; then
    cp "$SRC/hooks/$h.mjs" "$PLUGIN/hooks-handlers/"
  else
    echo "MISSING hook: $SRC/hooks/$h.mjs" >&2; missing=1
  fi
done
if [ -d "$SRC/hooks/lib" ]; then
  cp -r "$SRC/hooks/lib" "$PLUGIN/hooks-handlers/"
else
  echo "MISSING hook lib: $SRC/hooks/lib" >&2; missing=1
fi

echo "built: $PLUGIN"
if [ "$missing" -ne 0 ]; then
  echo "BUILD INCOMPLETE - see MISSING lines above" >&2
  exit 1
fi

# Fail loudly rather than shipping a package that will not load.
claude plugin validate "$PLUGIN" --strict
claude plugin validate "$OUT" --strict
