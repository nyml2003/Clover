# @clover/cli

Node CLI 边界层。

当前状态：

- 孵化中的 CLI 边界层包
- 当前更适合仓库内和受控项目使用

首批内容：

- `argv` 读取
- `Result` 到 CLI 渲染结果的转换
- Clover 错误对象到 `stderr` + `exitCode` 的映射
- 轻量的输出发射器
- `zod` 驱动的 argv 解析桥接
