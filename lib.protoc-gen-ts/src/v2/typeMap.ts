const map = [
  "",
  "number",
  "number",
  "number",
  "number",
  "number",
  "number",
  "number",
  "boolean",
  "string",
  "object",
  "object",
  "Uint8Array",
  "number",
  "number",
  "number",
  "number",
  "number",
  "number",
] as const;

export const typeMap = (id: number) => map[id] || "unknown";
