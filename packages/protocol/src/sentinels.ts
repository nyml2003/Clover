declare const _noneTag: unique symbol;

export type None = typeof _noneTag;

export const None: None = Symbol.for("@clover/protocol/None") as None;
