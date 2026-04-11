declare const noneTag: unique symbol;

export type None = typeof noneTag;

export const None: None = Symbol.for("@clover/protocol/None") as None;
