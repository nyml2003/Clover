type StringKeyOf<T extends object> = Extract<keyof T, string>;
type EntryOf<T extends object> = {
  [Key in StringKeyOf<T>]: [Key, T[Key]];
}[StringKeyOf<T>];

export function hasOwn<ObjectType extends object, Key extends PropertyKey>(
  value: ObjectType,
  key: Key
): value is ObjectType & Record<Key, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function typedKeys<T extends object>(value: T): Array<StringKeyOf<T>> {
  return Object.keys(value) as Array<StringKeyOf<T>>;
}

export function typedEntries<T extends object>(value: T): Array<EntryOf<T>> {
  return Object.entries(value) as Array<EntryOf<T>>;
}

export function shallowClone<T extends object>(value: T): T {
  return { ...value };
}

export function shallowMerge<T extends object, U extends object>(base: T, patch: U): T & U {
  return Object.assign({}, base, patch);
}
