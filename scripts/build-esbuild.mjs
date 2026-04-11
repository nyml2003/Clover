import { resolve } from "node:path";
import { build } from "esbuild";

const [entry, outfile] = process.argv.slice(2);

if (!entry || !outfile) {
  throw new Error("Usage: node scripts/build-esbuild.mjs <entry> <outfile>");
}

await build({
  entryPoints: [resolve(process.cwd(), entry)],
  outfile: resolve(process.cwd(), outfile),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2023",
  packages: "external"
});
