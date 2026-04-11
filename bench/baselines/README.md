# Benchmark Baseline

这里用于记录 Clover benchmark 的比较基线。

当前约定：

- 不把临时本机跑出来的数字直接提交成权威结论
- 先固定场景，再比较趋势
- 只在以下情况更新基线记录：
  - 热路径实现发生变化
  - benchmark 场景发生变化
  - 运行时目标发生变化

当前基准关注：

- `splitOnce`
- `parseSmiInt`
- `isNone` / `isError`
- `parseWith`
- `parseHostPort` 对 `URL`
- `normalizeUrl` 对 `URL`

推荐记录方式：

1. 先执行 `pnpm build`
2. 再执行 `tsx ./bench/index.ts`
3. 把场景、环境和关键趋势写入评审或发布说明

在 benchmark 体系进一步稳定之前，这里主要作为基线约定说明，而不是自动产物目录。
