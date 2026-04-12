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

- [agent.md](agent.md)
- [docs/README.md](docs/README.md)
- [docs/architecture/README.md](docs/architecture/README.md)
- [docs/foundation/README.md](docs/foundation/README.md)

当前方向：

- 类型约束优先于运行时兜底
- Zod 只停留在边界层，不把 `ZodError` 或原始 schema 输出带进核心域
- `@clover.js/zod` 提供通用边界适配：`safeParse -> Result`、`optional/nullable -> None`
- `Option<T>` 统一建模为 `T | None`
- `Result<T, Code, Payload>` 统一建模为 `T | CloverError<Code, Payload>`
- 错误对象统一使用固定 shape：`{ __code__: Code; payload: Payload }`
- `payload` 只允许固定 shape 普通对象或 `string | number | boolean`
- 错误码通过函数或模块自己的 `as const` 枚举对象声明，再传给 `createError(...)`
- `@clover.js/cli` 提供 Node CLI 边界层：argv、render、stderr、exit code
- `@clover.js/http` 提供 HTTP 请求响应边界层：request / response 收敛、query / headers / cookies 解析、handler 骨架
- `@clover.js/tsconfig`、`@clover.js/eslint-plugin`、`@clover.js/eslint-config` 已把这套约束开始制度化
- `bench/` 先对真实 API 做最小 benchmark，不再只保留占位骨架
- 核心路径禁 `throw` / `try-catch` / `class` / `this`
- 高版本 ES 目标，尽量保留现代语法，让引擎直接优化
- `@clover.js/std` 现在已经覆盖 URL / 路径 / 查询字符串解析、轻量解析器组合子、安全类型转换和不可变数据操作
- 仓库源码层不再保留 `.js` / `.mjs` 文件，统一使用 TypeScript 源文件和构建产物分离
- 开发期维护脚本统一改为 Python，构建产物统一收敛到 `dist/index.js` 和 `dist/index.d.ts`
- 声明 bundling 通过 `dts-bundle-generator --disable-symlinks-following` 保持 workspace 解析稳定

当前包状态：

- 当前对外消费面以 `@clover.js/protocol` 和 `@clover.js/std` 为主
- `@clover.js/zod`、`@clover.js/cli`、`@clover.js/http`、`@clover.js/eslint-plugin`、`@clover.js/eslint-config`、`@clover.js/tsconfig` 目前仍按仓库内配套能力维护
