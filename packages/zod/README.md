# @clover/zod

Zod 边界适配层。

职责：

- 边界解析
- `safeParse` 结果转 `Result`
- `optional` / `nullable` 收敛到 `None`
- 解析失败转 Clover 固定 shape 错误对象
- 宿主输入到固定 shape 的转换模板
