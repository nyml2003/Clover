# 已知问题

## 1. 根级 typecheck 不是干净工作树友好的

当前 `pnpm typecheck` 对已有构建产物存在依赖。

现象上看：

- 在没有现成 `dist/` / `types/` 产物时，工作区包导入可能解析失败
- 先执行 `pnpm build` 后，再执行 `pnpm typecheck` 才稳定通过

这会带来几个直接问题：

- fresh checkout 的验证信号不稳定
- CI 如果把 `typecheck` 放在 `build` 前面，会暴露顺序耦合
- “类型检查”无法单独作为最轻量的验证入口

## 2. 空值协议没有完全统一

设计文档把 `None` 设为核心域统一空值协议，但当前 URL 归一化相关实现仍暴露 `null`：

- `port: number | null`
- `query: string | null`
- `explainInvalidUrl(...) => string | null`

这导致同一套标准库里并存两种空值建模方式：

- Clover 协议式 `Option<T> = T | None`
- 宿主原生 `null`

结果是调用方必须在同一层处理两套判空语义，削弱了协议统一性。

## 3. 约束治理包还不是自洽的独立产物

当前 `@clover/eslint-config` 直接导入 `../eslint-plugin/src/index.ts`，说明它仍然绑定在 monorepo 源码布局上，而不是依赖一个稳定的插件包边界。

这会带来：

- 配置包难以独立发布和复用
- 包职责边界在运行方式上仍然偏“工作区内部实现细节”
- 文档里宣称的“规则组合包”与实际装配方式之间仍有落差

## 4. 系统对外形态仍然模糊

根文档把 Clover 描述成 SDK + 代码规范体系，但当前多个关键工作区包仍是 `private`：

- `@clover/zod`
- `@clover/cli`
- `@clover/eslint-plugin`
- `@clover/eslint-config`
- `@clover/tsconfig`

这不一定是错误，但它意味着仓库当前更像“内部孵化中的完整体系”，而不是已经明确对外发布的产品矩阵。

## 5. 静态规则只覆盖了一部分设计主张

当前 ESLint 规则已经能约束很多关键坏味道，但仍有不少系统级约束尚未被工具化，例如：

- 核心域里 `null` 协议漂移
- 数值域品牌的一致使用
- 更高层的 shape 稳定性约束
- 包装层是否把宿主协议泄漏进核心域

这意味着 Clover 仍然依赖“文档 + code review”共同维持设计纪律，工具链还没有覆盖全部关键主张。
