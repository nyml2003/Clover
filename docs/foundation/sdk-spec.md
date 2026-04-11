# Clover SDK 规范

## 1. 项目定位

Clover 是一套以“运行时零成本优先、编译期约束前移”为核心立场的 TypeScript SDK + 代码规范。

它不是：

- 运行时工具函数大合集
- FP 包装器集合
- class 驱动的领域建模框架
- 靠异常和隐式空值维持流程的传统 JS 风格

它要做的是：

- 用 TS 静态类型约束变量、函数、对象形状、数值域和错误通道
- 让数据结构天然符合 V8 的优化预期
- 让核心逻辑接近“手写但可验证”的 JavaScript
- 把规范、SDK 类型面和静态检查策略合在一起设计

## 2. 设计公理

### 2.1 运行时零成本优先

Clover 的第一优先级是运行时零成本或接近零成本。

如果一个抽象会带来：

- 额外对象分配
- wrapper churn
- Hidden Class 不稳定
- 调用点多态化
- emitted JS 明显变重

那么它不应该进入 Clover 的主线设计。

### 2.2 编译期前移

能在编译期解决的问题，不留到运行期猜。

目标包括：

- 变量类型在定义处收紧
- 函数输入输出在签名处锁定
- 对象形状在类型层固定
- 数值域在类型层分层
- 空值和错误在类型层显式建模

### 2.3 编译时复杂度可控

编译时复杂度不是绝对禁区，但必须满足：

- 团队能稳定理解
- 编译耗时增长可控
- 编辑器体验不明显恶化
- 错误信息仍然可读
- 不把公共 API 变成类型体操入口

### 2.4 只允许极薄运行时表面

Clover 不追求“完全没有运行时值”，而是追求“没有多余运行时抽象”。

默认允许存在的运行时表面只有：

- `None` 单例哨兵
- 固定 shape `CloverError`
- 极薄的边界构造函数 / 断言函数
- 边界层 Zod schema

不允许演变成：

- `Option` 实例对象
- `Result` 链式对象 API
- class 层级
- 反射 / Proxy 驱动的运行时框架

## 3. 四大原则

### 3.1 类型原则

#### 3.1.1 用 TS 静态类型约束一切

以下内容都应优先在类型层建模：

- 变量
- 函数
- 对象形状
- 状态分支
- 错误通道
- 数值域

规则：

- 禁止 `any`
- `unknown` 只允许出现在边界输入
- 禁止依赖运行时猜类型维持主流程
- 禁止依赖隐式类型扩张让逻辑“自己工作”

#### 3.1.2 数值类型显式分层

Clover 不接受把所有数字都混成一个 `number` 心智模型。

至少区分三类：

- 小整数：以 V8 `Smi` 友好范围为目标
- 浮点数：`double` 路径，且显式排除 `NaN` / `Infinity`
- 大整数：`bigint`

推荐类型面：

```ts
export type Brand<T, Name extends string> = T & {
  readonly __brand: Name;
};

export type SmiInt = Brand<number, "SmiInt">;
export type Float64 = Brand<number, "Float64">;
export type FiniteFloat64 = Brand<number, "FiniteFloat64">;
export type BigIntInt = Brand<bigint, "BigIntInt">;
```

解释：

- `SmiInt` 的语义是“热路径整数值，必须来自受控小整数域”
- `Float64` 的语义是“允许走浮点路径的数值”
- `FiniteFloat64` 进一步排除 `NaN` 和 `Infinity`
- `BigIntInt` 与 `number` 严格分离

注意：

- TypeScript 不能单靠类型自动证明任意运行时结果仍然是 V8 `Smi`
- Clover 的要求是把 `Smi` 当作默认优化目标，并通过边界构造和 API 分层避免整数 / 浮点污染
- 动态输入若要进入这些类型，必须先经过边界校验或构造

#### 3.1.3 统一空值模型

Clover 在核心域彻底抛弃：

- `undefined`
- `null`
- 可选属性 `?`

统一规则：

- 空值只使用单例 `None`
- 可选值统一写成 `Option<T>`
- 结构体字段一律显式存在

推荐类型面：

```ts
export declare const None: unique symbol;
export type None = typeof None;
export type Option<T> = T | None;
```

规则：

- 禁止 `T | undefined`
- 禁止 `T | null`
- 禁止 `foo?: T`
- 热对象上的空槽位统一用 `None`

这样做的目的不是审美，而是：

- 统一空值判断语义
- 避免 JS 传统空值双轨制
- 让字段集合始终固定，帮助 Hidden Class 稳定

#### 3.1.4 错误是返回值，不是异常控制流

Clover 核心域默认不用：

- `Error`
- `throw`
- `try-catch`

统一规则：

- 错误是标记值
- 错误通过返回值传递
- 预期失败和业务失败不走异常通道

推荐类型面：

```ts
export type ErrorScalarPayload = string | number | boolean;
export type ErrorObjectPayload = Record<string, ErrorScalarPayload>;
export type ErrorPayload = ErrorScalarPayload | ErrorObjectPayload;

export type CloverError<
  Code extends number,
  Payload extends ErrorPayload
> = {
  __code__: Code;
  payload: Payload;
};

export type Result<
  T,
  Code extends number,
  Payload extends ErrorPayload
> = T | CloverError<Code, Payload>;
```

规则：

- 错误统一返回 `CloverError`
- `__code__` 必须来自函数或模块自己的 `as const` 错误码枚举对象
- 同一个函数的所有错误共享一种 `payload` 形态
- `payload` 只允许固定 shape 普通对象或 `string | number | boolean`
- 核心路径禁止把异常当普通分支机制

边界例外：

- 外部 API、JSON 解析、宿主环境调用若会抛错，必须在边界捕获并立即转译为 `CloverError`
- Zod 解析失败必须在边界立即转译成 `CloverError`，不能把 `ZodError` 透传进核心层
- 异常不能穿透进入核心域

#### 3.1.5 结构体形状固定

结构体必须固定 shape。

规则：

- 禁止动态增删字段
- 禁止 `delete`
- 禁止主对象携带动态 key
- 禁止同一类型对象在不同分支里出现不同字段集合

推荐：

```ts
type User = {
  id: UserId;
  name: string;
  email: Option<Email>;
  note: Option<string>;
};
```

不推荐：

```ts
type User = {
  id: UserId;
  name: string;
  email?: Email;
};
```

### 3.2 引擎优化原则

#### 3.2.1 追求调用点单态

一个热函数只处理固定形状、固定数值域、固定错误协议。

规则：

- 不让一个热函数同时吃多种互不相关的输入 shape
- 边界归一化后再进入核心逻辑
- 核心逻辑默认面向单态输入

#### 3.2.2 以 V8 `Smi` 为默认整数目标

热路径整数逻辑默认优先小整数域。

规则：

- 整数 API 不接受浮点污染
- 整数数组不混入非整数值
- 需要走浮点时，显式切换到 `Float64`
- 需要超大整数时，显式切换到 `BigIntInt`

#### 3.2.3 等值判断优先

在核心域，优先使用：

- `=== None`
- `error.__code__ === SomeErrorCode.SomeCase`
- 字面量 tag 比较

尽量少用：

- `typeof`
- `instanceof`
- 运行时反射式分派

说明：

- `typeof` / `instanceof` 主要保留给边界层
- 核心域应该在进入前就已经被类型和构造函数收紧

#### 3.2.4 函数极简、纯函数、可内联

默认风格：

- 小函数
- 纯函数
- 显式参数
- 无隐式上下文

规则：

- 禁止 `this`
- 禁止原型驱动分派
- 不用 class 层级表达业务状态
- 热路径避免闭包分配

说明：

- “禁止闭包”不是语言级禁令，而是热路径约束
- 一次性启动代码允许闭包
- 紧循环和核心调用链避免临时闭包

#### 3.2.5 禁止 Hidden Class 切换

以下行为在 Clover 核心域视为禁止：

- 动态加字段
- 动态删字段
- 同一变量在数字 / 对象 / 空值之间频繁切换
- 把同一结构体在不同分支构造成不同字段集合

### 3.3 语法与代码规范原则

#### 3.3.1 彻底避免上下文式设计

以下能力在 Clover 主规范中禁用：

- `this`
- `class`
- `bind`
- `call`
- `apply`

主风格统一为：

- 纯函数
- 参数传递
- 数据显式流动

#### 3.3.2 禁用高风险语法

以下语法或能力默认禁用：

- `==`
- `with`
- `for...in`
- `eval`
- 原型污染

说明：

- `for...of` 允许
- 普通索引循环允许
- `Object.prototype` / `Array.prototype` 等原型链修改一律禁止

#### 3.3.3 不变优先、只读优先

默认采用类型层不变约束：

- `readonly`
- `Readonly<T>`
- 受控不可变数据结构

规则：

- 默认先考虑不可变更新
- 不把“随手改对象”当常态
- 运行时不默认做 deep freeze，避免多余成本

也就是说：

- Clover 追求的是“类型只读优先”
- 不是“运行时冻结一切”

#### 3.3.4 不包装、不造多余运行时抽象

Clover 允许：

- 类型别名
- brand
- 极薄工具函数
- 单例哨兵

Clover 不允许：

- 普通可选值的包装对象
- 失败链式对象 API
- 额外 box / unbox 层
- 为了类型好看创建新运行时层

### 3.4 工程化原则

#### 3.4.1 用 TypeScript + ESLint 共同约束

职责划分：

- TypeScript 负责类型安全、值域、协议和对象形状
- ESLint 负责语法禁令、危险写法和风格一致性
- Zod 负责边界输入的解析、校验和归一化

#### 3.4.2 静态扫描优先

未来工具链允许加入 AST 级静态规则，用于检查：

- `SmiInt` 相关 API 的越界风险
- 浮点 / 整数混用
- `Option` / `Result` 误用
- 结构体 shape 稳定性
- 动态 key 或危险语法

注意：

- 这类规则是加分项
- Clover 的基础约束仍应在 `tsc + eslint` 上成立

#### 3.4.3 边界层统一使用 Zod

边界层默认校验器统一为 Zod。

适用场景：

- JSON 入站
- 环境变量读取
- URL / query / form 输入
- 第三方接口返回值
- 持久化层读出的松散数据

规则：

- 边界输入先过 Zod schema
- schema 输出必须立即转为 Clover 核心协议
- 不把 Zod schema 本身带入核心逻辑
- 不把 `ZodError` 带入核心逻辑

也就是说，Zod 在 Clover 中的角色是：

- 边界解析器
- 边界归一化器

而不是：

- 核心域模型
- 业务流程控制器
- 运行时对象系统

#### 3.4.4 高版本 ES 目标

默认目标：

- `ES2022+`
- 优先 `ES2023`
- 保留现代 ESM 输出

原因：

- 让引擎直接优化现代语法
- 避免冗余降级 helper
- 避免老旧兼容产物污染 shape 和调用路径

## 4. 规范化类型面

以下类型面可视为 Clover 的首批基础协议。

```ts
export type Brand<T, Name extends string> = T & {
  readonly __brand: Name;
};

export declare const None: unique symbol;
export type None = typeof None;
export type Option<T> = T | None;

export type ErrorScalarPayload = string | number | boolean;
export type ErrorObjectPayload = Record<string, ErrorScalarPayload>;
export type ErrorPayload = ErrorScalarPayload | ErrorObjectPayload;

export type CloverError<
  Code extends number,
  Payload extends ErrorPayload
> = {
  __code__: Code;
  payload: Payload;
};

export type Result<
  T,
  Code extends number,
  Payload extends ErrorPayload
> = T | CloverError<Code, Payload>;

export type SmiInt = Brand<number, "SmiInt">;
export type Float64 = Brand<number, "Float64">;
export type FiniteFloat64 = Brand<number, "FiniteFloat64">;
export type BigIntInt = Brand<bigint, "BigIntInt">;
```

解释：

- `None` 是全局单例哨兵
- `CloverError` 是固定 shape 的错误协议
- `Option<T>` 统一空值协议
- `Result<T, Code, Payload>` 统一返回式错误协议
- 数值域通过品牌类型分层

## 5. 边界层与核心层

### 5.1 边界层

边界层是唯一允许接触宿主杂质的地方。

包括：

- JSON
- DOM / Node API
- 环境变量
- 网络响应
- 数据库存取
- 第三方库返回值

边界层默认使用 Zod。

边界层允许：

- `unknown`
- `typeof`
- `instanceof`
- `try-catch`
- `undefined` / `null`
- `zod`

但要求：

- 当场收紧
- 当场归一化
- 当场转译到 Clover 核心协议
- 当场消化 `ZodError`

进入核心层前必须完成：

- 空值转 `None`
- 异常转 `CloverError`
- Zod 解析失败转 `CloverError`
- 数值转受控数值域
- 动态对象转固定 shape 结构体

推荐模式：

```ts
import { z } from "zod";

const UserInputSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable().optional(),
});

const UserInputErrorCode = {
  InvalidInput: 1,
} as const;

type UserInputErrorPayload = {
  reason: string;
  inputKind: string;
};

function parseUserInput(
  input: unknown
): Result<User, typeof UserInputErrorCode.InvalidInput, UserInputErrorPayload> {
  const parsed = UserInputSchema.safeParse(input);
  if (!parsed.success) {
    return createError(UserInputErrorCode.InvalidInput, {
      reason: "schema-parse-failed",
      inputKind: Array.isArray(input) ? "array" : typeof input,
    });
  }

  const data = parsed.data;
  return {
    id: toUserId(data.id),
    email: data.email == null ? None : toEmail(data.email),
  };
}
```

规则重点：

- Zod 只负责把宿主数据解析成“边界可信数据”
- `optional()` / `nullable()` 的结果不能直接进入核心域
- 必须在边界把它们统一收敛到 `None`

### 5.2 核心层

核心层一旦建立，默认不再接受：

- `undefined`
- `null`
- 异常穿透
- 动态对象 shape
- 模糊数值域

核心层只处理：

- 固定 shape 结构体
- `Option<T>`
- `Result<T, Code, Payload>`
- 受控数值类型
- 纯函数式数据流

## 6. `tsconfig` 基线

推荐起点：

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,

    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "noUncheckedSideEffectImports": true,

    "declaration": true,
    "isolatedDeclarations": true,
  }
}
```

说明：

- 即使核心域禁用 `undefined` / `?`，`strictNullChecks` 和 `exactOptionalPropertyTypes` 仍然必须开启
- 它们能帮助边界层及时发现宿主空值和可选字段问题

## 7. ESLint 约束基线

至少应覆盖：

- 禁 `any`
- 禁 `==`
- 禁 `with`
- 禁 `for...in`
- 禁 `eval`
- 禁 `class`
- 禁 `this`
- 禁 `bind` / `call` / `apply`
- 禁 `delete`
- 禁原型修改
- 禁动态 key 写入核心结构体
- 禁核心域 `throw`
- 禁核心域 `try-catch`
- 禁核心域直接依赖 `zod`

## 8. 示例

### 8.1 `Option<T>`

```ts
type User = {
  id: UserId;
  email: Option<Email>;
};

function hasEmail(user: User): boolean {
  return user.email !== None;
}
```

### 8.2 `Result<T, Code, Payload>`

```ts
const PortErrorCode = {
  InvalidPort: 1,
} as const;

type PortErrorPayload = {
  reason: string;
  input: string;
};

function parsePort(
  input: string
): Result<SmiInt, typeof PortErrorCode.InvalidPort, PortErrorPayload> {
  const value = Number(input);
  if (!Number.isInteger(value)) {
    return createError(PortErrorCode.InvalidPort, {
      reason: "not-integer",
      input,
    });
  }
  if (value < 0 || value > 65535) {
    return createError(PortErrorCode.InvalidPort, {
      reason: "out-of-range",
      input,
    });
  }
  return value as SmiInt;
}
```

### 8.3 Zod 边界转译

```ts
import { z } from "zod";

const PortSchema = z.string();

function parsePortFromUnknown(
  input: unknown
): Result<SmiInt, typeof PortErrorCode.InvalidPort, PortErrorPayload> {
  const parsed = PortSchema.safeParse(input);
  if (!parsed.success) {
    return createError(PortErrorCode.InvalidPort, {
      reason: "schema-parse-failed",
      input: String(input),
    });
  }
  return parsePort(parsed.data);
}
```

### 8.4 固定 shape 结构体

```ts
type TaskErrorCode = 1;

type TaskErrorPayload = {
  reason: string;
};

type Task = {
  id: TaskId;
  owner: UserId;
  output: Option<string>;
  error: Option<CloverError<TaskErrorCode, TaskErrorPayload>>;
};
```

## 9. 新抽象准入清单

新增任何抽象前，先回答：

1. 它能不能不增加运行时层？
2. 它会不会破坏单例哨兵模型？
3. 它会不会引入额外分配或 wrapper churn？
4. 它会不会破坏 Hidden Class 稳定性？
5. 它会不会让调用点从单态变成多态？
6. 它有没有显著提升语义表达？
7. 它的编译时复杂度是否可控？
8. 新人能不能直接理解？

只要前 5 个问题里有明显负面答案，这个抽象通常就不应进入 Clover。

## 10. 总结

Clover 的终态不是“更像传统 TypeScript 项目”，而是形成一套明确、强硬、可执行的约束：

- 类型先于运行时猜测
- `None` 取代 `undefined` / `null`
- `CloverError` / `Result` 取代异常控制流
- Zod 统一停留在边界层，不进入核心域
- 固定 shape 结构体取代动态对象
- 数值域分层，避免整数 / 浮点 / 大整数污染
- 函数、对象、数组和调用点都围绕 V8 最优路径设计

只要这套约束能落到 SDK 类型面、ESLint 规则和代码评审上，Clover 就会形成明确的工程辨识度。

标准库规划见：

- [stdlib-spec.md](stdlib-spec.md)
