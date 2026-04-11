# @clover/zod

Zod 边界适配层。

职责：

- 边界解析
- `optional` / `nullable` 收敛到 `None`
- 解析失败转 `Err`
- 宿主输入到固定 shape 的转换模板
