from __future__ import annotations

import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parent.parent
PACKAGES_DIR = ROOT / "packages"
NODE = ["node"]
ESLINT_BIN = str(ROOT / "node_modules" / "eslint" / "bin" / "eslint.js")
TSC_BIN = str(ROOT / "node_modules" / "typescript" / "lib" / "tsc.js")


def normalize_command(command: list[str]) -> list[str]:
    if sys.platform == "win32" and command[0] == "pnpm":
        return ["pnpm.cmd", *command[1:]]

    return command


def run(command: list[str], cwd: pathlib.Path = ROOT) -> None:
    subprocess.run(normalize_command(command), cwd=str(cwd), check=True)


def load_workspace_packages() -> dict[str, dict[str, object]]:
    packages: dict[str, dict[str, object]] = {}

    for package_dir in sorted(PACKAGES_DIR.iterdir()):
        package_json_path = package_dir / "package.json"
        if not package_json_path.exists():
            continue

        package_json = json.loads(package_json_path.read_text(encoding="utf-8"))
        package_name = package_json["name"]
        dependencies = package_json.get("dependencies", {})
        dev_dependencies = package_json.get("devDependencies", {})
        scripts = package_json.get("scripts", {})

        packages[package_name] = {
            "dir": package_dir,
            "dependencies": {**dependencies, **dev_dependencies},
            "scripts": scripts,
        }

    return packages


WORKSPACE_PACKAGES = load_workspace_packages()


def package_dir(package_name: str) -> pathlib.Path:
    package = WORKSPACE_PACKAGES[package_name]
    package_path = package["dir"]
    assert isinstance(package_path, pathlib.Path)
    return package_path


def package_has_script(package_name: str, script_name: str) -> bool:
    package = WORKSPACE_PACKAGES[package_name]
    scripts = package["scripts"]
    assert isinstance(scripts, dict)
    return script_name in scripts


def workspace_dependencies(package_name: str) -> list[str]:
    package = WORKSPACE_PACKAGES[package_name]
    dependencies = package["dependencies"]
    assert isinstance(dependencies, dict)

    internal: list[str] = []
    for dependency_name in dependencies:
        if dependency_name in WORKSPACE_PACKAGES:
            internal.append(dependency_name)

    return internal


def dependency_closure(targets: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []

    def visit(package_name: str) -> None:
        if package_name in seen:
            return

        seen.add(package_name)
        for dependency_name in workspace_dependencies(package_name):
            visit(dependency_name)
        ordered.append(package_name)

    for target in targets:
        visit(target)

    return ordered


def build_package_direct(package_name: str) -> None:
    cwd = package_dir(package_name)
    entry = "src/index.ts" if (cwd / "src/index.ts").exists() else "index.ts"

    run([sys.executable, str(ROOT / "scripts" / "clean_paths.py"), "dist", "types"], cwd)
    run(
        [
            sys.executable,
            str(ROOT / "scripts" / "build_package.py"),
            entry,
            "dist/index.js",
            "tsconfig.json",
        ],
        cwd,
    )


def typecheck_package_direct(package_name: str) -> None:
    run([*NODE, TSC_BIN, "-p", "tsconfig.json", "--noEmit"], package_dir(package_name))


def lint_package_direct(package_name: str, fix: bool = False) -> None:
    cwd = package_dir(package_name)
    candidates = ["src", "test", "index.ts", "shared.ts", "workspace.ts"]
    targets: list[str] = []
    package_root = cwd.relative_to(ROOT).as_posix()

    for candidate in candidates:
        if (cwd / candidate).exists():
            targets.append(f"{package_root}/{candidate}")

    if not targets:
        return

    config_path = ROOT / "packages" / "eslint-config" / "dist" / "index.js"
    if not config_path.exists() and package_name != "@clover/eslint-config":
        build_targets(["@clover/eslint-config"])

    config_argument = (
        str(config_path)
        if config_path.exists()
        else str(ROOT / "packages" / "eslint-config" / "workspace.ts")
    )

    command = [
        *NODE,
        ESLINT_BIN,
        "--config",
        config_argument,
        *targets,
        "--max-warnings=0",
    ]

    if fix:
        command.append("--fix")

    run(command, ROOT)


def build_targets(targets: list[str]) -> None:
    for package_name in dependency_closure(targets):
        if package_has_script(package_name, "build"):
            build_package_direct(package_name)


def typecheck_targets(targets: list[str]) -> None:
    for package_name in dependency_closure(targets):
        if package_has_script(package_name, "typecheck"):
            typecheck_package_direct(package_name)


def lint_targets(targets: list[str], fix: bool = False) -> None:
    for package_name in targets:
        if package_has_script(package_name, "lint"):
            lint_package_direct(package_name, fix=fix)


def build_all() -> None:
    run([sys.executable, str(ROOT / "scripts" / "clean_generated_sources.py")])
    build_targets([name for name in WORKSPACE_PACKAGES if package_has_script(name, "build")])


def typecheck_all() -> None:
    typecheck_targets([name for name in WORKSPACE_PACKAGES if package_has_script(name, "typecheck")])


def lint_all() -> None:
    lint_targets([name for name in WORKSPACE_PACKAGES if package_has_script(name, "lint")])
    run(
        [
            *NODE,
            ESLINT_BIN,
            "--config",
            str(ROOT / "packages" / "eslint-config" / "workspace.ts"),
            "bench",
            "tests",
            "--max-warnings=0",
        ],
        ROOT,
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
