# 工程工作流

当前工程工作流围绕几条根级脚本组织：

- `pnpm build`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm bench`

仓库现在还带有一条最小 CI 流水线，覆盖：

- 安装
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## 1. 构建方式

当前构建采用两段式：

- `esbuild` 负责运行时代码输出
- `tsc --emitDeclarationOnly` 负责声明文件输出

这让 Clover 保持现代 ESM 输出，同时把类型产物单独控制在 `types/`。

## 2. 生成物管理

仓库维护脚本会在构建前清理历史生成物，避免源码目录和发布目录混杂。

当前约定是：

- 源码保留在 `src/`
- 运行时产物进入 `dist/`
- 声明产物进入 `types/`

## 3. 测试与解析方式

测试运行时直接把工作区包别名指向源码入口，而不是依赖发布产物。

这意味着：

- 单元测试更贴近源码
- 包间协作在测试阶段主要通过源码别名验证
- benchmark 则明确依赖构建产物

## 4. Lint 覆盖面

当前 lint 覆盖：

- `packages/`
- `scripts/`
- `bench/`
- 根级配置文件

同时忽略：

- `dist/`
- `types/`
- `coverage/`
- `examples/`

## 5. 当前验证快照

按 2026-04-12 这次审查时的状态：

- `pnpm test` 通过
- `pnpm lint` 通过
- `pnpm typecheck` 在没有 `dist/` 产物时也能独立通过
- `pnpm build` 通过

这说明当前工程链路已经具备基础自闭环能力，后续重点不再是修根级 `typecheck`，而是扩大系统级验证深度与发布准备度。
