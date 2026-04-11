import type { ESLint } from "eslint";

import { noClassThis } from "./rules/no-class-this.js";
import { noCoreExceptions } from "./rules/no-core-exceptions.js";
import { noCoreZodImport } from "./rules/no-core-zod-import.js";
import { noDelete } from "./rules/no-delete.js";
import { noErrorDataProperty } from "./rules/no-error-data-property.js";
import { noForIn } from "./rules/no-for-in.js";
import { noInvalidCreateErrorPayload } from "./rules/no-invalid-create-error-payload.js";
import { noLooseEquality } from "./rules/no-loose-equality.js";
import { noOptionalProperties } from "./rules/no-optional-properties.js";
import { noRawCreateErrorCode } from "./rules/no-raw-create-error-code.js";

export const rules = {
  "no-class-this": noClassThis,
  "no-core-exceptions": noCoreExceptions,
  "no-core-zod-import": noCoreZodImport,
  "no-delete": noDelete,
  "no-error-data-property": noErrorDataProperty,
  "no-for-in": noForIn,
  "no-invalid-create-error-payload": noInvalidCreateErrorPayload,
  "no-loose-equality": noLooseEquality,
  "no-optional-properties": noOptionalProperties,
  "no-raw-create-error-code": noRawCreateErrorCode
} satisfies ESLint.Plugin["rules"];

const plugin = {
  meta: {
    name: "@clover/eslint-plugin"
  },
  rules
} satisfies ESLint.Plugin;

export default plugin;
