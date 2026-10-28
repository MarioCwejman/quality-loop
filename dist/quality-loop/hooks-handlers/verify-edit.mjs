#!/usr/bin/env node
/**
 * PostToolUse gate for Write/Edit.
 *
 * Checks the file that was just written and reports problems back as
 * additionalContext. Report-only by design:
 *   - never edits the file (auto-formatting a file Claude just wrote desyncs
 *     Claude's in-memory copy from disk and breaks the next edit)
 *   - never blocks
 *   - silent when there is nothing to say
 *
 * Only runs a tool when the project has adopted it (config file present) or
 * when the tool is universally safe for that file type. Always exits 0.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, basename, extname, sep } from "node:path";
import { homedir } from "node:os";
import { markPending, needsVerification } from "./lib/session-state.mjs";

const TIMEOUT_MS = 15000;
const MAX_CONTEXT = 9000; // additionalContext is capped at 10k

// Rokit shims are not always on the PATH that Claude Code inherited.
process.env.PATH = `${join(homedir(), ".rokit", "bin")}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`;

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    timeout: TIMEOUT_MS,
    shell: false,
    windowsHide: true,
  });
  if (r.error && r.error.code === "ENOENT") return { missing: true };
  if (r.error && r.error.code === "ETIMEDOUT") return { timedOut: true };
  if (r.error) return { missing: true };
  return {
    code: r.status,
    out: `${r.stdout ?? ""}${r.stderr ?? ""}`.replace(/\r\n?/g, "\n").trim(),
  };
}

/** Like run(), but feeds `input` on stdin instead of passing a path. */
function runWithInput(cmd, args, cwd, input) {
  const r = spawnSync(cmd, args, {
    cwd,
    input,
    encoding: "utf8",
    timeout: TIMEOUT_MS,
    shell: false,
    windowsHide: true,
  });
  if (r.error) return { missing: true };
  return {
    code: r.status,
    out: `${r.stdout ?? ""}${r.stderr ?? ""}`.replace(/\r\n?/g, "\n").trim(),
  };
}

function has(cmd) {
  const r = spawnSync(cmd, ["--version"], {
    encoding: "utf8",
    timeout: 8000,
    shell: false,
    windowsHide: true,
  });
  return !r.error;
}

/** Nearest ancestor containing any of the given markers. */
function findUp(startDir, markers) {
  let dir = startDir;
  for (let i = 0; i < 40; i++) {
    for (const m of markers) if (existsSync(join(dir, m))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function projectRoot(fileDir, cwd) {
  return findUp(fileDir, [".git", "package.json", "pyproject.toml", "default.project.json"]) || cwd || fileDir;
}

/** Roblox projects get Luau analysis; plain Lua (LuaJIT, Love2D, nvim) does not. */
function isRobloxProject(root) {
  if (!root) return false;
  for (const m of ["default.project.json", "rokit.toml", "wally.toml", "aftman.toml", "selene.toml"]) {
    if (existsSync(join(root, m))) return true;
  }
  return false;
}

const IGNORED_DIRS = new Set([
  "node_modules", ".venv", "venv", "__pycache__", ".git",
  "dist", "build", "vendor", ".next", "out", "coverage",
]);

function main() {
  const raw = readStdin();
  if (!raw.trim()) return [];

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return [];
  }

  const input = payload.tool_input ?? {};
  const file = input.file_path ?? input.notebook_path ?? input.path;
  if (typeof file !== "string" || !file) return [];
  if (!existsSync(file)) return [];
  try {
    if (!statSync(file).isFile()) return [];
  } catch {
    return [];
  }

  // Skip vendored / generated trees.
  if (file.split(/[\\/]/).some((part) => IGNORED_DIRS.has(part))) return [];

  const fileDir = dirname(file);
  const root = projectRoot(fileDir, payload.cwd);
  const ext = extname(file).toLowerCase();
  const name = basename(file);
  const findings = [];

  // Remember that this file was touched; the Stop gate asks about anything
  // still unverified when the turn ends.
  if (payload.session_id && needsVerification(ext)) {
    markPending(payload.session_id, file);
  }

  const report = (label, res) => {
    if (!res || res.missing) return;
    if (res.timedOut) {
      findings.push(`${label}: timed out after ${TIMEOUT_MS / 1000}s (not a code problem)`);
      return;
    }
    if (res.code !== 0 && res.out) findings.push(`${label} reported:\n${res.out}`);
    else if (res.code !== 0) findings.push(`${label} exited ${res.code} with no output`);
  };

  // ---- Shell ------------------------------------------------------------
  // `-n` parses without executing, so it is safe to run on any script.
  if ([".sh", ".bash"].includes(ext)) {
    const sh = ["bash", "sh"].find((c) => has(c));
    if (sh) {
      // Feed the script on stdin rather than by path. On Windows `bash` may
      // resolve to WSL, which reads a C:/ path as a Linux path and reports a
      // spurious "No such file or directory". stdin sidesteps that entirely;
      // the cost is that errors say "line N" without the filename, which is
      // fine because the file was just written.
      report(`${sh} -n`, runWithInput(sh, ["-n"], root, readFileSync(file, "utf8")));
    }
  }

  // ---- JavaScript -------------------------------------------------------
  if ([".js", ".cjs", ".mjs"].includes(ext)) {
    const res = run(process.execPath, ["--check", file], root);
    if (res.out) {
      // Drop the interpreter stack trace; keep the file/line and the message.
      res.out = res.out
        .split("\n")
        .filter((l) => !/^\s+at\s/.test(l) && !/^Node\.js v/.test(l))
        .join("\n")
        .replace(/\n{3,}/g, "\n")
        .trim();
    }
    report("node --check", res);
  }

  // ---- Python -----------------------------------------------------------
  if (ext === ".py") {
    const py = ["python", "python3", "py"].find((c) => has(c));
    if (py) {
      // ast.parse rather than py_compile: syntax-only, writes no __pycache__.
      const prog =
        "import ast,sys\n" +
        "p=sys.argv[1]\n" +
        "try:\n" +
        "    ast.parse(open(p,encoding='utf-8').read(),filename=p)\n" +
        "except SyntaxError as e:\n" +
        "    print('%s:%s:%s: %s' % (p, e.lineno, e.offset, e.msg))\n" +
        "    if e.text: print('    ' + e.text.rstrip())\n" +
        "    sys.exit(1)\n" +
        "except Exception as e:\n" +
        "    print('%s: %s' % (type(e).__name__, e))\n" +
        "    sys.exit(1)\n";
      report("python syntax check", run(py, ["-c", prog, file], root));
    }
    // ruff only where the project has adopted it.
    const ruffRoot = findUp(fileDir, ["ruff.toml", ".ruff.toml"]);
    const pyproject = findUp(fileDir, ["pyproject.toml"]);
    const adoptedRuff =
      ruffRoot ||
      (pyproject && /\[tool\.ruff/.test(safeRead(join(pyproject, "pyproject.toml"))));
    if (adoptedRuff && has("ruff")) {
      report("ruff check", run("ruff", ["check", "--no-cache", file], root));
    }
  }

  // ---- Luau / Lua -------------------------------------------------------
  if ([".luau", ".lua"].includes(ext)) {
    if (isRobloxProject(root)) {
      if (has("luau-lsp")) {
        const defs = ["globalTypes.d.luau", "globalTypes.d.lua"]
          .map((f) => join(root, f))
          .find((p) => existsSync(p));
        const args = ["analyze"];
        if (defs) args.push(`--definitions=${defs}`);
        args.push(file);
        const res = run("luau-lsp", args, root);
        // Its "no definitions file" warning is noise, not a code problem.
        if (res.out) {
          res.out = res.out
            .split("\n")
            .filter((l) => !/no definitions files are provided|No definitions file provided|sourcemap is disabled/i.test(l))
            .join("\n")
            .trim();
        }
        report("luau-lsp analyze", res);
      }
      // selene needs selene.toml to parse typed Luau at all; without it every
      // type annotation is reported as a false syntax error.
      if (existsSync(join(root, "selene.toml")) && has("selene")) {
        report("selene", run("selene", [file], root));
      }
      const styluaCfg = ["stylua.toml", ".stylua.toml"].some((f) => existsSync(join(root, f)));
      if (styluaCfg && has("stylua")) {
        report("stylua --check", run("stylua", ["--check", file], root));
      }
    }
  }

  // ---- JSON -------------------------------------------------------------
  if (ext === ".json") {
    const allowsComments =
      /^(tsconfig|jsconfig)/i.test(name) ||
      file.includes(`${sep}.vscode${sep}`) ||
      file.includes("/.vscode/");
    if (!allowsComments) {
      try {
        JSON.parse(readFileSync(file, "utf8"));
      } catch (e) {
        findings.push(`JSON parse failed: ${e.message}`);
      }
    }
  }

  return findings;
}

function safeRead(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

let findings = [];
try {
  findings = main();
} catch {
  findings = [];
}

if (findings.length) {
  let body = findings.join("\n\n");
  if (body.length > MAX_CONTEXT) body = `${body.slice(0, MAX_CONTEXT)}\n[truncated]`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext:
          "Automated check on the file you just wrote found problems. " +
          "Fix them deliberately — do not ignore them, and do not reformat " +
          "unrelated code while fixing.\n\n" +
          body,
      },
    })
  );
}
process.exit(0);
