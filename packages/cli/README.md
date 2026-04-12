# @clover.js/cli

Node 终端宿主边界层。

当前状态：

- 孵化中的 CLI 边界层包
- 当前更适合仓库内和受控项目使用
- 负责终端输入输出，不负责仓库工作流编排

这个包负责什么：

- `argv` 读取
- `Result` 到 CLI 渲染结果的转换
- Clover 错误对象到 `stderr` + `exitCode` 的映射
- 轻量的输出发射器
- `zod` 驱动的 argv 解析桥接

当前公开表面：

- `readArgv`
- `formatCliError`
- `toExitCode`
- `renderCliResult`
- `emitCliRender`
- `parseArgvWith`

这个包不负责什么：

- 子进程执行
- workspace 发现
- build / lint / test / release-check 编排
- 代码生成和清理
- Web request / response 逻辑
- 业务命令路由和任务图

边界规则：

- 这里只处理终端宿主细节
- 业务逻辑继续返回 Clover 的 `Result`
- CLI 层只负责把 `Result` 变成终端可用的输出
- 公开输入优先固定 shape；是否强制参数、usage 和退出码映射都显式写出
- 仓库维护能力后续会长到自动化基座，不会直接塞进这里

最小例子：

```ts
import { emitCliRender, renderCliResult } from "@clover.js/cli";

const exitCode = emitCliRender(
  renderCliResult({
    argv: process.argv,
    requireArgs: true,
    usage: "tool <port>",
    mapExitCode: {},
    execute(args) {
      return Number(args[0]);
    },
    onSuccess(value) {
      return `port=${value}`;
    }
  })
);

process.exitCode = exitCode;
```
