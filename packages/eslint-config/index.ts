import clover from "@clover/eslint-plugin";

import { defineCloverConfig } from "./shared.js";

const { library, cli, tests, tooling, config } = defineCloverConfig(clover);

export { cli, library, tests, tooling };

export default config;
