#!/usr/bin/env node
/**
 * PostToolUse observer for Bash and MCP calls.
 *
 * Notices when something was actually run — a test, a syntax gate, a
 * screenshot, a playtest — and clears the session's unverified-files list.
 * Writes nothing to stdout; the Stop gate is the only consumer.
 *
 * False positives here are harmless (a missed reminder); false negatives
 * would nag about work that was verified. So the patterns are generous.
 */

import { readPayload, markVerified } from "./lib/session-state.mjs";

/** Bash commands that count as having run something. */
const VERIFY_COMMAND = [
  /\b(pytest|jest|vitest|mocha|phpunit|rspec|ctest)\b/,
  /\bnode\s+--(test|check)\b/,
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?(test|check|lint|typecheck|build)\b/,
  /\b(dotnet|cargo|go)\s+(test|build|vet|check)\b/,
  /\bpython3?\s+-m\s+(unittest|pytest|py_compile|compileall)\b/,
  /\b(make|just)\s+(test|check|lint|build)\b/,
  /\.cmd\s+(test|check|lint|build)\b/,
  /\bgradlew?\b[^\n]*\b(test|build)\b/,
  /\b(tsc|mypy|pyright|ruff|eslint|biome|selene|stylua|luau-lsp|shellcheck)\b/,
  // Running a shell script - or parsing it with -n - is exercising it.
  /\b(bash|sh|zsh)\s+(-n\s+)?\S*\.(sh|bash)\b/,
  // Direct execution of a script is exercising it, same as above.
  /\b(python3?|py)\s+(-\S+\s+)*\S*\.py\b/,
  /\bnode\s+(--\S+\s+)*\S*\.(js|cjs|mjs)\b/,
];

/** MCP tools that produce evidence a human or the model can look at. */
const VERIFY_TOOL =
  /(screen_capture|screenshot|browser_snapshot|read_page|get_page_text|console_output|console_messages|read_network_requests|javascript_(tool|exec)|start_stop_play|execute_luau|preview_(inspect|snapshot|screenshot|logs|network))/i;

/**
 * Some browser tools carry the real action in their input rather than their
 * name — the in-app browser and Chrome extension both expose one `computer`
 * tool whose `action` says whether it screenshotted. Checking the name alone
 * misses those and the gate then nags about work that was looked at.
 */
const VERIFY_TOOL_ACTION = /^(screenshot|zoom)$/i;

function main() {
  const payload = readPayload();
  if (!payload) return;

  const tool = payload.tool_name ?? "";
  const session = payload.session_id;
  if (!session) return;

  if (tool === "Bash") {
    const cmd = payload.tool_input?.command;
    if (typeof cmd !== "string") return;
    const hit = VERIFY_COMMAND.find((re) => re.test(cmd));
    if (hit) markVerified(session, cmd.slice(0, 200));
    return;
  }

  if (!tool.startsWith("mcp__")) return;

  if (VERIFY_TOOL.test(tool)) {
    markVerified(session, tool);
    return;
  }

  const action = payload.tool_input?.action;
  if (typeof action === "string" && VERIFY_TOOL_ACTION.test(action)) {
    markVerified(session, `${tool} (${action})`);
  }
}

try {
  main();
} catch {
  /* never interfere with the tool call */
}
process.exit(0);
