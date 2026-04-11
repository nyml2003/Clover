import parser from "@typescript-eslint/parser";
import clover from "../eslint-plugin/src/index.ts";

const tsLanguageOptions = {
  parser,
  ecmaVersion: "latest",
  sourceType: "module"
};

const jsLanguageOptions = {
  ecmaVersion: "latest",
  sourceType: "module"
};

const sharedErrorRules = {
  "clover/no-raw-create-error-code": "error",
  "clover/no-invalid-create-error-payload": "error",
  "clover/no-error-data-property": "error"
};

const sharedCoreRules = {
  ...sharedErrorRules,
  "clover/no-delete": "error",
  "clover/no-class-this": "error",
  "clover/no-for-in": "error",
  "clover/no-loose-equality": "error"
};

const pluginSet = {
  clover
};

export const library = [
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

export const cli = [
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

export const tests = [
  {
    files: ["packages/*/test/**/*.test.ts", "vitest.config.ts"],
    languageOptions: tsLanguageOptions,
    plugins: pluginSet,
    rules: {
      ...sharedErrorRules,
      "clover/no-loose-equality": "error"
    }
  }
];

export const tooling = [
  {
    files: [
      "packages/eslint-plugin/src/**/*.js",
      "packages/eslint-config/**/*.js",
      "scripts/**/*.mjs",
      "bench/**/*.mjs",
      "eslint.config.js"
    ],
    languageOptions: jsLanguageOptions
  }
];

const config = [
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

export default config;
