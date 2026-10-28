# Profile: Python

Triggered by `pyproject.toml`, `requirements.txt`, `setup.py`, or a `*.py`
entrypoint.

## Establish what is actually installed

- Read `pyproject.toml` / `requirements.txt` / `Pipfile` / `environment.yml`
- **A project with no dependency manifest at all is deliberate.** Treat stdlib-only
  as a constraint to respect, not a gap to fill.
- Check for a virtual environment: `.venv/`, `venv/`, `Pipfile.lock`, `poetry.lock`,
  `uv.lock`. Note which interpreter the project expects.
- On this machine the interpreter may be `python`, `python3`, or `py`. Record which
  one resolves rather than assuming.

Never add a third-party package without asking, and never assume one is available
because it is popular. The stdlib covers a great deal first: `pathlib`,
`dataclasses`, `json`, `sqlite3`, `argparse`, `http.server`, `unittest`,
`subprocess`, `csv`, `urllib`.

## Verification commands

Prefer the project's own command. Look for a `Makefile`, a `*.cmd` or `*.sh`
wrapper, a `[tool.poetry.scripts]` or `[project.scripts]` entry, or a documented
command in the README.

Match the test runner already present — do not introduce the other one:

| Present | Command |
|---|---|
| `tests/` with `test_*.py` and `unittest` imports | `python -m unittest discover -s tests` |
| `pytest` in the manifest, `conftest.py` | `pytest` |
| Neither | Ask where tests should live before writing one |

`python -m py_compile <file>` is the cheap syntax gate when a full run is not
practical. The global write gate already runs a syntax-only `ast.parse` per file,
which writes no `__pycache__`.

## Formatters and linters

Only adopted ones:

| Config present | Tool is adopted |
|---|---|
| `ruff.toml`, `.ruff.toml`, `[tool.ruff]` in `pyproject.toml` | Ruff |
| `[tool.black]`, or `black` in dev deps | Black |
| `[tool.isort]`, `.isort.cfg` | isort |
| `mypy.ini`, `[tool.mypy]` | mypy |
| `pyrightconfig.json` | Pyright |

No config means not adopted. Running `black` or `ruff format` on an unadopted
project buries a one-line change in a four-hundred-line diff. The global gate
already conditions `ruff check` on exactly this.

## Rules worth writing

Put in `.claude/rules/` with `paths:` scoped to the Python tree — important in a
mixed repo where `**/*.py` would otherwise be wrong for a sibling frontend:

- Domain invariants. The ones that earn their place are concrete: units,
  representations, legal ranges, identity rules. "Money is integer cents; never a
  float" is a rule. "Uses a service layer" is not.
- The data model or schema if the project owns one, including the migration rule.
- Where tests live, what they are named, and the exact command to run them.
- Which directories are generated, vendored, or data and must not be edited — check
  `.gitignore` for these.
- Any pinned version and the reason for the pin.

Do not restate `~/.claude/rules/python.md`; it already carries stdlib-first,
`pathlib` over `os.path`, narrow excepts, mutable default arguments, late-binding
closures, and explicit `encoding="utf-8"`.

## The Windows encoding trap

The default text encoding here is cp1252, not UTF-8. A file read without an explicit
`encoding="utf-8"` will raise on text that worked on every other machine. If the
project reads or writes text files, make the explicit-encoding rule a project rule —
it is the single most common Windows-only failure in Python code.

## Verification loop

Python projects usually have no visual surface. When one does — a `http.server` or
Flask app serving pages — the loop is the Playwright loop from
`profiles/node-web.md`: start the project's own server command, navigate, screenshot
at two widths, read the console.

Otherwise the loop is the test command plus the syntax gate, and the honest report is
"tests pass, no visual surface to screenshot".

## Reviewer

`code-reviewer` handles correctness, fake work, swallowed exceptions, and
over-engineering. Generate a project agent only for domain invariants it cannot
know — a calculation that must match a reference implementation, a state model with
draft-versus-applied semantics, a schema contract.

## Prove it

Touch one `.py` file to trigger the global gate. Run the project's recorded test
command and report what it printed. If there are no tests, say that plainly and
record it in the profile as a known gap.

## Traps

- Shadowing a stdlib module with a local filename (`json.py`, `types.py`,
  `logging.py`). Silently costly.
- A bare `except:` or a blanket `except Exception` that swallows and continues — it
  hides the bug under investigation.
- Replacing a real calculation with a hardcoded constant or a mock while "getting it
  working". Flag unconditionally.
- Assuming `python` on PATH is the project's interpreter when a `.venv` exists.
