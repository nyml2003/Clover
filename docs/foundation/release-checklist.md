# Clover 发布前检查清单

这份清单用于 future release 或稳定快照前的统一检查。

## 1. 文档

- `README.md` 已反映当前对外消费面
- `docs/README.md`、`docs/architecture/`、`docs/foundation/` 没有过期入口
- 如果公开契约变化，规范文档已同步
- 如果阶段状态变化，roadmap 已同步

## 2. 代码与接口

- 稳定包的公开导出没有意外变化
- 错误码和 payload shape 没有未记录变化
- 空值协议没有回退到新的 `null` / `undefined` 漂移
- 子路径导出和入口解析方式仍然一致

## 3. 验证命令

发布前至少执行：

1. `pnpm test`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm build`
5. `pnpm test:system`
6. `pnpm bench`

仓库已经提供聚合入口：

- `pnpm release:check`

## 4. 系统级检查

- build 后的包入口可通过 workspace 包名正常解析
- 系统验证脚本通过
- governance 包和 runtime 包的消费入口都能工作
- benchmark 没有出现明显异常退化

## 5. 版本与说明

- 已判断这次变更是否属于 breaking
- 已确认版本推进策略与本次变更一致
- 已写明迁移说明或兼容说明
- 已明确哪些包进入发布范围

## 6. 暂缓发布条件

只要出现以下任一情况，就不应推进正式发布：

- 公开契约变化没有文档
- 系统验证未通过
- benchmark 出现明显异常但没有解释
- 包稳定性状态仍不清晰
- breaking change 没有迁移说明
