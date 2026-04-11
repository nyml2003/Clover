import js from "@eslint/js";
import parser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
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

const baseTsRules = {
  ...js.configs.recommended.rules,
  "no-redeclare": "off",
  "no-undef": "off",
  "no-unused-vars": "off",
  "@typescript-eslint/no-redeclare": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_"
    }
  ],
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      disallowTypeAnnotations: false
    }
  ],
  "@typescript-eslint/no-explicit-any": "error"
} satisfies Record<string, unknown>;

export function defineCloverConfig(clover: ESLint.Plugin) {
  const pluginSet = {
    clover,
    "@typescript-eslint": tsPlugin
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
        ...baseTsRules,
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
        ...baseTsRules,
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
        ...baseTsRules,
        ...sharedCoreRules,
        "clover/no-core-zod-import": "off"
      }
    },
    {
      files: ["packages/zod/src/**/*.ts"],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...baseTsRules,
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
        ...baseTsRules,
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
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...baseTsRules
      }
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
