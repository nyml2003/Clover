# Examples

放最小可运行示例，用来验证 API 是否顺手。

当前示例：

- `parse-host-header.mjs`
- `parse-port-cli.mjs`
- `cli-arg-parser/`
- `url-normalizer/`

说明：

- 根目录 `examples/*.mjs` 默认直接引用本地 `packages/*/dist`
- `examples/*/` 下的目录都视为独立但非 workspace 的小项目
- 独立示例通过各自源码里的本地 adapter 直接引用根目录 `packages/*/dist`
- 独立示例的类型解析只指向根目录 `packages/*/types`，不继承根目录 workspace `paths`
- 从 monorepo 根下安装独立示例时，需要显式传 `--ignore-workspace`
- 先在仓库根目录构建主包，再进入示例目录执行自己的安装和运行命令

运行方式：

- 根目录 `examples/*.mjs` 直接用 `node` 执行
- `examples/cli-arg-parser/` 使用 `pnpm --dir examples/cli-arg-parser install --ignore-workspace`
- `examples/url-normalizer/` 使用 `pnpm --dir examples/url-normalizer install --ignore-workspace`
