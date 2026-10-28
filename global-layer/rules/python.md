---
paths:
  - "**/*.py"
---

# Python

## Dependencies

- Standard library first. `pathlib`, `dataclasses`, `json`, `sqlite3`, `argparse`,
  `http.server`, `unittest`, `subprocess` cover a great deal before anything needs installing.
- Don't add a third-party package without asking, and don't assume one is available because
  it's popular. Check `pyproject.toml` / `requirements.txt` / imports actually in use.
- If a project has no dependency manifest at all, treat that as deliberate.

## Style

- Follow the file you're editing: its import grouping, its type-annotation level, its docstring
  convention. Don't annotate or document code you didn't change.
- Don't run `black`, `ruff format`, or `isort` unless the project has adopted that tool — a
  config in `pyproject.toml`, `ruff.toml`, or `setup.cfg`. Reformatting an unadopted project
  buries a one-line change in a 400-line diff.
- `pathlib` over `os.path` in new code. f-strings over `%` and `.format()`.
- Narrow `except` clauses. A bare `except:` or a blanket `except Exception` that swallows and
  continues hides the bug you were asked to fix.

## Tests

- Put tests where the project already puts them, named the way it already names them. Match
  `unittest` vs `pytest` to what's there; don't introduce the other one.
- Run them. Use the project's own command if it has one (a `Makefile`, a `*.cmd` wrapper, a
  `pyproject` script) rather than inventing an invocation.
- `python -m py_compile <file>` is the cheap syntax gate when a full test run isn't practical.

## Correctness

- Mutable default arguments, late-binding closures in loops, and shadowing a stdlib module name
  with a local filename are the three that silently cost the most time. Watch for them.
- Prefer explicit `encoding="utf-8"` on file opens. The Windows default is cp1252 and will
  raise on text that worked everywhere else.
