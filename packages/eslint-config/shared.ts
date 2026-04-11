import js from "@eslint/js";
import parser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import type { ESLint } from "eslint";

type RuleLevel = "off" | "warn" | "error";
type FlatConfig = Record<string, unknown>;
type RuleConfig = RuleLevel | readonly [RuleLevel, ...unknown[]];

const tsLanguageOptions = {
  parser,
  parserOptions: {
    projectService: {
      allowDefaultProject: ["tests/*/*.ts", "bench/*.ts"]
    }
  },
  ecmaVersion: "latest",
  sourceType: "module"
};

const sharedErrorRules = {
  "clover/no-raw-create-error-code": "error",
  "clover/no-invalid-create-error-payload": "error",
  "clover/no-error-data-property": "error"
} satisfies Record<string, RuleConfig>;

const sharedCoreRules = {
  ...sharedErrorRules,
  "clover/enforce-import-direction": "error",
  "clover/max-file-lines": ["error", { max: 300 }],
  "clover/no-delete": "error",
  "clover/no-class-this": "error",
  "clover/no-for-in": "error",
  "clover/no-loose-equality": "error"
} satisfies Record<string, RuleConfig>;

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
  "@typescript-eslint/explicit-module-boundary-types": "error",
  "@typescript-eslint/no-explicit-any": "error"
} satisfies Record<string, unknown>;

export function defineCloverConfig(clover: ESLint.Plugin): {
  library: FlatConfig[];
  cli: FlatConfig[];
  tests: FlatConfig[];
  tooling: FlatConfig[];
  config: FlatConfig[];
} {
  const pluginSet = {
    clover,
    "@typescript-eslint": tsPlugin
  };

  const library: FlatConfig[] = [
    {
      files: [
        "packages/protocol/src/**/*.ts",
        "packages/std/src/**/*.ts"
      ],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...baseTsRules,
        ...sharedCoreRules,
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "clover/no-array-callback-iteration": "error",
        "clover/no-optional-properties": "error",
        "clover/no-core-exceptions": "error",
        "clover/no-core-zod-import": "error",
        "clover/no-default-export": "error",
        "clover/no-nullish-core": "error",
        "clover/no-regexp-runtime": "error"
      }
    },
    {
      files: ["packages/protocol/src/assert.ts"],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...baseTsRules,
        ...sharedCoreRules,
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "clover/no-array-callback-iteration": "error",
        "clover/no-optional-properties": "error",
        "clover/no-core-exceptions": "off",
        "clover/no-core-zod-import": "error",
        "clover/no-default-export": "error",
        "clover/no-nullish-core": "error",
        "clover/no-regexp-runtime": "error"
      }
    },
    {
      files: ["packages/zod/src/**/*.ts"],
      languageOptions: tsLanguageOptions,
      plugins: pluginSet,
      rules: {
        ...baseTsRules,
        ...sharedCoreRules,
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "clover/no-optional-properties": "error",
        "clover/no-core-exceptions": "error",
        "clover/no-core-zod-import": "off",
        "clover/no-default-export": "error"
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
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "clover/no-core-zod-import": "off",
        "clover/no-default-export": "error"
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
