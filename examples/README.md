# Examples

放最小可运行示例，用来验证 API 是否顺手。

当前示例：

- `parse-host-header.mjs`
- `parse-port-cli.mjs`
- `url-normalizer/`

说明：

- 根目录 `examples/*.mjs` 默认直接引用本地 `packages/*/dist`
- `examples/url-normalizer/` 保留为独立但非 workspace 的小项目

运行方式：

- 根目录 `examples/*.mjs` 直接用 `node` 执行
- `examples/url-normalizer/` 进入目录后自行 `pnpm install` / `pnpm run ...`
