# Clover 架构总览

这组文档把 Clover 当作一个整体系统来解释，而不是按单个包逐项罗列。

审查基线：

- 时间点：2026-04-12
- 代码状态：当前工作树
- 范围：主仓 `docs/`、`packages/`、`scripts/`、`bench/`
- 明确排除：`examples/`

阅读顺序：

1. `vision-and-principles/`
2. `current-state/`
3. `issues-and-roadmap/`

这套结构把最初想表达的四个维度压成连续叙事：

- “设计”进入 `vision-and-principles/`
- “目前实现”进入 `current-state/`
- “存在问题”和“未来演进”进入 `issues-and-roadmap/`

配套背景材料：

- [../../agent.md](../../agent.md)
- [../README.md](../README.md)
- [../foundation/sdk-spec.md](../foundation/sdk-spec.md)
- [../foundation/stdlib-spec.md](../foundation/stdlib-spec.md)
- [../foundation/v8-design.md](../foundation/v8-design.md)
- [../foundation/project-structure.md](../foundation/project-structure.md)

本目录负责回答三个问题：

- Clover 想成为什么
- Clover 现在实际上是什么
- Clover 接下来应该优先解决什么
