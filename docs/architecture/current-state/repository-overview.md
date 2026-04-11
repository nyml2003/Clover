# 仓库总览

当前 Clover 是一个 `pnpm` monorepo，主工作区集中在 `packages/*`。

主仓目前包含：

- `docs/`：规范、设计说明，以及现在新增的架构知识库
- `packages/`：协议、运行时、边界适配、约束治理相关工作区包
- `scripts/`：构建和清理脚本
- `bench/`：基于真实 API 的 benchmark

主线能力已经不是纯文档状态，而是有一套可运行、可测试、可构建的实现。

当前已形成的系统骨架包括：

- 协议核心：`None`、`Result`、`CloverError`、品牌类型、守卫
- 通用运行时：字符串、数字、对象、路径、URL、异步、结果组合等能力
- 边界适配：Zod 解析桥接、CLI 渲染与 argv 处理
- 约束治理：tsconfig 预设、ESLint plugin、ESLint config
- 维护链路：测试、覆盖率、benchmark、构建脚本

现有根文档仍以规范说明为主：

- `sdk-spec.md`
- `stdlib-spec.md`
- `v8-design.md`
- `project-structure.md`

它们提供设计背景，但此前缺少一套把“愿景、现实、问题、演进”串起来的总览文档。
