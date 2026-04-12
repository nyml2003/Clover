# @clover.js/http

HTTP 请求响应边界层。

当前状态：

- 孵化中的 HTTP 边界包
- 当前更适合仓库内和受控项目使用
- 负责 request / response 逻辑收敛，服务 Web 逻辑层，不负责渲染层

这个包负责什么：

- request / response 输入输出归一化
- query / headers / cookies 收敛
- query / headers / cookies / body 的 schema 解析桥接
- session / auth context 固定骨架
- handler 类型骨架
- Clover 错误到 HTTP 响应骨架的转换

当前公开表面：

- `createHttpRequestContext`
- `emptyHttpRequestContext`
- `withHttpSession`
- `withHttpAuth`
- `normalizeHttpHeaders`
- `createHttpRequest`
- `createHttpResponse`
- `emptyHttpRequestInput`
- `emptyHttpResponseInput`
- `toHttpQueryInput`
- `toHttpHeadersInput`
- `toHttpCookiesInput`
- `toHttpBodyInput`
- `parseHttpQueryWith`
- `parseHttpHeadersWith`
- `parseHttpCookiesWith`
- `parseHttpBodyWith`
- `formatHttpErrorBody`
- `toStatusCode`
- `defineHttpHandler`
- `renderHttpResult`

这个包不负责什么：

- 页面渲染
- JSX 和组件
- 路由框架封装
- HTTP server 启动
- 子进程执行和仓库工作流

边界规则：

- 这里只处理 HTTP 请求响应边界
- 业务逻辑继续返回 Clover 的 `Result`
- HTTP 层只负责把 `Result` 变成稳定的响应骨架
- schema 解析继续建立在 `@clover.js/zod` 之上，不单独复制一套校验协议
- request context 统一固定 shape：`session`、`auth`、`data`
- 公开输入类型优先固定 shape，缺省值用 `None` 或空对象表达
- 渲染层和框架层能力后续单独处理，不直接塞进这里
