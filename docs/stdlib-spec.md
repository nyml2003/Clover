# Clover 标准库规划

## 1. 目标

这份文档定义 Clover 标准库的边界。

它不是要做另一个 lodash，也不是把所有常见操作都包一层，而是要同时满足两件事：

- 作为 SDK 的一部分，提供高频、可复用、面向解析与协议处理的基础函数
- 作为项目规范的标杆，示范什么样的工具函数才符合 Clover 的类型原则、V8 约束和工程风格

因此，Clover 标准库必须满足：

- 独立函数优先
- 零成本或近零成本优先
- 不破坏对象 shape
- 不依赖正则、异常或动态元编程维持主流程
- 不引入链式运行时抽象

## 2. 总原则

### 2.1 标准库不是杂货铺

只有同时满足下面至少两项的能力，才值得进入标准库：

- 解析器和协议层高频复用
- 边界层与核心层都需要统一约定
- 错误率高，值得通过统一实现减少事故
- 性能敏感，值得做成标准写法

### 2.2 SDK 与规范双重角色

每个进入标准库的函数，都要同时回答两个问题：

1. 它作为 SDK 函数是否有复用价值？
2. 它作为项目规范示例，是否代表了 Clover 想推广的写法？

如果只有第 1 个成立，它可能只是项目私有 helper。
如果只有第 2 个成立，它可能应该写进规范，而不是 SDK。

### 2.3 不做运行时包装层

标准库允许：

- 纯函数
- 极薄适配函数
- 受控边界构造函数

标准库不允许：

- 命名空间式大对象导出
- 面向对象包装器
- 链式方法对象
- 隐式缓存和动态魔法

## 3. 包结构建议

建议未来按如下方式组织：

```text
packages/
  std/
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
      boundary/
```

说明：

- `std/` 是可执行标准库
- `boundary/` 放 Zod 相关适配
- 纯类型协议仍然留在 `packages/types/`

## 4. 推荐纳入的工具域

### 4.1 字符串工具

定位：

- 面向词法分析
- 面向流式协议解析
- 面向 URL / Path / HTTP 组件拆解
- 默认不依赖正则

建议纳入：

- `isAsciiWhitespaceChar`
- `isAsciiAlphaChar`
- `isAsciiDigitChar`
- `isAsciiHexChar`
- `splitOnce`
- `startsWithAt`
- `endsWithAt`
- `asciiToLowerChar`
- `asciiToUpperChar`
- `safeSlice`
- `safeEqualString`
- `encodeUriComponentSafe`
- `decodeUriComponentSafe`

规则：

- 优先单字符、单次扫描实现
- 正则不是默认方案
- 返回值应尽量走 `Option<T>` / `Result<T, Code, Payload>`
- 不隐式抛异常

特别说明：

- “安全空值判断”不应作为字符串工具混入核心库
- 空值判断应拆成核心域 `isNone` 与边界层 `isNilHostValue`

### 4.2 数字工具

定位：

- 安全整数解析
- 范围判断
- 防 `NaN` / `Infinity`
- 受控数值域切换

建议纳入：

- `parseSmiInt`
- `parseFiniteFloat64`
- `isSafeIntegerNumber`
- `isFiniteNumberValue`
- `inRange`
- `clamp`
- `compareNumber`
- `signOfNumber`

规则：

- 不把所有结果都直接暴露为裸 `number`
- 热路径整数解析优先返回 `Result<SmiInt>`
- 浮点工具必须显式说明是否排除 `NaN` / `Infinity`

### 4.3 对象与结构工具

定位：

- 浅层、shape 友好
- 配置合并
- 状态更新
- 解析结果整理

建议纳入：

- `hasOwn`
- `typedKeys`
- `typedEntries`
- `shallowClone`
- `shallowMerge`
- `assignField`
- `updateField`
- `freezeDevView`

规则：

- 只做浅操作
- 不做深拷贝
- 不做深合并
- 不引入动态删字段

重要修正：

- “移除对象中 undefined 项”不应进入核心标准库
- 这会直接破坏固定 shape 原则
- 正确方向是边界层把 `undefined` / `null` 收敛为 `None`，而不是删除字段

可以保留的替代能力：

- `normalizeOptionalFieldToNone`
- `materializeShape`

它们的目标是补齐固定字段，而不是删字段。

### 4.4 异步与流式工具

定位：

- Clover 标准库最值得投入的一块
- 所有解析器基础骨架都可以依赖这一层

建议纳入：

- `takeAsync`
- `skipAsync`
- `collectAsyncLimited`
- `splitAsyncByDelimiter`
- `stopAsyncWhen`
- `concatAsync`
- `mergeAsync`
- `bufferAsyncChunks`
- `mapAsyncResult`

规则：

- 必须带长度上限或背压意识
- 默认考虑 chunk 跨界问题
- 默认考虑提前终止
- 默认避免“一把全收进内存”

### 4.5 结果与错误工具

定位：

- 围绕 Clover 的 `Result<T, Code, Payload>` 协议提供函数式辅助
- 不是链式对象系统

建议纳入：

- `ok`
- `err`
- `isError`
- `mapResult`
- `mapErr`
- `andThenResult`
- `unwrapOr`
- `matchResult`
- `assertNever`
- `assert`

规则：

- 允许函数式组合
- 不允许方法链对象
- 进入错误分支时优先先做一次 `isError(x)`，然后按 `error.__code__` 分派

重要修正：

- “Result 链式安全调用”可以有，但只能是独立函数风格
- 不能退化成 `result.map(...).andThen(...).unwrapOr(...)`

### 4.6 路径与 URL 工具

定位：

- 这是 Clover 很适合作为样板能力的一层
- 能同时体现解析、数值校验、流式处理和结果协议

建议纳入：

- `normalizePathSegments`
- `joinPath`
- `joinPathSafe`
- `parseQueryString`
- `parseQueryStream`
- `buildQueryString`
- `buildUrl`
- `parseHostPort`
- `extractUrlParts`

规则：

- 优先有限状态或单次扫描
- 不依赖大正则
- 解析输出统一走固定 shape + `Option<T>` / `Result<T, Code, Payload>`

### 4.7 类型谓词与安全判断

定位：

- 边界保护
- 基础收窄
- 宿主值判断

建议纳入：

- `isString`
- `isNumber`
- `isFunction`
- `isObjectRecord`
- `isArrayValue`
- `isNilHostValue`
- `isNone`
- `isError`

重要修正：

- “Brand 辅助判断”不能做成通用运行时判断
- brand 在 Clover 里默认是擦除的类型语义，不携带统一运行时标记
- 因此应提供的是“品牌构造 / 品牌校验入口”，例如 `toUserId`、`parseEmail`
- 不应承诺存在通用 `isBrand(x)`

### 4.8 轻量性能与安全工具

定位：

- 安全比较
- 长度限制
- 轻量哈希
- 少量确有收益的性能工具

建议纳入：

- `safeCompareAscii`
- `assertMaxLength`
- `hashFnv1a32`
- `hashFnv1a64`

谨慎纳入：

- 小对象池

重要修正：

- “固定时长字符串比较”在纯 JS 中不应作强安全承诺
- Clover 可以提供“尽量减少明显分支泄漏”的比较函数
- 但文档必须写明它不是密码学级保证

- “小对象复用池”不应作为默认标准库能力
- 池化很容易破坏可读性、形状稳定性和对象生命周期判断
- 只有在 profiler 明确证明收益时，才考虑以实验模块形式存在

## 5. 明确不做的能力

以下能力应继续明确排除：

- 深拷贝
- 深合并
- lodash 式杂项工具全集
- 链式 FP 组合子对象
- Proxy / 元编程工具
- 复杂字符串模板和格式化库
- 大型日期时间库
- heavy 数学库
- 任何会破坏对象形状的动态操作
- `Utils` 大命名空间导出

补充排除：

- 通用 brand 运行时识别器
- 默认对象池
- 基于异常的解析工具
- 依赖正则回溯的大型解析器 helper

## 6. SDK 与规范的分工

### 6.1 应进入 SDK 的

满足以下条件的函数应进入 `packages/std`：

- 复用频率高
- 行为稳定
- 边界清晰
- 可单独测试
- 可作为规范样板

优先进入 SDK 的大类：

- 字符串解析工具
- 数字安全工具
- 浅对象工具
- 异步流工具
- `Result` 函数式工具
- Path / URL 工具
- 基础 guard

### 6.2 应只写进规范的

以下内容更适合作为规则，不一定要先做成 SDK：

- “核心域禁 `undefined` / `null`”
- “不删字段，只收敛到 `None`”
- “热路径不做链式 Result”
- “Brand 不提供通用运行时判断”
- “对象池必须 profiler 驱动”

### 6.3 应放在边界模块的

以下能力应放进 `std/boundary` 或单独模块：

- Zod schema 适配
- Zod error 转 `CloverError`
- `nullable` / `optional` 收敛到 `None`
- 环境变量解析
- URLSearchParams / Headers / Request 等宿主适配

## 7. 第一阶段优先级

如果只做第一批，我建议按这个顺序：

1. `result/`
2. `string/`
3. `number/`
4. `guard/`
5. `async/`
6. `path/` 与 `url/`
7. `object/`
8. `boundary/zod/`

原因：

- `result/` 是所有返回协议的基础
- `string/` 和 `number/` 是解析器的基本砖块
- `guard/` 和 `boundary/zod/` 决定边界层质量
- `async/` 决定流式解析骨架
- `object/` 反而要最克制，不应先长成“万能工具箱”

## 8. 推荐首批函数名

为了避免早期命名漂移，建议首批名字收敛为：

- `splitOnce`
- `isAsciiDigitChar`
- `isAsciiHexChar`
- `parseSmiInt`
- `parseFiniteFloat64`
- `inRange`
- `clamp`
- `hasOwn`
- `typedKeys`
- `shallowMerge`
- `isNone`
- `isError`
- `mapResult`
- `andThenResult`
- `collectAsyncLimited`
- `bufferAsyncChunks`
- `normalizePathSegments`
- `parseQueryString`
- `parseHostPort`
- `safeCompareAscii`

## 9. 总结

你的这份清单方向是对的，但不能原样照抄成标准库。

真正应该落成 Clover 标准库的，是一组：

- 面向解析
- 面向协议
- 面向流式处理
- 面向固定 shape
- 面向 `Option` / `Result`
- 面向 V8 稳定优化路径

的独立函数。

最需要收紧的几项是：

- 不做“移除 undefined”
- 不做通用 brand 运行时判断
- 不做 Result 对象链式 API
- 不把对象池当默认能力
- 不把“固定时长比较”写成过度安全承诺
