#!/usr/bin/env python3
"""Fail when a .scm query names a node the grammar does not have.

Zed refuses to load a language at all when one query fails, and its only symptom
is a log line. Run this from install.sh after the grammar is generated.
"""
import json
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent
types = {n["type"] for n in json.loads((root / "tree-sitter-goi/src/node-types.json").read_text())}

# Node names appear as `(name`, `(name)` and inside field patterns.
node_re = re.compile(r"\(([A-Za-z_][A-Za-z0-9_]*)")

failed = False
for scm in sorted((root / "languages/goi").glob("*.scm")):
    body = scm.read_text()
    # Strip comments and string literals: `"{"` is a token, not a node.
    stripped = re.sub(r";[^\n]*", "", body)
    stripped = re.sub(r'"(?:\\.|[^"\\])*"', '""', stripped)
    named = {m.group(1) for m in node_re.finditer(stripped)}
    # `_` is the query wildcard and `_name` rules are hidden, so neither is a
    # node type the grammar publishes.
    named = {n for n in named if not n.startswith("_")}
    missing = sorted(named - types)
    if missing:
        failed = True
        print(f"{scm.name}: unknown node(s) {', '.join(missing)}", file=sys.stderr)

sys.exit(1 if failed else 0)
