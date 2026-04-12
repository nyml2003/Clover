declare const _noneTag: unique symbol;

export type None = typeof _noneTag;

export const None: None = Symbol.for("@clover.js/protocol/None") as None;
