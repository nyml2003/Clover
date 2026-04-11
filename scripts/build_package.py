from __future__ import annotations

import pathlib
import subprocess
import sys
import time


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


def main() -> int:
    if len(sys.argv) != 4:
        raise SystemExit(
            "Usage: python scripts/build_package.py <entry> <outfile> <tsconfig>"
        )

    entry = pathlib.Path(sys.argv[1]).as_posix()
    outfile = pathlib.Path(sys.argv[2]).as_posix()
    tsconfig = pathlib.Path(sys.argv[3]).as_posix()
    dts_outfile = outfile.removesuffix(".js") + ".d.ts"

    run(
        [
            "pnpm",
            "exec",
            "esbuild",
            entry,
            "--bundle",
            "--format=esm",
            "--platform=node",
            "--target=es2024",
            "--packages=external",
            "--minify-syntax",
            "--minify-whitespace",
            "--legal-comments=none",
            f"--outfile={outfile}",
        ]
    )

    run(
        [
            "pnpm",
            "exec",
            "dts-bundle-generator",
            "--project",
            tsconfig,
            "--out-file",
            dts_outfile,
            entry,
        ]
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
