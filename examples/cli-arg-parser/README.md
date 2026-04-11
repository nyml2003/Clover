# @clover/example-cli-arg-parser

一个独立 TypeScript 示例，用来验证“同一份 Zod DSL 同时驱动 argv 解析和 help 生成”。

特点：

- 用 Clover builder 声明位置参数和选项
- 校验仍然交给 Zod schema
- help 从同一份声明里的 `describe()`、`default()`、`enum()`、数值范围推导
- 参数不合法时输出“错误 + 当前命令 help”

先在仓库根目录构建主包：

```powershell
pnpm run build
```

再运行这个独立示例：

```powershell
pnpm --dir examples/cli-arg-parser install --ignore-workspace
pnpm --dir examples/cli-arg-parser run build
pnpm --dir examples/cli-arg-parser run start -- demo-app --template react --retries 3
pnpm --dir examples/cli-arg-parser run start -- --help
pnpm --dir examples/cli-arg-parser run start --
```

示例里的命令声明长这样：

```ts
const CreateAppCommand = command({
  name: "create-clover-app",
  summary: "Parse scaffold-style CLI arguments from a single Zod-backed DSL.",
  arguments: [
    argument({
      name: "name",
      schema: z.string().regex(/^[a-z][a-z0-9-]*$/).describe("Project name in kebab-case.")
    })
  ],
  options: [
    option({
      key: "template",
      long: "template",
      schema: z.enum(["react", "lib", "cli"]).default("react").describe("Starter template to scaffold.")
    })
  ]
});
```
