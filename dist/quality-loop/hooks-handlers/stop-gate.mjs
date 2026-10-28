#!/usr/bin/env node
/**
 * Stop gate.
 *
 * If code files were written this turn and nothing was ever run against
 * them, push back once instead of letting the turn end quietly.
 *
 * Loop safety: blocking clears the pending list, so the very next Stop
 * cannot block for the same reason. A later unverified edit can block
 * again, which is the point.
 */

import { basename } from "node:path";
import { readPayload, load, save } from "./lib/session-state.mjs";

function main() {
  const payload = readPayload();
  if (!payload) return null;

  const session = payload.session_id;
  if (!session) return null;

  // Plan mode is supposed to end without running anything.
  if (payload.permission_mode === "plan") return null;

  // Only gate a normal end of turn; a truncated or interrupted turn is not
  // a quality problem to lecture about.
  const reason = payload.stop_reason;
  if (reason && reason !== "end_turn") return null;

  const state = load(session);
  if (!state.pending.length) return null;

  const files = state.pending;

  state.pending = [];
  state.warnedAt = Date.now();
  save(session, state);

  const list = files
    .slice(0, 12)
    .map((f) => `  - ${basename(f)}  (${f})`)
    .join("\n");
  const more = files.length > 12 ? `\n  ...and ${files.length - 12} more` : "";

  return (
    "These files were written this session and nothing was ever run against them:\n" +
    `${list}${more}\n\n` +
    "Do not finish on an unverified change. Pick the evidence that fits:\n" +
    "  - logic: the project's own test command, or a targeted test run\n" +
    "  - UI: take a screenshot and actually look at it against the brief\n" +
    "  - at minimum: the syntax/type gate for the language\n\n" +
    "Then report what you ran and what it printed. If verification genuinely " +
    "is not possible here (no runner, needs Studio open, needs credentials), " +
    "say that plainly in one line and stop — do not claim it works."
  );
}

let reason = null;
try {
  reason = main();
} catch {
  reason = null;
}

if (reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}
process.exit(0);
