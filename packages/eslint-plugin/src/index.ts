import type { ESLint } from "eslint";

import { noClassThis } from "./rules/no-class-this.js";
import { enforceImportDirection } from "./rules/enforce-import-direction.js";
import { maxFileLines } from "./rules/max-file-lines.js";
import { noArrayCallbackIteration } from "./rules/no-array-callback-iteration.js";
import { noCoreExceptions } from "./rules/no-core-exceptions.js";
import { noCoreZodImport } from "./rules/no-core-zod-import.js";
import { noDefaultExport } from "./rules/no-default-export.js";
import { noDelete } from "./rules/no-delete.js";
import { noErrorDataProperty } from "./rules/no-error-data-property.js";
import { noForIn } from "./rules/no-for-in.js";
import { noInvalidCreateErrorPayload } from "./rules/no-invalid-create-error-payload.js";
import { noLooseEquality } from "./rules/no-loose-equality.js";
import { noNullishCore } from "./rules/no-nullish-core.js";
import { noOptionalProperties } from "./rules/no-optional-properties.js";
import { noRegexpRuntime } from "./rules/no-regexp-runtime.js";
import { noRawCreateErrorCode } from "./rules/no-raw-create-error-code.js";

export const rules = {
  "enforce-import-direction": enforceImportDirection,
  "max-file-lines": maxFileLines,
  "no-array-callback-iteration": noArrayCallbackIteration,
  "no-class-this": noClassThis,
  "no-core-exceptions": noCoreExceptions,
  "no-core-zod-import": noCoreZodImport,
  "no-default-export": noDefaultExport,
  "no-delete": noDelete,
  "no-error-data-property": noErrorDataProperty,
  "no-for-in": noForIn,
  "no-invalid-create-error-payload": noInvalidCreateErrorPayload,
  "no-loose-equality": noLooseEquality,
  "no-nullish-core": noNullishCore,
  "no-optional-properties": noOptionalProperties,
  "no-regexp-runtime": noRegexpRuntime,
  "no-raw-create-error-code": noRawCreateErrorCode
} satisfies ESLint.Plugin["rules"];

const plugin = {
  meta: {
    name: "@clover.js/eslint-plugin"
  },
  rules
} satisfies ESLint.Plugin;

export default plugin;
