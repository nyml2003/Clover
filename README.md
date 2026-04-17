# Clover

Clover 现在先服务真实业务开发。

当前不先扩产品面。
先用。
缺什么补什么。
补完再收边界。

## 当前共识

- 工具链先收敛到 `tsx + esbuild`，并完全消除 Python 脚本
- 替代脚本体系先做成独立实现，不直接耦合当前项目包
- 先进入真实业务开发
- 只补真实业务暴露出的能力缺口
- 不为未来想象中的场景先做抽象
- `protocol`、`std`、边界层和治理层是当前主线
- `automation`、`repo-command` 现在不作为主线投入方向

## 文档入口

- [docs/README.md](docs/README.md)
- [docs/project-direction.md](docs/project-direction.md)
- [docs/development-policy.md](docs/development-policy.md)
- [docs/package-policy.md](docs/package-policy.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/legacy/README.md](docs/legacy/README.md)

## 现在怎么看这个仓库

- 核心层：`@clover.js/protocol`、`@clover.js/std`
- 边界层：`@clover.js/zod`、`@clover.js/cli`、`@clover.js/http`
- 治理层：`@clover.js/tsconfig`、`@clover.js/eslint-plugin`、`@clover.js/eslint-config`
- 非主线包：`@clover.js/automation`、`@clover.js/repo-command`
