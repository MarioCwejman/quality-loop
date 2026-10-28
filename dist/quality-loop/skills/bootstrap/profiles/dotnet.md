# Profile: C# / .NET

Triggered by `*.sln`, `*.csproj`, or `*.fsproj`.

## Establish the shape

- `dotnet --version` and `dotnet --list-sdks` — which SDKs are actually installed
- `*.sln` — the projects in the solution and their dependency direction
- Each `*.csproj`: `<TargetFramework>`, `<Nullable>`, `<LangVersion>`,
  `<TreatWarningsAsErrors>`, `<ImplicitUsings>`
- `Directory.Build.props` / `Directory.Packages.props` — settings and central
  package versions applied across projects, easy to miss and often the real source
  of truth
- `global.json` — a pinned SDK version. If present, the project is deliberate about
  which SDK it builds with.
- `*.sln` absent but a `*.csproj` present — a single-project repo; build the project
  directly.

`<Nullable>enable</Nullable>` changes what correct code looks like. Record it.

## Verification commands

```
dotnet build
dotnet test
dotnet format --verify-no-changes
```

Prefer the solution file when one exists; otherwise the project file. Record the
exact invocation, including a `-c Release` if the project's own scripts use it.

`dotnet build` is the type gate — in C# there is no cheap per-file syntax check
equivalent to `node --check`, so the global write gate does not cover this stack.
That is a real gap: a `.cs` edit is tracked as unverified until a build runs. Say so
in the profile rather than implying per-edit coverage exists.

`dotnet format` is adopted only if the project already uses it — look for an
`.editorconfig` with formatting rules, or a CI step invoking it. Do not introduce it.

## Test runner

Match what is referenced in the test project:

| Package reference | Runner |
|---|---|
| `xunit` | xUnit |
| `NUnit` | NUnit |
| `MSTest.TestFramework` | MSTest |

Write tests in the runner already present, in the existing test project, following
its existing naming. Do not add a second runner.

## Rules worth writing

Put in `.claude/rules/` scoped to the relevant paths:

- Nullable context and what it implies for new code
- Async conventions: whether `ConfigureAwait(false)` is used, whether sync-over-async
  is banned, cancellation-token threading
- Dependency-injection registration conventions and lifetimes
- Domain invariants — units, value objects, legal state transitions
- Which projects may reference which, if the solution enforces a direction
- Generated code directories (`obj/`, `bin/`, generated clients) that must not be
  edited

## Verification loop

- Console, library, or service with no UI: the loop is `dotnet build` plus
  `dotnet test`. There is nothing to screenshot; report it that way.
- ASP.NET serving pages or a Blazor app: start it with the project's own run command
  and use the Playwright loop from `profiles/node-web.md`.
- WinForms, WPF, MAUI: there is no reliable headless capture path here. Behaviour and
  appearance claims need the user to run it and look. Record that limitation
  explicitly instead of asserting the UI is correct.

## Reviewer

`code-reviewer` covers correctness, fake work, swallowed exceptions, and
over-engineering. The `.NET`-specific items worth a project agent: disposal of
`IDisposable`, async deadlock patterns, EF Core query materialisation, and any
domain invariant the generic reviewer cannot know.

## Prove it

Run `dotnet build` and report the warning and error counts verbatim. Run
`dotnet test` and report the pass/fail summary. If the SDK is missing or the build
fails for environmental reasons, say which — do not record the layer as verified.

## Traps
- An empty `catch { }`, or `catch (Exception)` that logs and continues.
- `async void` outside an event handler.
- `.Result` or `.Wait()` on a task — deadlock risk, and it hides the real error
  behind an `AggregateException`.
- Editing generated code under `obj/` or a generated API client.
- Adding a NuGet package without checking `Directory.Packages.props` for central
  version management, which will reject a version specified locally.
