# Clover

Clover 是一套面向现代 V8 的 TypeScript SDK + 代码规范。

它的主张很直接：

- 用 TypeScript 静态类型尽可能提前约束
- 边界层统一用 Zod 做解析、校验和归一化
- 运行时零成本或近零成本优先
- 核心域抛弃 `undefined` / `null`，统一使用 `None` 与固定 shape 错误对象
- 对象形状、数值域、调用点和数组元素种类都追求稳定与单态
- 只保留极薄运行时表面，不引入重型包装层

文档入口：

- [docs/sdk-spec.md](docs/sdk-spec.md)
- [docs/v8-design.md](docs/v8-design.md)
- [docs/stdlib-spec.md](docs/stdlib-spec.md)
- [docs/project-structure.md](docs/project-structure.md)

当前方向：

- 类型约束优先于运行时兜底
- Zod 只停留在边界层，不把 `ZodError` 或原始 schema 输出带进核心域
- `@clover/zod` 提供通用边界适配：`safeParse -> Result`、`optional/nullable -> None`
- `Option<T>` 统一建模为 `T | None`
- `Result<T, Code, Payload>` 统一建模为 `T | CloverError<Code, Payload>`
- 错误对象统一使用固定 shape：`{ __code__: Code; payload: Payload }`
- `payload` 只允许固定 shape 普通对象或 `string | number | boolean`
- 错误码通过函数或模块自己的 `as const` 枚举对象声明，再传给 `createError(...)`
- `@clover/cli` 提供 Node CLI 边界层：argv、render、stderr、exit code
- `@clover/tsconfig`、`@clover/eslint-plugin`、`@clover/eslint-config` 已把这套约束开始制度化
- `bench/` 先对真实 API 做最小 benchmark，不再只保留占位骨架
- 核心路径禁 `throw` / `try-catch` / `class` / `this`
- 高版本 ES 目标，尽量保留现代语法，让引擎直接优化
