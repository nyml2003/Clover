# @clover/example-url-normalizer

一个最小 TypeScript URL normalizer CLI，用来展示 `@clover/std` 的字符串拆分、数字解析和 `Result` 风格组合。

支持范围：

- 绝对 `http://` / `https://` URL
- 必填 host
- 可选 `:port`
- 可选 `/path`
- 可选 `?query`

不支持：

- auth / user info
- `#fragment`
- IPv6
- 相对 URL

从仓库根目录运行：

```powershell
pnpm run build
pnpm run example:url-normalizer -- "https://Example.com:443/docs?q=1"
pnpm run example:url-normalizer -- --bench 200000
```

只运行这个示例包：

```powershell
pnpm --filter @clover/example-url-normalizer run start -- "http://localhost:8080/path?debug=1"
pnpm --filter @clover/example-url-normalizer run start -- --bench 200000
```

`--bench` 会先校验自定义 parser 和 Node `URL` parser 在内置样本上的输出是否一致，再输出两边的性能数据。
