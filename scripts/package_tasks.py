from __future__ import annotations

import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def normalize_command(command: list[str]) -> list[str]:
    if sys.platform == "win32" and command[0] == "pnpm":
        return ["pnpm.cmd", *command[1:]]

    return command


def run(command: list[str], cwd: pathlib.Path) -> None:
    subprocess.run(normalize_command(command), cwd=str(cwd), check=True)


def build_package(cwd: pathlib.Path) -> None:
    package_json = cwd / "package.json"
    if not package_json.exists():
        raise SystemExit(f"Missing package.json in {cwd}")

    entry = "src/index.ts" if (cwd / "src/index.ts").exists() else "index.ts"
    run([sys.executable, "../../scripts/clean_paths.py", "dist", "types"], cwd)
    run([sys.executable, "../../scripts/build_package.py", entry, "dist/index.js", "tsconfig.json"], cwd)


def typecheck_package(cwd: pathlib.Path) -> None:
    run(["pnpm", "exec", "tsc", "-p", "tsconfig.json", "--noEmit"], cwd)


def lint_package(cwd: pathlib.Path) -> None:
    candidates = ["src", "test", "index.ts", "shared.ts", "workspace.ts"]
    targets: list[str] = []
    package_root = cwd.relative_to(ROOT).as_posix()

    for candidate in candidates:
        candidate_path = cwd / candidate
        if candidate_path.exists():
            targets.append(f"{package_root}/{candidate}")

    if not targets:
        return

    run(
        [
            "pnpm",
            "exec",
            "eslint",
            "--config",
            "packages/eslint-config/workspace.ts",
            *targets,
            "--max-warnings=0",
        ],
        ROOT,
    )


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/package_tasks.py <build|typecheck|lint>")

    command = sys.argv[1]
    cwd = pathlib.Path.cwd()

    if command == "build":
        build_package(cwd)
        return 0

    if command == "typecheck":
        typecheck_package(cwd)
        return 0

    if command == "lint":
        lint_package(cwd)
        return 0

    raise SystemExit(f"Unknown package task: {command}")


if __name__ == "__main__":
    raise SystemExit(main())
