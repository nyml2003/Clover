# Clover 的 V8 导向设计约束

## 1. 目标

这份文档回答一个核心问题：

如果 Clover 要把“类型约束”真正转化成“运行时性能”，那么设计和写法必须如何配合 V8？

Clover 的答案不是盲目追求类型花哨，而是围绕几件事建立约束：

- Hidden Class 稳定
- 调用点单态
- 数值域稳定
- 数组元素种类稳定
- 控制流可预测

## 2. 总体优先级

Clover 的优先级顺序固定如下：

1. 运行时零成本或近零成本
2. V8 友好的 shape、数值域和调用路径
3. 编译时复杂度可控
4. 类型表达优雅

也就是说：

- 只要一个类型设计会诱导出更差的 emitted JS，它就不是 Clover 想要的设计
- 类型优雅只能建立在运行时稳定之上

## 3. Hidden Class 规则

### 3.1 固定字段集合

V8 对字段集合和字段顺序稳定的对象更容易建立共享 Hidden Class。

Clover 的规则：

- 主结构体字段集合固定
- 字段初始化顺序固定
- 字段默认全部显式存在
- 禁止可选属性 `?`
- 禁止按分支补字段

推荐：

```ts
type User = {
  id: UserId;
  email: Option<Email>;
  bio: Option<string>;
};
```

不推荐：

```ts
type User = {
  id: UserId;
  email?: Email;
};
```

### 3.2 空槽位统一用 `None`

`None` 在 Clover 中不仅是语义统一工具，也是 shape 稳定工具。

规则：

- 某个槽位可以没值时，槽位仍然存在
- 没值时放 `None`
- 不允许通过省略字段表达“空”

这样可以保证：

- 同类对象字段集合一致
- 空值判断统一为 `=== None`
- 不在 `undefined` / `null` / 省略字段之间切换

### 3.3 禁止 shape 变异

以下行为在核心域全部禁止：

- `delete`
- 动态加字段
- 动态删字段
- 主结构体挂动态 key
- 不同分支产生不同字段集合

动态信息如果确实需要，必须放在单独字典字段中，而不是污染主结构体。

## 4. 调用点单态规则

### 4.1 一个热函数只处理一类输入

V8 的 inline cache 更偏好单态调用点。

Clover 的规则：

- 热函数只吃固定 shape
- 热函数只吃固定数值域
- 热函数只吃固定错误协议

推荐：

```ts
function sum(values: readonly SmiInt[]): SmiInt | Err {
  let total = 0 as SmiInt;
  for (const value of values) {
    total = addSmi(total, value);
    if (total === Err) return Err;
  }
  return total;
}
```

不推荐：

```ts
function sumAnything(values: Array<number | bigint | null | undefined | string>) {
  let total = 0;
  for (const value of values) {
    if (typeof value === "number") total += value;
  }
  return total;
}
```

### 4.2 边界归一化前置

`typeof`、`instanceof`、空值清洗、异常捕获都应该尽量停留在边界层。

在 Clover 里，边界层默认使用 Zod 做解析与归一化。

核心层只处理已经收紧后的值。

这样做的结果是：

- 调用点更稳定
- 控制流更短
- JIT 更容易优化

补充规则：

- `safeParse` 停留在边界
- `ZodError` 不进入核心层
- `optional()` / `nullable()` 结果在边界立即收敛为 `None`
- schema 输出在进入核心层前转成固定 shape 结构体

## 5. 数值域规则

### 5.1 小整数优先

Clover 默认把 V8 `Smi` 友好整数域作为热路径整数目标。

这不是说 TypeScript 能凭空证明所有结果都是 `Smi`，而是说：

- 整数 API 默认只接受受控小整数
- 运算过程不允许隐式混入浮点
- 超出整数域时必须显式失败或显式切换类型

### 5.2 浮点必须显式

一旦逻辑需要浮点：

- API 直接声明 `Float64` 或 `FiniteFloat64`
- 不再假装它还是整数逻辑
- `NaN` / `Infinity` 必须在边界或构造时剔除

### 5.3 `bigint` 严格隔离

`bigint` 是独立数值域。

规则：

- 不与 `number` 混算
- 不在同一热路径函数里混合处理
- 不用隐式转换打通

## 6. 判断规则

### 6.1 等值判断优先

Clover 核心域优先使用：

- `=== None`
- `=== Err`
- `=== "tag"`

原因：

- 分支信号更直接
- 避免动态类型判断
- 语义更可控

### 6.2 运行时类型判断只留在边界

以下能力主要保留给边界层：

- `typeof`
- `instanceof`
- 反射式检查
- `zod` schema 解析

核心层不依赖它们维持正常流程。

## 7. 函数与对象模型规则

### 7.1 函数优先，`this` / `class` 禁用

Clover 的核心对象模型不是 class hierarchy，而是：

- 普通对象
- 纯函数
- 判别联合
- 显式参数传递

禁用：

- `this`
- `class`
- `bind`
- `call`
- `apply`

### 7.2 热路径避免闭包分配

闭包不是语言错误，但在 Clover 中：

- 启动阶段、配置阶段允许闭包
- 热路径、循环体、核心调用链避免临时闭包

目标是减少：

- 临时分配
- 调用目标不稳定
- 上下文捕获带来的额外复杂度

### 7.3 不靠原型和反射组织行为

禁用：

- 原型污染
- 在原型上补方法
- 基于 getter / setter 的隐式重逻辑
- 用 Proxy 作为核心域抽象层

## 8. 数组规则

### 8.1 保持元素种类稳定

V8 会跟踪 arrays 的 elements kind。

Clover 的规则：

- 热路径数组不混装互不相关类型
- 数值数组不在整数 / 浮点 / 对象间来回切
- 禁止稀疏数组

### 8.2 禁止 hole 和远距离打洞

以下写法在核心域禁用：

- `[1, , 3]`
- `delete arr[i]`
- `arr[9999] = value`

如果需要空槽位，用显式 `None`：

```ts
const slots: Array<Option<Item>> = [item1, None, item3];
```

### 8.3 遍历规则

优先：

- `for...of`
- 普通索引循环

禁止：

- `for...in`
- 依赖越界读结束循环

## 9. 错误通道规则

### 9.1 错误是数据，不是异常

Clover 核心域把错误视为协议数据。

默认协议：

- 成功返回值
- 失败返回 `Err` 或受控错误 tag

这样做的意义：

- 控制流稳定
- 调用约定统一
- 不依赖异常穿透

### 9.2 边界异常必须转译

现代 V8 对 `try-catch` 的处理已经比过去成熟，但 Clover 仍然规定：

- 异常只允许停留在边界层
- 捕获后立即转译为 `Err` 或受控错误 tag
- 核心层不接受异常穿透

## 10. emitted JS 与目标版本

高 ES 目标在 Clover 中不是审美偏好，而是性能策略。

推荐：

- `target: "ES2023"`
- 原生 ESM
- 尽量少做向下转译

原因：

- 避免冗余 helper
- 保留现代语法给 V8 直接优化
- 减少 transpile 后的 shape 污染和调用层数

## 11. 工程检查清单

以下内容应进入 lint / review / 未来静态扫描规则：

- 是否出现 `undefined` / `null` 漏进核心域
- 是否出现 `?` 可选属性
- 是否出现 `delete`
- 是否出现动态字段补写
- 是否出现 `class` / `this`
- 是否出现异常穿透核心域
- 是否出现 `zod` 直接泄漏进核心域
- 是否出现整数 / 浮点 / `bigint` 混用
- 是否出现多态热函数
- 是否出现稀疏数组
- 是否出现 `==` / `for...in` / `eval`

## 12. 参考资料

以下 V8 资料是 Clover 这套设计的主要背景：

- V8: Maps (Hidden Classes) in V8
  https://v8.dev/docs/hidden-classes
- V8: Fast properties in V8
  https://v8.dev/blog/fast-properties
- V8: Elements kinds in V8
  https://v8.dev/blog/elements-kinds
- V8: Optimizing ES2015 proxies in V8
  https://v8.dev/blog/optimizing-proxies
- V8: Maglev - V8’s Fastest Optimizing JIT
  https://v8.dev/blog/maglev
