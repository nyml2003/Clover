# Clover 维护 SOP

这份文件写给未来在这个仓库里继续工作的 agent 和维护者。

把 Clover 当作一个整体系统来维护，不要把它看成一堆彼此独立的小包。

## 1. 目标

维护 Clover 时，默认优先级如下：

1. 保持核心协议层足够小、足够稳。
2. 保持运行时行为显式、低成本。
3. 保持边界层和核心域分离。
4. 把设计主张尽量落进工具链，而不是只靠口头约束。
5. 保持文档和仓库当前真实状态一致。

## 2. 系统认知

进入仓库后，优先按这个顺序建立上下文：

1. `README.md`
2. `docs/README.md`
3. `docs/architecture/README.md`
4. `docs/foundation/consumption-policy.md`
5. `docs/foundation/versioning-policy.md`
6. `docs/foundation/sdk-spec.md`
7. `docs/foundation/v8-design.md`
8. `docs/foundation/stdlib-spec.md`
9. `docs/foundation/project-structure.md`

把 Clover 理解成五层：

- 协议核心层：`None`、`CloverError`、`Result`、brand 等共享协议
- 运行时库层：建立在协议之上的通用函数
- 边界适配层：把宿主输入翻译成 Clover 协议
- 治理层：`tsconfig`、ESLint plugin、ESLint config
- 验证与维护层：测试、benchmark、脚本、文档

不要先按包思考。先判断改动在系统里属于什么职责。

## 3. 不可破坏的约束

除非文件明确属于 tooling、test 或边界例外代码，否则默认遵守这些规则：

- 核心域不要把 `undefined` 或 `null` 当业务空值。优先用 `None` 和 `Option<T>`。
- 错误走返回值，不走普通控制流异常。优先用 `CloverError` 和 `Result<T, Code, Payload>`。
- 错误对象 shape 固定：`{ __code__: Code; payload: Payload }`
- 错误 payload 只允许标量或扁平对象
- 运行时代码避免 `class`、`this`、`delete`、`for...in`、`==`
- 保持对象 shape 稳定，不要引入动态字段抖动
- 不要让 `zod` 泄漏进核心运行时语义，Zod 属于边界层
- 不要把生成物写回 `src/`；运行时产物和声明都只进入 `dist/`

源码层约束补充：

- 仓库源码不保留 `.js` / `.mjs` 文件
- 仓库维护脚本统一使用 Python
- bench、配置和治理层源码统一使用 TypeScript
- `.js` 只允许出现在构建产物、类型导入后缀或运行时出口路径里

## 4. 变更分类

动手前，先判断任务属于哪一类：

- 协议变更：影响核心类型或共享运行时语义
- 运行时行为变更：影响 std 或通用数据流行为
- 边界变更：影响 Zod、CLI、宿主输入归一化
- 治理变更：影响 lint、tsconfig、验证规则或仓库策略
- 文档变更：解释现状、问题、设计或演进
- 性能变更：围绕 benchmark、分配、解析、热路径优化

如果一次改动跨多个类别，按这个顺序处理：

1. 协议
2. 运行时
3. 边界
4. 治理
5. 文档
6. benchmark

## 5. 标准执行流程

### 第一步：先建立事实

- 先读相关源码、测试和文档，再动手
- 先看 `git status --short`
- 先确认这次改动改的是设计、实现，还是只改文档
- 默认忽略 `examples/`，除非任务明确要求

### 第二步：先定义改动契约

在非琐碎改动里，先明确这几个问题：

- 这次改动影响了哪个系统约束？
- 这是协议决策、实现细节，还是工具规则？
- 它有没有新增公开行为？
- 它有没有改变错误码、payload shape、空值协议或输出类型？

如果答案是“有”，同一轮里必须更新相关文档。

### 第三步：在正确层级落改动

- 协议语义放在协议层，不要散落到叶子工具函数里
- 宿主输入解析放在边界层，不要塞进核心运行时
- 面向全局的规范优先落到 ESLint 或 tsconfig
- 不要靠继续加例外来掩盖架构漂移
- 包内统一检查优先通过各 package 自己的 `lint` / `typecheck` 脚本暴露，再由根工作流聚合

### 第四步：用测试锁定行为

只要行为变了，就要让测试反映出来。

优先补或改这些：

- 运行时和边界层单元测试
- ESLint 规则测试
- 包装配或发布相关的构建/集成预期
- 明确性能敏感时补 benchmark

### 第五步：同步文档

按变更类型更新文档：

- 系统级设计变化：更新 `docs/architecture/vision-and-principles/`
- 实现现实变化：更新 `docs/architecture/current-state/`
- 债务变化或路线变化：更新 `docs/architecture/issues-and-roadmap/`
- 规范合同本身变化：同步更新旧的 spec 文档，而不是只改 architecture 文档

不要让文档描述一个仓库里已经不存在的世界。

### 第六步：按正确顺序验证

默认按这个顺序跑：

1. `pnpm test`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm build`
5. `pnpm test:system`
6. `pnpm bench`，仅在性能敏感改动时需要
7. `pnpm release:check`，仅在发布前或稳定快照前需要

当前仓库已经有最小 CI，会按安装、测试、lint、typecheck、build 的顺序做基础验证。

### 第七步：收尾前复查

提交前至少复查这些问题：

- 有没有把 `null` / `undefined` 又带回核心 API？
- 有没有把边界层 concern 泄漏进 protocol 或 std？
- 有没有改变错误对象 shape 或错误码协议？
- 测试和文档有没有跟着代码一起更新？
- 有没有新增一个本该抽象成规则、却被写成一次性例外的逻辑？

## 6. 维护优先级

如果要排后续工作，默认按这个顺序：

1. 仓库可信度
2. 协议一致性
3. 包装配与复用质量
4. 工具链覆盖率
5. 性能验证深度

当前仓库的优先事项：

1. 明确哪些 workspace 包是内部用，哪些打算对外消费
2. 继续把更多设计主张工具化，而不是只写在文档里
3. 把最小 CI 扩展成更完整的系统级和发布前验证
4. 建立更稳定的 benchmark 与集成验证基线
5. 明确 release、版本和 breaking change 治理

## 7. 审查清单

每个非琐碎任务结束前，用这份清单过一遍：

- 这次改动符合 Clover 的系统模型，而不是只图局部方便
- 公开行为是显式的，并且有测试覆盖
- 错误协议和空值协议仍然一致
- 没有手改 `src/` 里的生成物
- `build`、`lint`、`test` 仍然能过
- `typecheck` 已执行
- 设计或行为变化时，文档已同步
- 如果触及解析、分支、分配或热路径，已经考虑 benchmark

## 8. 不要做的事

- 不要把 Clover 当普通工具函数仓库维护
- 不要为了方便增加会削弱协议模型的 API
- 不要复制已有例外来合理化新的漂移
- 不要只改代码不改文档
- 不要依赖隐藏的 workspace 耦合，除非任务明确就是内部孵化验证
- 不要让 `examples/` 反过来驱动系统设计

## 9. 完成定义

一个维护任务完成，至少要满足这些条件：

- 改动落在正确的架构层级
- 行为变化已经被测试覆盖，或明确说明这是纯文档任务
- 必要验证命令已按正确顺序执行
- 相关文档已经更新
- 没有引入新的隐性债务，或已经明确记录
- 最终结论里清楚说明剩余风险或后续事项
