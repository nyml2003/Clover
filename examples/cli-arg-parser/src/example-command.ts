import { z } from "zod";

import { argument, command, option } from "./dsl.js";
import { parseCommandArgv } from "./parser.js";
import { type CommandValue } from "./types.js";

export const CreateAppCommand = command({
  name: "create-clover-app",
  summary: "Parse scaffold-style CLI arguments from a single Zod-backed DSL.",
  description:
    "The command does not touch the filesystem. It only normalizes argv and prints the typed result.",
  arguments: [
    argument({
      name: "name",
      schema: z
        .string()
        .min(1)
        .regex(/^[a-z][a-z0-9-]*$/)
        .describe("Project name in kebab-case.")
    })
  ] as const,
  options: [
    option({
      key: "template",
      long: "template",
      short: "t",
      valueName: "template",
      schema: z
        .enum(["react", "lib", "cli"])
        .default("react")
        .describe("Starter template to scaffold.")
    }),
    option({
      key: "packageManager",
      long: "package-manager",
      short: "p",
      valueName: "manager",
      schema: z
        .enum(["pnpm", "npm", "yarn"])
        .default("pnpm")
        .describe("Package manager command to print in the next step.")
    }),
    option({
      key: "output",
      long: "output",
      short: "o",
      valueName: "dir",
      schema: z
        .string()
        .min(1)
        .default(".")
        .describe("Destination directory for the generated project.")
    }),
    option({
      key: "retries",
      long: "retries",
      short: "r",
      valueName: "count",
      schema: z
        .coerce
        .number()
        .int()
        .min(0)
        .max(5)
        .default(2)
        .describe("Retry count for simulated post-create steps.")
    }),
    option({
      key: "force",
      long: "force",
      short: "f",
      schema: z.boolean().default(false).describe("Overwrite the output directory if it already exists.")
    })
  ] as const
});

export type CreateAppCommandValue = CommandValue<typeof CreateAppCommand>;

export function executeCreateAppCommand(args: readonly string[]) {
  return parseCommandArgv(CreateAppCommand, args);
}
