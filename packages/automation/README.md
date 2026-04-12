# @clover.js/automation

自动化基座。

当前状态：

- 孵化中的自动化基座包
- 当前更适合仓库内和受控项目使用
- 负责按目标、配置、规约和当前状态求解执行图，不负责 CLI 或 HTTP 宿主边界

这个包负责什么：

- 目标模型
- 配置模型
- workspace manifest 到 config 的适配
- workspace discovery
- workspace goal 到执行图的适配
- 规约模型
- 执行图模型
- 最小求解器
- 最小执行器
- 执行报告 summary 和退出码转换

当前公开表面：

- `AutomationGoalKind`
- `AutomationPlanNodeKind`
- `AutomationExecutionEventKind`
- `buildPackageGoal`
- `testPackageGoal`
- `lintWorkspaceGoal`
- `releaseCheckGoal`
- `createAutomationConfig`
- `createWorkspacePackageManifest`
- `createWorkspacePackageSpecFromManifest`
- `createAutomationConfigFromManifests`
- `discoverWorkspacePackageManifests`
- `planWorkspaceGoal`
- `defaultAutomationPolicy`
- `emptyAutomationFacts`
- `solveAutomationGoal`
- `runAutomationPlan`
- `createAutomationExecutionSummary`
- `formatAutomationExecutionReport`
- `toAutomationExitCode`

这个包不负责什么：

- argv 解析
- request / response 边界
- 页面渲染
- 根级 `clover` 命令入口
- 远程执行和缓存系统

边界规则：

- 这层先求解，再执行
- DAG 是解，不是输入
- 节点和结果都用固定 shape
- 入口和出口适配器后续单独长，不直接塞进内核
