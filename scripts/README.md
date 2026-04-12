# Scripts

放仓库维护脚本、生成脚本和自动化入口。

当前约定：

- `scripts/` 只放 Python 脚本
- 复杂工作流尽量收敛在 Python 入口里，而不是散在 `package.json`

当前主要入口：

- `workflow.py`：根级工作流入口，统一编排 `build`、`lint`、`typecheck`、`test`、`test-system`、`test-coverage`、`bench`、`release-check`
- `package_tasks.py`：包级脚本入口，供各工作区包复用 `build`、`typecheck`、`lint`、`lint:fix`、`unittest`、`unittest:coverage`
- `build_package.py`：单包构建入口，读取根 `package.json` 里的 `cloverBuildDefaults`，再合并包内 `package.json#cloverBuild` 覆盖；使用 `esbuild` 输出 `dist/index.js`，使用 `dts-bundle-generator` 输出 `dist/index.d.ts`
- `clean_paths.py`：按路径清理 `dist/`、`types/` 等生成物
- `clean_generated_sources.py`：清理误落进 `packages/*/src` 的 `.js` / `.d.ts` 生成文件

构建补充约定：

- 运行时代码和声明文件都只进入 `dist/`
- 声明 bundling 显式使用 `--disable-symlinks-following`，避免 workspace 链接被展开成非预期路径
- 包如果需要特殊构建参数，应通过 `package.json#cloverBuild` 显式声明，而不是继续往 Python 脚本里硬编码
