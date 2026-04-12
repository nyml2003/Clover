from __future__ import annotations

import pathlib
import sys


PACKAGE_ROOTS = [
    pathlib.Path("packages/protocol/src"),
    pathlib.Path("packages/std/src"),
    pathlib.Path("packages/zod/src"),
    pathlib.Path("packages/cli/src"),
    pathlib.Path("packages/http/src"),
    pathlib.Path("packages/eslint-plugin/src"),
]

GENERATED_SUFFIXES = (".js", ".d.ts")


def main() -> int:
    cwd = pathlib.Path.cwd()

    for package_root in PACKAGE_ROOTS:
        absolute_root = cwd / package_root
        if not absolute_root.exists():
            continue

        for path in absolute_root.rglob("*"):
            if path.is_file() and path.name.endswith(GENERATED_SUFFIXES):
                path.unlink()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
