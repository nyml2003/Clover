import path from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

import { build } from "esbuild";

import {
  ROOT,
  kebabCase,
  loadJsonObject,
  mergeObjects,
  readObject,
  readString,
  run
} from "./shared.js";

const require = createRequire(import.meta.url);
const DTS_BUNDLE_GENERATOR_BIN = require.resolve("dts-bundle-generator/dist/bin/dts-bundle-generator.js");

function defaultEntry(cwd: string): string {
  for (const candidate of ["src/index.ts", "index.ts"]) {
    const absolute = path.join(cwd, candidate);
    if (existsSync(absolute)) {
      return candidate;
    }
  }

  throw new Error("Could not find build entry. Expected src/index.ts or index.ts");
}

function appendFlags(command: string[], options: Readonly<Record<string, unknown>>): void {
  for (const [key, value] of Object.entries(options)) {
    if (value === null || value === undefined) {
      continue;
    }

    const flag = `--${kebabCase(key)}`;
    if (typeof value === "boolean") {
      command.push(value ? flag : `${flag}=false`);
      continue;
    }
    if (typeof value === "string" || typeof value === "number") {
      command.push(`${flag}=${value}`);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item !== "string" && typeof item !== "number") {
          throw new Error(`Unsupported array value for ${key}`);
        }
        command.push(`${flag}=${item}`);
      }
      continue;
    }

    throw new Error(`Unsupported option type for ${key}`);
  }
}

function loadBuildConfig(cwd: string): {
  entry: string;
  outfile: string;
  tsconfig: string;
  esbuild: Readonly<Record<string, unknown>>;
  dts: Readonly<Record<string, unknown>>;
} {
  const rootPackage = loadJsonObject(path.join(ROOT, "package.json"));
  const packageJson = loadJsonObject(path.join(cwd, "package.json"));
  const defaults = readObject(rootPackage, "cloverBuildDefaults");
  const overrides = readObject(packageJson, "cloverBuild");
  const config = mergeObjects(defaults, overrides);

  const entry = typeof config["entry"] === "string" ? config["entry"] : defaultEntry(cwd);
  const outfile = typeof config["outfile"] === "string" ? config["outfile"] : "dist/index.js";
  const tsconfig = typeof config["tsconfig"] === "string" ? config["tsconfig"] : "tsconfig.json";
  const esbuildOptions = readObject(config as Readonly<Record<string, unknown>>, "esbuild");
  const dtsOptions = readObject(config as Readonly<Record<string, unknown>>, "dts");

  return { entry, outfile, tsconfig, esbuild: esbuildOptions, dts: dtsOptions };
}

function resolveInputsFromArgs(cwd: string, args: readonly string[]): {
  entry: string;
  outfile: string;
  tsconfig: string;
  esbuild: Readonly<Record<string, unknown>>;
  dts: Readonly<Record<string, unknown>>;
} {
  if (args.length === 0) {
    return loadBuildConfig(cwd);
  }
  if (args.length === 3) {
    const [entry, outfile, tsconfig] = args;
    return {
      entry: readString(entry, "entry"),
      outfile: readString(outfile, "outfile"),
      tsconfig: readString(tsconfig, "tsconfig"),
      esbuild: {},
      dts: {}
    };
  }

  throw new Error("Usage: pnpm exec tsx ./scripts/build-package.ts [<entry> <outfile> <tsconfig>]");
}

export async function buildPackage(cwd: string): Promise<void> {
  const { entry, outfile, tsconfig, esbuild: esbuildOptions, dts } = loadBuildConfig(cwd);
  const dtsOutfile = outfile.endsWith(".js") ? `${outfile.slice(0, -3)}.d.ts` : `${outfile}.d.ts`;
  const entryPath = path.join(cwd, entry);
  const outfilePath = path.join(cwd, outfile);
  const tsconfigPath = path.join(cwd, tsconfig);

  await build({
    absWorkingDir: cwd,
    entryPoints: [entryPath],
    outfile: outfilePath,
    tsconfig: tsconfigPath,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "es2024",
    packages: "external",
    minifySyntax: true,
    minifyWhitespace: true,
    legalComments: "none",
    ...esbuildOptions
  });

  const dtsCommand = [process.execPath, DTS_BUNDLE_GENERATOR_BIN, "--project", tsconfigPath];
  appendFlags(dtsCommand, dts);
  dtsCommand.push("--out-file", dtsOutfile, entry);
  run(dtsCommand, cwd);
}

async function main(): Promise<void> {
  const cwd = process.cwd();
  const { entry, outfile, tsconfig, esbuild: esbuildOptions, dts } = resolveInputsFromArgs(
    cwd,
    process.argv.slice(2)
  );
  const dtsOutfile = outfile.endsWith(".js") ? `${outfile.slice(0, -3)}.d.ts` : `${outfile}.d.ts`;
  const entryPath = path.join(cwd, entry);
  const outfilePath = path.join(cwd, outfile);
  const tsconfigPath = path.join(cwd, tsconfig);

  await build({
    absWorkingDir: cwd,
    entryPoints: [entryPath],
    outfile: outfilePath,
    tsconfig: tsconfigPath,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "es2024",
    packages: "external",
    minifySyntax: true,
    minifyWhitespace: true,
    legalComments: "none",
    ...esbuildOptions
  });

  const dtsCommand = [process.execPath, DTS_BUNDLE_GENERATOR_BIN, "--project", tsconfigPath];
  appendFlags(dtsCommand, dts);
  dtsCommand.push("--out-file", dtsOutfile, entry);
  run(dtsCommand, cwd);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
