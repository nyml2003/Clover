from __future__ import annotations

import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parent.parent
PACKAGES = [
    "@clover/protocol",
    "@clover/std",
    "@clover/zod",
    "@clover/cli",
    "@clover/eslint-plugin",
    "@clover/eslint-config",
]
TYPECHECK_PACKAGES = PACKAGES


def run(command: list[str], cwd: pathlib.Path = ROOT) -> None:
    if sys.platform == "win32" and command[0] == "pnpm":
        command = ["pnpm.cmd", *command[1:]]

    subprocess.run(command, cwd=str(cwd), check=True)


def build_all() -> None:
    run([sys.executable, "./scripts/clean_generated_sources.py"])
    for package_name in PACKAGES:
        run(["pnpm", "--filter", package_name, "run", "build"])


def typecheck_all() -> None:
    for package_name in TYPECHECK_PACKAGES:
        run(["pnpm", "--filter", package_name, "run", "typecheck"])


def lint_all() -> None:
    for package_name in PACKAGES + ["@clover/tsconfig"]:
        run(["pnpm", "--filter", package_name, "run", "lint"])

    run(
        [
            "pnpm",
            "exec",
            "eslint",
            "--config",
            "packages/eslint-config/workspace.ts",
            "bench",
            "tests",
            "--max-warnings=0",
        ]
    )


def test_unit() -> None:
    run(
        [
            "pnpm",
            "exec",
            "vitest",
            "run",
            "--environment",
            "node",
            "--pool",
            "threads",
        ]
    )


def test_system() -> None:
    run(
        [
            "pnpm",
            "exec",
            "vitest",
            "run",
            "tests/system/system.test.ts",
            "--environment",
            "node",
            "--pool",
            "threads",
        ]
    )


def test_coverage() -> None:
    run(
        [
            "pnpm",
            "exec",
            "vitest",
            "run",
            "--environment",
            "node",
            "--pool",
            "threads",
            "--coverage",
        ]
    )


def run_bench() -> None:
    build_all()
    run(["pnpm", "exec", "tsx", "./bench/index.ts"])


def release_check() -> None:
    lint_all()
    typecheck_all()
    build_all()
    test_unit()
    test_system()
    run(["pnpm", "exec", "tsx", "./bench/index.ts"])


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit(
            "Usage: python scripts/workflow.py <build|typecheck|lint|test|test-system|test-coverage|bench|release-check>"
        )

    command = sys.argv[1]

    if command == "build":
        build_all()
        return 0
    if command == "typecheck":
        typecheck_all()
        return 0
    if command == "lint":
        lint_all()
        return 0
    if command == "test":
        build_all()
        test_unit()
        return 0
    if command == "test-system":
        build_all()
        test_system()
        return 0
    if command == "test-coverage":
        build_all()
        test_coverage()
        return 0
    if command == "bench":
        run_bench()
        return 0
    if command == "release-check":
        release_check()
        return 0

    raise SystemExit(f"Unknown workflow command: {command}")


if __name__ == "__main__":
    raise SystemExit(main())
