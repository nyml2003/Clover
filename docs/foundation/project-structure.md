# Clover 项目结构设计

## 1. 目标

这份文档定义 Clover 仓库的终态结构。

目标不是搭一个“什么都能装”的 monorepo，而是把 Clover 现在已经确定的几条主线拆成边界清晰的包：

- 协议层
- 标准库层
- Zod 边界适配层
- TS / ESLint 约束层
- 示例、基准和脚本层

设计目标：

- 依赖方向单向
- 边界层和核心层分离
- Zod 不污染核心标准库
- 自定义 lint 规则可独立演进
- benchmark 与示例不反向影响主包设计

## 2. 顶层目录

推荐结构：

```text
docs/
  README.md
  architecture/
  foundation/
    README.md
    sdk-spec.md
    stdlib-spec.md
    v8-design.md
    project-structure.md
    consumption-policy.md
    versioning-policy.md
    release-checklist.md

packages/
  protocol/
  std/
  zod/
  cli/
  tsconfig/
  eslint-plugin/
  eslint-config/

examples/
bench/
scripts/
```

说明：

- `docs/architecture/` 放当前架构知识库
- `docs/foundation/` 放基础规范与设计基线
- `packages/` 放可发布或可复用的工作区包
- `examples/` 放最小可运行示例
- `bench/` 放跨包 benchmark
- `scripts/` 放仓库维护脚本

源码层约束：

- 仓库源码统一使用 TypeScript
- 不在仓库中保留 `.js` / `.mjs` 源文件
- `.js` 仅允许作为构建产物和运行时出口文件存在于 `dist/`

## 3. 依赖方向

依赖关系必须固定为：

```text
protocol
  ^
  |
std
  ^
  |
zod
  ^
  |
cli

eslint-plugin
  ^
  |
eslint-config

examples / bench
  -> protocol / std / zod
```

规则：

- `protocol` 不依赖任何内部包
- `std` 只能依赖 `protocol`
- `zod` 可以依赖 `protocol` 和 `std`
- `eslint-plugin` 不依赖运行时包
- `eslint-config` 只包装规则组合，不承载业务逻辑
- `cli` 可以依赖 `protocol`、`std` 和 `zod`
- `examples` 和 `bench` 可以依赖主包，但主包绝不能反向依赖它们

## 4. 包职责

### 4.1 `packages/protocol`

定位：

- Clover 最小核心
- 协议、哨兵、品牌和核心 type/runtime 边界

应该包含：

- `None`
- `CloverError`
- `Brand`
- `Option<T>`
- `Result<T, Code, Payload>`
- 数值品牌类型
- `isNone`
- `isError`
- `isErrorPayload`
- `assertNever`

不应包含：

- Zod
- 字符串工具
- 路径工具
- 异步流工具
- 复杂对象工具

目标：

- 极小
- 稳定
- 低依赖
- 所有其他运行时包都可以建立在它之上

建议内部结构：

```text
packages/protocol/
  src/
    brand.ts
    sentinels.ts
    result.ts
    number.ts
    guard.ts
    assert.ts
    index.ts
  test/
  README.md
```

### 4.2 `packages/std`

定位：

- Clover 标准库实现
- 所有通用运行时函数的主包

应该包含：

- `string/`
- `number/`
- `object/`
- `result/`
- `async/`
- `path/`
- `url/`
- `guard/`
- `security/`
- `internal/`

规则：

- 只依赖 `protocol`
- 不直接依赖 `zod`
- 不引入宿主层大依赖
- 函数全部独立导出，不搞 `Utils` 容器对象

建议内部结构：

```text
packages/std/
  src/
    string/
    number/
    object/
    result/
    async/
    path/
    url/
    guard/
    security/
    internal/
    index.ts
  test/
  README.md
```

### 4.3 `packages/zod`

定位：

- Clover 的边界层适配包
- 统一承接 Zod -> Clover 协议的转换

应该包含：

- `safeParse` 结果转 `Result`
- `optional()` / `nullable()` -> `None`
- 宿主输入到固定 shape 的适配模板
- 环境变量、query、headers 等边界 helper

规则：

- 这是唯一允许直接依赖 `zod` 的主包
- 不把 `ZodError` 暴露给核心域
- 不把 Zod schema 变成核心业务模型

建议内部结构：

```text
packages/zod/
  src/
    result.ts
    option.ts
    env.ts
    http.ts
    query.ts
    index.ts
  test/
  README.md
```

### 4.4 `packages/tsconfig`

定位：

- 发布 Clover 的编译配置预设

建议包含：

- `base.json`
- `library.json`
- `node.json`
- `strict-core.json`
- `boundary-zod.json`

说明：

- `strict-core.json` 用于核心域
- `boundary-zod.json` 放宽边界层必须接触的宿主输入写法，但仍保持严格

### 4.5 `packages/eslint-plugin`

定位：

- 承载 Clover 自定义规则

优先要做的规则方向：

- 禁核心域 `undefined` / `null`
- 禁可选属性 `?`
- 禁 `delete`
- 禁 `class` / `this`
- 禁核心域 `throw` / `try-catch`
- 禁核心域直接依赖 `zod`
- 禁 `for...in`
- 禁 `==`

建议内部结构：

```text
packages/eslint-plugin/
  src/
    rules/
    index.ts
  test/
  README.md
```

### 4.6 `packages/eslint-config`

定位：

- 组合官方规则和 Clover plugin 规则

建议输出几套配置：

- `core`
- `boundary`
- `test`
- `bench`

说明：

- `core` 最严格
- `boundary` 允许 Zod、`unknown` 和边界转译代码
- `test` 允许更方便的断言写法
- `bench` 允许少量为了基准测试而存在的控制代码

## 5. 非包目录职责

### 5.1 `examples/`

定位：

- 用最小可运行样例验证 API 是否顺手
- 作为项目规范的示范代码

建议首批示例：

- `basic-result`
- `zod-boundary`
- `parse-url`
- `stream-query`

### 5.2 `bench/`

定位：

- 跨包 benchmark
- 验证 V8 友好写法是否真的保住性能

建议包含：

- 字符串扫描 benchmark
- 数字解析 benchmark
- `None` / `CloverError` 分支 benchmark
- path / query 解析 benchmark

规则：

- benchmark 不得反过来污染 API 设计
- 只有 profiler 或 benchmark 证明必要时，才引入更激进优化

### 5.3 `scripts/`

定位：

- 仓库维护
- 代码生成
- benchmark / lint / test 启动脚本

不建议放：

- 业务逻辑
- 运行时库函数

## 6. 包内文件风格

每个运行时包统一采用：

```text
package/
  src/
  test/
  README.md
```

规则：

- `src/index.ts` 只做稳定公共导出
- 复杂实现放分目录，不把全部函数堆到一个文件
- `test/` 跟包走，不做全仓库大杂烩测试目录
- 包内允许 `internal/`，但不对外导出

## 7. 第一阶段落地顺序

建议顺序：

1. `packages/protocol`
2. `packages/std`
3. `packages/zod`
4. `packages/tsconfig`
5. `packages/eslint-plugin`
6. `packages/eslint-config`
7. `examples/`
8. `bench/`

原因：

- 协议先定，标准库才不会漂
- 边界适配依赖协议和标准库
- lint 与 config 应建立在协议和目录边界明确之后
- benchmark 必须测真实 API，而不是猜测 API

## 8. 第一阶段最小骨架

如果现在就开始搭，我建议最小骨架先长这样：

```text
packages/
  protocol/
    src/
    test/
    README.md
  std/
    src/
    test/
    README.md
  zod/
    src/
    test/
    README.md
  tsconfig/
    README.md
  eslint-plugin/
    src/
    test/
    README.md
  eslint-config/
    README.md

examples/
  README.md
bench/
  README.md
scripts/
  README.md
```

这已经足够开始真正写代码，不需要再先搭一层额外框架。

## 9. 明确不做的结构

以下组织方式不建议采用：

- `src/utils/` 一个目录塞满所有函数
- `core/` 和 `shared/` 含义含混的大包
- `packages/all/` 聚合所有逻辑的超级包
- 把 Zod 直接塞进标准库主包
- 把 lint 规则直接写进应用代码目录
- 测试、示例、benchmark 混在同一个包里

## 10. 总结

Clover 的项目结构应该服务于它的技术路线，而不是服务于“以后可能方便”。

因此终态应该是：

- `protocol` 负责最小协议核心
- `std` 负责标准库实现
- `zod` 负责边界层适配
- `tsconfig` 和 `eslint-*` 负责把规则制度化
- `examples` 和 `bench` 负责验证 API 手感与性能结果

这套结构已经足够支撑你后面把 Clover 从规范文档推进成真正可用的 SDK。

当前实现优先级已经落为：

- `packages/protocol`
- `packages/std`
- `packages/zod`
- `packages/tsconfig`
- `packages/eslint-plugin`
- `packages/eslint-config`
- `bench/`

`examples/` 仍然可以继续扩，但当前阶段不再是阻塞项。

当前更重要的维护要求是：

- `packages/*/src` 只保留源码
- 构建产物只进入 `dist/`
- lint、typecheck、build 和 bench 都必须建立在干净工作树之上
