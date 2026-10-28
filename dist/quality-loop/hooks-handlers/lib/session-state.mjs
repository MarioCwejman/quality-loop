/**
 * Per-session bookkeeping shared by the hooks.
 *
 * Tracks which code files were written but not yet verified, so the Stop
 * gate can notice a turn that ended without running anything.
 *
 * Every function swallows its own errors: a broken state file must never
 * take down an edit.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const DIR = join(homedir(), ".claude", "state", "sessions");
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PENDING = 40;

/** Extensions where "I wrote it" should imply "I ran something". */
const CODE_EXT = new Set([
  ".js", ".cjs", ".mjs", ".ts", ".mts", ".cts", ".tsx", ".jsx",
  ".py", ".lua", ".luau", ".cs", ".java", ".go", ".rs", ".rb", ".php",
  ".css", ".scss", ".sass", ".less", ".html", ".htm",
  ".svelte", ".vue", ".astro", ".sql", ".sh", ".ps1",
]);

export function needsVerification(ext) {
  return CODE_EXT.has(ext.toLowerCase());
}

export function readPayload() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function stateFile(sessionId) {
  const safe = String(sessionId ?? "").replace(/[^A-Za-z0-9_-]/g, "");
  return join(DIR, `${safe || "unknown"}.json`);
}

export function load(sessionId) {
  try {
    const s = JSON.parse(readFileSync(stateFile(sessionId), "utf8"));
    if (!Array.isArray(s.pending)) s.pending = [];
    return s;
  } catch {
    return { pending: [] };
  }
}

export function save(sessionId, state) {
  try {
    mkdirSync(DIR, { recursive: true });
    if (state.pending.length > MAX_PENDING) {
      state.pending = state.pending.slice(-MAX_PENDING);
    }
    writeFileSync(stateFile(sessionId), JSON.stringify(state), "utf8");
    prune();
  } catch {
    /* non-fatal */
  }
}

/** Record a file as written-but-unverified. */
export function markPending(sessionId, file) {
  const state = load(sessionId);
  if (!state.pending.includes(file)) state.pending.push(file);
  save(sessionId, state);
}

/** Something was run; the slate is clean. */
export function markVerified(sessionId, what) {
  const state = load(sessionId);
  state.pending = [];
  state.lastVerification = what;
  save(sessionId, state);
}

/** Drop stale session files so the directory does not grow without bound. */
function prune() {
  try {
    if (!existsSync(DIR)) return;
    const now = Date.now();
    for (const name of readdirSync(DIR)) {
      const p = join(DIR, name);
      try {
        if (now - statSync(p).mtimeMs > MAX_AGE_MS) rmSync(p, { force: true });
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }
}
