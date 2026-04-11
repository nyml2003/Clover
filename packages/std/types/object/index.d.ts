type StringKeyOf<T extends object> = Extract<keyof T, string>;
type EntryOf<T extends object> = {
    [Key in StringKeyOf<T>]: [Key, T[Key]];
}[StringKeyOf<T>];
export declare function hasOwn<ObjectType extends object, Key extends PropertyKey>(value: ObjectType, key: Key): value is ObjectType & Record<Key, unknown>;
export declare function typedKeys<T extends object>(value: T): Array<StringKeyOf<T>>;
export declare function typedEntries<T extends object>(value: T): Array<EntryOf<T>>;
export declare function shallowClone<T extends object>(value: T): T;
export declare function shallowMerge<T extends object, U extends object>(base: T, patch: U): T & U;
export {};
