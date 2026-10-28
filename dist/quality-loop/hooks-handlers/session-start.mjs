/**
 * SessionStart hook — orient at the top of a session.
 *
 * Three jobs, in priority order:
 *
 *   1. Report an AGENTS.md that is being silently suppressed by a CLAUDE.md.
 *      Claude reads AGENTS.md only when no CLAUDE.md exists in the working
 *      directory or above it, so this combination quietly discards the
 *      project's own instructions. It is the one failure worth interrupting
 *      for.
 *   2. Suggest /bootstrap when a real project has no instruction layer at all.
 *   3. Nudge when the vault inbox has piled up.
 *
 * Silent when there is nothing to say, and silent on any error. A session
 * must never fail to start because of this.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, parse as parsePath } from "node:path";
import { homedir } from "node:os";
import { readPayload } from "./lib/session-state.mjs";

const VAULT = join(homedir(), "Documents", "Vault");
const INBOX_NUDGE_AT = 10;

/** Markers that mean "this directory is a project", not a scratch folder. */
const PROJECT_MARKERS = [
  ".git",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "setup.py",
  "default.project.json",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Gemfile",
  "composer.json",
  "mix.exs",
  "CMakeLists.txt",
  "Makefile",
  "index.html",
];

const GLOB_MARKERS = [/\.sln$/i, /\.csproj$/i, /\.fsproj$/i, /\.rbxlx?$/i];

function looksLikeProject(dir) {
  if (PROJECT_MARKERS.some((m) => existsSync(join(dir, m)))) return true;
  try {
    return readdirSync(dir).some((n) => GLOB_MARKERS.some((re) => re.test(n)));
  } catch {
    return false;
  }
}

/**
 * The global memory file. It does NOT suppress AGENTS.md, and it lives inside
 * the upward walk for every project under the home directory, so it has to be
 * excluded explicitly or every project looks like a conflict.
 */
const GLOBAL_CLAUDE_MD = join(homedir(), ".claude", "CLAUDE.md");

/**
 * Find the nearest project-level CLAUDE.md at or above `dir`, walking to the
 * filesystem root. Returns its path, or null. This mirrors the rule that
 * actually governs AGENTS.md suppression.
 */
function findClaudeMdUpward(dir) {
  const { root } = parsePath(dir);
  let cur = dir;
  for (let i = 0; i < 40; i += 1) {
    for (const rel of ["CLAUDE.md", join(".claude", "CLAUDE.md")]) {
      const p = join(cur, rel);
      if (p !== GLOBAL_CLAUDE_MD && existsSync(p)) return p;
    }
    if (cur === root) break;
    const next = dirname(cur);
    if (next === cur) break;
    cur = next;
  }
  return null;
}

function countInbox() {
  try {
    const inbox = join(VAULT, "inbox");
    if (!existsSync(inbox)) return 0;
    return readdirSync(inbox).filter((n) => {
      if (n.startsWith(".")) return false;
      try {
        return statSync(join(inbox, n)).isFile();
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
}

function main() {
  const payload = readPayload();
  const cwd = payload?.cwd || process.cwd();
  const notices = [];

  const agents = join(cwd, "AGENTS.md");
  const hasAgents = existsSync(agents);
  const claudeMd = findClaudeMdUpward(cwd);
  const hasProfile = existsSync(join(cwd, ".claude", "project-profile.md"));
  const hasLocal = existsSync(join(cwd, "CLAUDE.local.md"));

  if (hasAgents && claudeMd) {
    notices.push(
      [
        `This project has an AGENTS.md, but \`${claudeMd}\` also exists.`,
        "Claude reads AGENTS.md only when no CLAUDE.md is present in the working",
        "directory or above it, so AGENTS.md is currently being ignored. Read it",
        "explicitly before relying on project conventions, and tell the user about",
        "the conflict — the fix is to merge the two or delete the CLAUDE.md.",
      ].join(" ")
    );
  } else if (hasAgents) {
    notices.push(
      "This project has an AGENTS.md. It is the source of truth for conventions" +
        " and verification commands. Do not create a CLAUDE.md here — that would" +
        " suppress it."
    );
  } else if (
    !claudeMd &&
    !hasProfile &&
    !hasLocal &&
    looksLikeProject(cwd)
  ) {
    notices.push(
      "This project has no AGENTS.md, CLAUDE.md, or .claude/project-profile.md." +
        " Suggest running the `bootstrap` skill to detect the stack and generate" +
        " a project layer. Mention it once; do not run it unprompted."
    );
  }

  const inbox = countInbox();
  if (inbox >= INBOX_NUDGE_AT) {
    notices.push(
      `The vault inbox (${VAULT}\\inbox) holds ${inbox} unfiled items.` +
        " Mention the `ingest` skill if the conversation reaches a natural pause."
    );
  }

  if (notices.length === 0) {
    process.exit(0);
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: notices.join("\n\n"),
      },
    })
  );
  process.exit(0);
}

try {
  main();
} catch {
  process.exit(0);
}
