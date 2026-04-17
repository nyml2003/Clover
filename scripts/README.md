# Scripts

放仓库维护脚本、生成脚本和自动化入口。

当前约定：

- `scripts/` 现在只放 TypeScript 脚本
- 这套脚本优先保持独立，不直接依赖当前工作区包实现
- 允许复制必要类型和方法，但复制后的实现由脚本体系自己维护

当前主要入口：

- `workflow.ts`：根级工作流入口，统一编排 `build`、`lint`、`typecheck`、`test`、`test-system`、`test-coverage`、`bench`、`release-check`
- `package-task.ts`：包级脚本入口，供各工作区包复用 `build`、`typecheck`、`lint`、`lint:fix`、`unittest`、`unittest:coverage`
- `build-package.ts`：单包构建入口，读取根 `package.json` 里的 `cloverBuildDefaults`，再合并包内 `package.json#cloverBuild` 覆盖；使用 `esbuild` 输出 `dist/index.js`，使用 `dts-bundle-generator` 输出 `dist/index.d.ts`
- `clean-paths.ts`：按路径清理 `dist/`、`types/` 等生成物
- `clean-generated-sources.ts`：清理误落进 `packages/*/src` 的 `.js` / `.d.ts` 生成文件
- `workflow-lib.ts` / `shared.ts`：脚本体系自己的共享实现，不依赖当前工作区包

构建补充约定：

- 运行时代码和声明文件都只进入 `dist/`
- 声明 bundling 显式使用 `--disable-symlinks-following`，避免 workspace 链接被展开成非预期路径
- 包如果需要特殊构建参数，应通过 `package.json#cloverBuild` 显式声明，而不是继续往脚本里硬编码
- `test`、`test:system`、`test:coverage`、`bench`、`unittest`、`unittest:coverage` 支持 `--ignore-build`，会直接使用当前 `dist`，跳过前置构建
