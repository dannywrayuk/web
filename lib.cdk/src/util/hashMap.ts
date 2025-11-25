import * as crypto from "node:crypto";

const hash = (key: unknown) => {
  const str = JSON.stringify(key);
  return crypto.createHash("md5").update(str).digest("hex");
};
export type HashMap<T = unknown> = ReturnType<typeof hashMap<T>>;

export const hashMap = <T = unknown>() => {
  const map = {} as Record<string, T>;

  const get = (key: unknown) => {
    const hashKey = hash(key);
    return map[hashKey];
  };

  const set = (key: unknown, value: T) => {
    const hashKey = hash(key);
    map[hashKey] = value;
  };

  const asCache = (key: unknown, getValue: () => T) => {
    const hashKey = hash(key);
    const value = map[hashKey];
    if (value) return value;
    const newValue = getValue();
    map[hashKey] = newValue;
    return newValue;
  };

  return {
    get,
    set,
    asCache,
  };
};
