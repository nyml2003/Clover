export function appendValue<T>(values: readonly T[], value: T): readonly T[] {
  return [...values, value];
}

export function prependValue<T>(values: readonly T[], value: T): readonly T[] {
  return [value, ...values];
}

export function replaceAt<T>(values: readonly T[], index: number, value: T): readonly T[] {
  if (!Number.isInteger(index) || index < 0 || index >= values.length) {
    return values;
  }

  if (Object.is(values[index], value)) {
    return values;
  }

  const next = values.slice();
  next[index] = value;
  return next;
}

export function removeAt<T>(values: readonly T[], index: number): readonly T[] {
  if (!Number.isInteger(index) || index < 0 || index >= values.length) {
    return values;
  }

  return [...values.slice(0, index), ...values.slice(index + 1)];
}

export function setRecordField<T extends object, K extends keyof T>(
  value: T,
  key: K,
  nextValue: T[K]
): T {
  if (Object.is(value[key], nextValue)) {
    return value;
  }

  return {
    ...value,
    [key]: nextValue
  };
}

export function patchRecord<T extends object, U extends Partial<T>>(value: T, patch: U): T & U {
  let changed = false;

  for (const key of Object.keys(patch) as Array<keyof U>) {
    if (!Object.is(value[key as keyof T], patch[key])) {
      changed = true;
      break;
    }
  }

  return changed ? Object.assign({}, value, patch) : (value as T & U);
}
