import parser from "@typescript-eslint/parser";
import type { ESLint } from "eslint";

type RuleLevel = "off" | "warn" | "error";
type FlatConfig = Record<string, unknown>;

const tsLanguageOptions = {
  parser,
  ecmaVersion: "latest",
  sourceType: "module"
};

const sharedErrorRules = {
  "clover/no-raw-create-error-code": "error",
  "clover/no-invalid-create-error-payload": "error",
  "clover/no-error-data-property": "error"
} satisfies Record<string, RuleLevel>;

const sharedCoreRules = {
  ...sharedErrorRules,
  "clover/no-delete": "error",
  "clover/no-class-this": "error",
  "clover/no-for-in": "error",
  "clover/no-loose-equality": "error"
} satisfies Record<string, RuleLevel>;

export function defineCloverConfig(clover: ESLint.Plugin) {
  const pluginSet = {
    clover
  };

  const library: FlatConfig[] = [
    {
      files: [
        "packages/protocol/src/**/*.ts",
        "packages/std/src/**/*.ts",
        "packages/zod/src/**/*.ts"
      ],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...sharedCoreRules,
        "clover/no-optional-properties": "error",
        "clover/no-core-exceptions": "error",
        "clover/no-core-zod-import": "error"
      }
    },
    {
      files: ["packages/protocol/src/assert.ts"],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...sharedCoreRules,
        "clover/no-optional-properties": "error",
        "clover/no-core-exceptions": "off",
        "clover/no-core-zod-import": "error"
      }
    }
  ];

  const cli: FlatConfig[] = [
    {
      files: ["packages/cli/src/**/*.ts"],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...sharedCoreRules,
        "clover/no-core-zod-import": "off"
      }
    },
    {
      files: ["packages/zod/src/**/*.ts"],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...sharedCoreRules,
        "clover/no-core-exceptions": "error",
        "clover/no-optional-properties": "error",
        "clover/no-core-zod-import": "off"
      }
    }
  ];

  const tests: FlatConfig[] = [
    {
      files: ["packages/*/test/**/*.test.ts", "tests/**/*.test.ts"],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...sharedErrorRules,
        "clover/no-loose-equality": "error"
      }
    }
  ];

  const tooling: FlatConfig[] = [
    {
      files: [
        "packages/eslint-plugin/src/**/*.ts",
        "packages/eslint-config/**/*.ts",
        "bench/**/*.ts",
        "tests/**/*.ts"
      ],
      languageOptions: tsLanguageOptions
    }
  ];

  const config: FlatConfig[] = [
    {
      ignores: [
        "**/node_modules/**",
        "**/dist/**",
        "**/types/**",
        "coverage/**",
        "examples/**"
      ]
    },
    ...library,
    ...cli,
    ...tests,
    ...tooling
  ];

  return {
    library,
    cli,
    tests,
    tooling,
    config
  };
}
