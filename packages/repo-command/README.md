# @clover.js/repo-command

仓库命令入口。

当前状态：

- 孵化中的场景入口包
- 当前只服务 Clover 仓库
- 负责把 `@clover.js/cli` 和 `@clover.js/automation` 装成最小命令入口

这个包负责什么：

- 解析仓库命令目标
- 规划 workspace goal
- 映射当前仓库的 task command
- 执行自动化基座返回的执行图
- 把结果格式化成终端输出

当前公开表面：

- `RepoCommandErrorCode`
- `RepoTaskCommandErrorCode`
- `createRepoCommandEnvironment`
- `createDefaultRepoCommandEnvironment`
- `parseRepoCommandGoal`
- `createRepoTaskCommand`
- `runWorkspaceTaskNode`
- `runRepoCommand`
- `emitRepoCommandResult`

这个包不负责什么：

- 通用 workflow engine
- request / response 边界
- 页面渲染
- 根级脚本替换

边界规则：

- 这层是场景入口，不是自动化基座本体
- 目标求解仍交给 `@clover.js/automation`
- 终端格式化仍建立在 `@clover.js/cli` 的 helper 之上

当前最小入口：

- `pnpm repo -- build @clover.js/http`
- `pnpm repo -- test @clover.js/http`
- `pnpm repo:lint`
- `pnpm repo:release-check`
