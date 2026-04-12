from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import time


ROOT = pathlib.Path(__file__).resolve().parent.parent


def normalize_command(command: list[str]) -> list[str]:
    if sys.platform == "win32" and command[0] == "pnpm":
        return ["pnpm.cmd", *command[1:]]

    return command


def run(command: list[str]) -> None:
    normalized = normalize_command(command)

    for attempt in range(3):
        completed = subprocess.run(normalized, check=False)

        if completed.returncode == 0:
            return

        time.sleep(1)

    raise subprocess.CalledProcessError(completed.returncode, normalized)


def load_json(path: pathlib.Path) -> dict[str, object]:
    loaded = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(loaded, dict):
        raise SystemExit(f"Expected JSON object in {path.as_posix()}")

    return loaded


def merge_objects(base: dict[str, object], override: dict[str, object]) -> dict[str, object]:
    merged = dict(base)

    for key, value in override.items():
        current = merged.get(key)
        if isinstance(current, dict) and isinstance(value, dict):
            nested_current = current
            nested_value = value
            merged[key] = merge_objects(nested_current, nested_value)
            continue

        merged[key] = value

    return merged


def load_object_field(source: dict[str, object], field_name: str) -> dict[str, object]:
    value = source.get(field_name)
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise SystemExit(f"`{field_name}` must be a JSON object")

    return value


def default_entry(cwd: pathlib.Path) -> str:
    candidates = ("src/index.ts", "index.ts")

    for candidate in candidates:
        if (cwd / candidate).exists():
            return pathlib.Path(candidate).as_posix()

    raise SystemExit("Could not find build entry. Expected src/index.ts or index.ts")


def load_build_config(cwd: pathlib.Path) -> dict[str, object]:
    root_package = load_json(ROOT / "package.json")
    package_json = load_json(cwd / "package.json")
    defaults = load_object_field(root_package, "cloverBuildDefaults")
    overrides = load_object_field(package_json, "cloverBuild")
    config = merge_objects(defaults, overrides)

    config.setdefault("entry", default_entry(cwd))
    config.setdefault("outfile", "dist/index.js")
    config.setdefault("tsconfig", "tsconfig.json")
    config.setdefault("esbuild", {})
    config.setdefault("dts", {})

    return config


def require_string(config: dict[str, object], key: str) -> str:
    value = config.get(key)
    if not isinstance(value, str):
        raise SystemExit(f"`{key}` must be a string")

    return pathlib.Path(value).as_posix()


def kebab_case(name: str) -> str:
    chars: list[str] = []

    for char in name:
        if char == "_":
            chars.append("-")
            continue
        if char.isupper():
            chars.append("-")
            chars.append(char.lower())
            continue
        chars.append(char)

    return "".join(chars)


def append_flags(command: list[str], options: dict[str, object]) -> None:
    for key, value in options.items():
        flag = f"--{kebab_case(key)}"

        if value is None:
            continue
        if isinstance(value, bool):
            command.append(flag if value else f"{flag}=false")
            continue
        if isinstance(value, (str, int, float)):
            command.append(f"{flag}={value}")
            continue
        if isinstance(value, list):
            for item in value:
                if not isinstance(item, (str, int, float)):
                    raise SystemExit(f"`{key}` array values must be scalar")
                command.append(f"{flag}={item}")
            continue

        raise SystemExit(f"Unsupported option type for `{key}`")


def resolve_build_inputs(cwd: pathlib.Path) -> tuple[str, str, str, dict[str, object], dict[str, object]]:
    if len(sys.argv) == 1:
        config = load_build_config(cwd)
    elif len(sys.argv) == 4:
        config = {
            "entry": sys.argv[1],
            "outfile": sys.argv[2],
            "tsconfig": sys.argv[3],
            "esbuild": {},
            "dts": {},
        }
    else:
        raise SystemExit(
            "Usage: python scripts/build_package.py [<entry> <outfile> <tsconfig>]"
        )

    esbuild_options = config.get("esbuild")
    dts_options = config.get("dts")
    if not isinstance(esbuild_options, dict):
        raise SystemExit("`esbuild` must be a JSON object")
    if not isinstance(dts_options, dict):
        raise SystemExit("`dts` must be a JSON object")

    entry = require_string(config, "entry")
    outfile = require_string(config, "outfile")
    tsconfig = require_string(config, "tsconfig")

    return entry, outfile, tsconfig, esbuild_options, dts_options


def main() -> int:
    cwd = pathlib.Path.cwd()
    entry, outfile, tsconfig, esbuild_options, dts_options = resolve_build_inputs(cwd)
    dts_outfile = outfile.removesuffix(".js") + ".d.ts"

    esbuild_command = ["pnpm", "exec", "esbuild", entry]
    append_flags(esbuild_command, esbuild_options)
    esbuild_command.append(f"--outfile={outfile}")
    run(esbuild_command)

    dts_command = [
        "pnpm",
        "exec",
        "dts-bundle-generator",
        "--project",
        tsconfig,
    ]
    append_flags(dts_command, dts_options)
    dts_command.extend(["--out-file", dts_outfile, entry])
    run(dts_command)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
