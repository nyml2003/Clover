# 工程工作流

当前工程工作流围绕几条根级脚本组织，这些 `pnpm` 命令都由 `scripts/workflow.py` 统一编排：

- `pnpm build`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm test:system`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm bench`
- `pnpm release:check`

同时，每个工作区包的常用脚本都统一委托给 `python ../../scripts/package_tasks.py`，因此 `pnpm --filter <package> run <script>` 和在包目录直接执行脚本行为保持一致。

构建默认值现在显式收敛在根 `package.json#cloverBuildDefaults`，如果单个包需要特殊打包参数，则通过包内 `package.json#cloverBuild` 覆盖。

仓库现在已经开始用一条新的入口链路：

- `pnpm lint` 已经切到 `repo-command -> automation -> lint:legacy`

同时还保留一组并行的新入口，用来继续试跑 `@clover.js/automation + @clover.js/repo-command`：

- `pnpm repo -- build <package>`
- `pnpm repo -- test <package>`
- `pnpm repo:lint`
- `pnpm repo:release-check`

当前状态是：

- `lint` 已开始走新链路
- `build`、`test`、`release-check` 仍保留 Python 主入口
- `lint:legacy` 保留作回退和内部转发

工作区包级统一入口现在固定为：

- `build`
- `typecheck`
- `lint`
- `lint:fix`
- `unittest`
- `unittest:coverage`

其中没有测试目录的包，`unittest` 和 `unittest:coverage` 会安全地作为 no-op 通过。

仓库现在还带有一条最小 CI 流水线，覆盖：

- 安装
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test:system`

## 1. 构建方式

当前构建采用两段式：

- `esbuild` 负责运行时代码输出到 `dist/index.js`
- `dts-bundle-generator` 负责单文件声明输出到 `dist/index.d.ts`
- 声明 bundling 显式使用 `--disable-symlinks-following`，避免 workspace 链接被展开成非预期路径

这让 Clover 保持现代 ESM 输出，同时把运行时和声明都收敛到 `dist/` 下的单文件产物。

## 2. 生成物管理

仓库维护脚本会在构建前清理历史生成物，避免源码目录和发布目录混杂。

当前约定是：

- 源码保留在 `src/`
- 运行时产物进入 `dist/index.js`
- 声明产物进入 `dist/index.d.ts`
- 仓库维护脚本统一使用 Python
- bench 和 lint 配置源码使用 TypeScript

## 3. 测试与解析方式

测试运行时先构建工作区包，再通过包入口验证运行时行为。

这意味着：

- 单元测试和系统测试都以构建产物和包入口为准
- benchmark 同样依赖构建产物
- 根层已经不再依赖单独的 Vitest 配置文件

## 4. Lint 覆盖面

当前 lint 覆盖：

- `packages/`
- `bench/`
- `tests/`

同时忽略：

- `dist/`
- `coverage/`
- `examples/`

## 5. 当前验证快照

按 2026-04-12 这次审查时的状态：

- `pnpm test` 通过
- `pnpm lint` 通过
- `pnpm typecheck` 在没有 `dist/` 产物时也能独立通过
- `pnpm build` 通过
- `pnpm test:system` 可在 build 后验证消费入口和系统装配
- `pnpm release:check` 提供发布前聚合检查入口

这说明当前工程链路已经具备基础自闭环能力，后续重点不再是修根级 `typecheck`，而是扩大系统级验证深度与发布准备度。
