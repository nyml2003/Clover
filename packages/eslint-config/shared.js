import parser from "@typescript-eslint/parser";

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

export function defineCloverConfig(clover) {
  const pluginSet = {
    clover
  };

  const library = [
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

  const cli = [
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

  const tests = [
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

  const tooling = [
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

  return {
    library,
    cli,
    tests,
    tooling,
    config
  };
}
