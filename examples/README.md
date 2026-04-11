# Examples

放最小可运行示例，用来验证 API 是否顺手。

当前示例：

- `parse-host-header.mjs`
- `url-normalizer/`

运行：

```powershell
pnpm run example:host-header
pnpm run build
pnpm run example:url-normalizer -- "https://Example.com:443/docs?q=1"
```
