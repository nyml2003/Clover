from __future__ import annotations

import pathlib
import shutil
import sys


def main() -> int:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python scripts/clean_paths.py <path> [<path> ...]")

    cwd = pathlib.Path.cwd()

    for target in sys.argv[1:]:
        resolved = cwd / target
        if resolved.is_dir():
            shutil.rmtree(resolved, ignore_errors=True)
        elif resolved.exists():
            resolved.unlink()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
