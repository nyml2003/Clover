# Bench

放跨包 benchmark，用来验证 Clover 的 V8 友好设计是否真的成立。

当前基准先覆盖已经稳定的真实 API：

- `splitOnce`
- `parseSmiInt`
- `isNone` / `isError`
- `parseWith`
- `parseHostPort` 对 `new URL(...)`

基线约定见：

- [baselines/README.md](baselines/README.md)
