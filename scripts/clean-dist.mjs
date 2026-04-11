import { rmSync } from "node:fs";
import { resolve } from "node:path";

const targets = process.argv.slice(2);

if (targets.length === 0) {
  throw new Error("Missing paths to clean");
}

for (const target of targets) {
  rmSync(resolve(process.cwd(), target), {
    force: true,
    recursive: true
  });
}
