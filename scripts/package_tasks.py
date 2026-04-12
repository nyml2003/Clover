from __future__ import annotations

import json
import pathlib
import sys

import workflow


def package_name_from_dir(cwd: pathlib.Path) -> str:
    package_json = json.loads((cwd / "package.json").read_text(encoding="utf-8"))
    return package_json["name"]


def unittest_package(cwd: pathlib.Path, coverage: bool) -> None:
    test_dir = cwd / "test"
    if not test_dir.exists():
        return

    package_name = package_name_from_dir(cwd)
    workflow.build_targets([package_name])

    test_files = sorted(path.as_posix() for path in test_dir.glob("*.test.ts"))
    if not test_files:
        return

    command = [
        "pnpm",
        "exec",
        "vitest",
        "run",
        *test_files,
        "--environment",
        "node",
        "--pool",
        "threads",
    ]

    if coverage:
        command.append("--coverage")

    workflow.run(command)


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit(
            "Usage: python scripts/package_tasks.py <build|typecheck|lint|lint-fix|unittest|unittest-coverage>"
        )

    command = sys.argv[1]
    cwd = pathlib.Path.cwd()
    package_name = package_name_from_dir(cwd)

    if command == "build":
        workflow.build_targets([package_name])
        return 0

    if command == "typecheck":
        workflow.typecheck_targets([package_name])
        return 0

    if command == "lint":
        workflow.lint_targets([package_name], fix=False)
        return 0

    if command == "lint-fix":
        workflow.lint_targets([package_name], fix=True)
        return 0

    if command == "unittest":
        unittest_package(cwd, coverage=False)
        return 0

    if command == "unittest-coverage":
        unittest_package(cwd, coverage=True)
        return 0

    raise SystemExit(f"Unknown package task: {command}")


if __name__ == "__main__":
    raise SystemExit(main())
