# goi for Zed

Syntax highlighting, bracket matching, indentation, an element outline and a
language server for `.goi` design files.

## What it gives you

| Feature | Source |
|---|---|
| Highlighting | `languages/goi/highlights.scm` |
| Bracket matching (and rainbow brackets) | `languages/goi/brackets.scm` |
| Indent after `{` | `languages/goi/indents.scm` |
| Outline panel (Window › Column › Card › …) | `languages/goi/outline.scm` |
| Language name, `.goi` suffix, `//` comments | `languages/goi/config.toml` |
| Diagnostics, completion, hover, go-to-definition | `cmd/goipls` |
| Icon name completion (Material Symbols) | `cmd/goipls` + `internal/text` |
| `app.` / `window.` global completion | `cmd/goipls` |
| Window chrome docs (`disableResize`, `fullscreen`, size limits) | `cmd/goipls` |
| `.goi` file icon | `icons/` + `icon_themes/goi.json` |

An import names its alias first (`import Sidebar "./Sidebar.goi"`), element
names read as types, property names as fields, and value identifiers
(`filled`, `primary`, `dark_mode`) as constants, because those are names the
framework resolves rather than variables. A `bridge` block reads as Go fields:
`OnOpen func(id string)` as a function, `Count int` as a field with a type, and
an event property (`onClick: bridge.OnOpen(row.ID)`) as a handler call. Row
types declared with `type` read as types too, and a fragment's
`props { Title string }` block reads as its inputs. `if`, `else`, `for`,
`range`, `switch`, `case` and `default` are keywords, and `formatf`, `len`,
`cap`, `min` and `max` are builtins.

The language server is the same parser and schema the runtime uses, so a design
that draws also type-checks: diagnostics land on the property they blame, even
when it lives in an imported fragment. Completion knows the element you are
inside, the values a property accepts, the theme's colour roles and the `id`s the
file declares. A colour position accepts the Material roles plus any name the app
defines at runtime with `ui.SetCustomColor` (`color: myBrand`), so hover says
which of the two a word is instead of calling an unknown one an error. Hover on a
`Window` property explains the native window too: the size limits, and what
`disableResize` and `fullscreen` do at runtime. An `icon`/`trailingIcon`/`iconOn`/`iconOff` value completes to the
names the embedded Material Symbols font actually has, read out of the woff, so
the list cannot drift from what draws. `bridge.` and `props.` complete the
declarations the file makes with their Go type, a declaration's type position
completes Go's primitives and the declared types, an event property offers the
handler calls it can use, a value position offers the Go builtins (`formatf`,
`len`, `cap`, `min`, `max`), and `textDocument/formatting` lets Zed format on
save with the same rules as `goifmt`. Inside a
fragment instance — `Counter { … }` — it reads the imported file and completes
the props that fragment declares, the root properties the instance can override
and the slots it fills. Typing an expression offers the file's ids; after
`panel.` the element's properties complete. Hover explains a declaration, a shape
field, a loop variable and a fragment, and `Ctrl`-click on an `import` path, its
alias or an id jumps to its declaration.

## File icon

Zed draws file icons from icon themes, so the logo ships as a one-icon theme that
inherits every other icon from Zed's default. Select it once in `settings.json`:

```json
{
  "icon_theme": "Goi"
}
```

## Language server

The server is a Go binary, so it is not bundled with the extension. Install it
once and keep it on `PATH` (`~/.local/bin` is fine):

```sh
go install github.com/goi-gui/goi/cmd/goipls@latest
```

The module lives in a private repository, so set `GOPRIVATE=github.com/goi-gui/*`
(and have a git credential for it) before installing.

If Zed shows "goipls not found on PATH" in the language server menu, that
command has not run or its directory is not on `PATH`. Restart the server from
that menu after reinstalling.

`goipls` speaks Language Server Protocol over stdio, so any editor that can start
a stdio server can use it.

## Layout

```
├── extension.toml           # extension manifest: grammar + language server
├── src/lib.rs               # starts goipls from PATH; no other commands
├── languages/goi/           # language config and tree-sitter queries
├── icons/goi.svg            # file icon for .goi
├── icon_themes/goi.json     # registers that icon for the "goi" suffix
└── tree-sitter-goi/         # the grammar (grammar.js + generated src/parser.c)
```

The server itself is `cmd/goipls` in
[goi-gui/goi](https://github.com/goi-gui/goi) (transport and features live in
`internal/lsp`).

## Install locally

```sh
./install.sh
```

Then restart Zed. The status bar of a `.goi` file should read **Goi**.

The script compiles the grammar and the extension wasm itself and drops the
result into Zed's `extensions/installed/goi`. It exists because
`zed: install dev extension` currently fails here with
`compiling grammar 'goi'`: Zed asks clang for the deprecated `wasm32-wasi`
triple while its bundled wasi-sdk only ships `wasm32-wasip1`. The script also
creates the `wasm32-wasi` sysroot symlinks that fix that mismatch, so a later
`install dev extension` may work too.

Override the paths if yours differ:

```sh
WASI_SDK_PATH=/path/to/wasi-sdk ZED_EXTENSIONS=~/.local/share/zed/extensions ./install.sh
```

Re-run the script after editing `languages/goi/*.scm`, `grammar.js` or
`src/lib.rs`.

## Regenerating the grammar

The parser is checked in, so a fresh clone needs no Node. After editing
`grammar.js`:

```sh
cd tree-sitter-goi
npm install                     # provides the tree-sitter CLI
npx tree-sitter generate --abi 14   # 14, not 15: Zed's runtime accepts up to 14
npx tree-sitter test                # corpus in test/corpus/
npx tree-sitter parse <goi-repo>/examples/*/*.goi   # every design must parse with no ERROR
```

`--abi 14` matters: generating with the CLI default (15) makes Zed fail the
install with `compiling grammar 'goi'`.

## Publishing

Replace the `file://` repository in `extension.toml` with a real git URL that
contains the grammar at the top level (or add `path = "…"` inside that repo) and
pin a `rev`. Then follow Zed's extension publishing steps.

## Keeping it in sync with the language

The grammar mirrors `docs/SYNTAX.md`. If you add a literal form, an operator or
a declaration, update `grammar.js`, regenerate, and add a case to
`test/corpus/basic.txt` so the next change cannot silently break highlighting.
