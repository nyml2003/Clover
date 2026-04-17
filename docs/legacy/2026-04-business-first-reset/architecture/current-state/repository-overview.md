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
- 边界适配：Zod 解析桥接、CLI 渲染与 argv 处理、HTTP request / response 逻辑骨架
- 自动化基座：goal、config、policy、facts、执行图和最小执行器骨架
- 场景入口：repo command 骨架，负责把 CLI 和 automation 装起来
- 约束治理：tsconfig 预设、ESLint plugin、ESLint config
- 维护链路：测试、覆盖率、benchmark、构建脚本

按当前 `package.json` 状态看，仓库已经形成一条初步的消费边界：

- `@clover.js/protocol` 与 `@clover.js/std` 是当前最接近公开消费面的基础运行时层
- `@clover.js/zod`、`@clover.js/cli`、`@clover.js/automation`、`@clover.js/http`、`@clover.js/repo-command`、`@clover.js/eslint-plugin`、`@clover.js/eslint-config`、`@clover.js/tsconfig` 仍保留为仓库内配套能力

这意味着 Clover 当前不是“所有工作区包都准备对外稳定发布”，而是已经开始出现内外层次。

这一层次现在已经被显式写进：

- `docs/foundation/consumption-policy.md`
- 各包自己的 `README.md`

基础规范文档现在已收敛到 `docs/foundation/`：

- `foundation/sdk-spec.md`
- `foundation/stdlib-spec.md`
- `foundation/v8-design.md`
- `foundation/project-structure.md`

它们提供设计背景，但此前缺少一套把“愿景、现实、问题、演进”串起来的总览文档。
