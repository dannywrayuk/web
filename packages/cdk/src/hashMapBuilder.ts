import * as crypto from "node:crypto";

const hash = (key: any) => {
  const str = JSON.stringify(key);
  return crypto.createHash("md5").update(str).digest("hex");
};
export type HashMap = ReturnType<typeof hashMapBuilder>;

export const hashMapBuilder = () => {
  const map = {} as Record<string, any>;

  const get = (key: any) => {
    const hashKey = hash(key);
    return map[hashKey];
  };

  const set = (key: any, value: any) => {
    const hashKey = hash(key);
    map[hashKey] = value;
  };

  const asCache = (key: any, getValue: () => any) => {
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
