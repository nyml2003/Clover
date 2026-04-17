# 包策略

这份文档不只回答“哪些包是主线”。
还要回答“每个包到底负责什么，不负责什么”。

## 包职责总表

| 包 | 当前角色 | 负责什么 | 不负责什么 |
| --- | --- | --- | --- |
| `@clover.js/protocol` | 核心协议层 | 补齐 JS 缺的类型与值协议，例如 `None`、`Option`、`Result`、brand、简单对象/可桥接值合同、数值域类型，以及与这些协议直接绑定的最小判定/构造 | 不负责宿主输入、不负责成套工具能力、不负责边界解析 |
| `@clover.js/std` | 核心运行时层 | 补齐 JS 缺的操作与能力，围绕协议提供通用实现，例如 `ObjectUtils`、`NumberUtils`、`StringUtils`、路径、URL、异步、结果组合 | 不负责第三方边界、不负责重新定义协议、不负责仓库工作流 |
| `@clover.js/zod` | 通用边界适配层 | 把 Zod 解析结果转成 Clover 协议，把 `optional/nullable` 收敛到 `None` | 不负责业务 schema 设计，不把 Zod 语义带进核心层 |
| `@clover.js/cli` | 终端边界层 | argv、stdout/stderr、exit code、CLI 结果渲染 | 不负责仓库任务编排，不负责 workspace 发现，不负责构建系统 |
| `@clover.js/http` | HTTP 边界层 | request/response 收敛、query/headers/cookies/body 解析、HTTP 错误渲染 | 不负责页面渲染，不负责前端框架封装，不负责业务流程本身 |
| `@clover.js/tsconfig` | 治理层 | TypeScript 编译基线和共享配置 | 不负责运行时能力，不负责 lint 规则 |
| `@clover.js/eslint-plugin` | 治理层 | Clover 约束对应的 ESLint 规则 | 不负责配置组合，不负责运行时逻辑 |
| `@clover.js/eslint-config` | 治理层 | 把 lint 规则组装成仓库可用配置 | 不负责新增规则，不负责运行时逻辑 |
| `@clover.js/automation` | 非主线保留包 | 当前只允许作为内部实验或未来候选基座存在 | 不作为当前主线能力，不默认继续扩产品面 |
| `@clover.js/repo-command` | 非主线保留包 | 当前只允许作为仓库私有入口实验存在 | 不作为当前主线能力，不默认继续扩产品面 |

## 主线包

这些包直接服务 Clover 当前阶段：

- `@clover.js/protocol`
- `@clover.js/std`
- `@clover.js/zod`
- `@clover.js/cli`
- `@clover.js/http`
- `@clover.js/tsconfig`
- `@clover.js/eslint-plugin`
- `@clover.js/eslint-config`

它们可以继续演进。
但演进原则仍然是：先服务真实业务，再决定是否沉淀。

其中 `protocol` 和 `std` 的分工再强调一次：

- `protocol` 负责定义“什么值是合法的”
- `std` 负责定义“怎么操作这些值”

## 非主线包

这些包现在不作为主线投入方向：

- `@clover.js/automation`
- `@clover.js/repo-command`

现在对它们的要求很简单：

- 可以保留
- 可以继续存在
- 可以作为历史资产或实验资产参考
- 但不默认继续加码
- 不把它们写成当前阶段的主要承诺

## 包级判断规则

判断一个包该不该继续投入，看这 5 条：

1. 它是不是直接支撑真实业务开发
2. 它的职责是不是一句话能说清
3. 它是不是稳定地落在某一层
4. 它是不是被重复使用，而不是一次性壳子
5. 把它留成包，是否真的比留在仓库内部脚本或业务层更合适

只要第 2、3、5 条说不清，就先不要继续做大。

## 当前承诺强度

当前承诺最强的是：

- `@clover.js/protocol`
- `@clover.js/std`

其他主线包当前按“受控演进”看。
`automation` 和 `repo-command` 当前按“保留但不主推”看。
