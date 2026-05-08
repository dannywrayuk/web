import * as fs from "node:fs";

export const namedKey = (key: string, value: string) => `${key}:${value}`;

export type TableData = {
  name: string;
  entries: readonly TableEntry[];
};

type TableEntry = {
  name: string;
  index: readonly [string, string];
  columns: readonly string[];
};

export const generateTable = (table: TableData) => {
  const functions = table.entries.map((entry) => {
    const ref = entry.name;
    const tableName = table.name;
    const PK = entry.index[0]?.startsWith("$")
      ? entry.index[0].slice(1)
      : entry.index[0];

    const constantSK = !entry.index[1]?.startsWith("$");
    const SK = constantSK
      ? entry.index[1].toUpperCase()
      : entry.index[1].slice(1);

    const readParams = constantSK
      ? `${PK}: string`
      : `${PK}: string, ${SK}: string`;

    return `
export type ${ref} = {
${entry.columns
  .map((col) =>
    col === PK || (!constantSK && col === SK)
      ? `  ${col}: string;`
      : `  ${col}?: string;`,
  )
  .join("\n")}
}

// List by PK
export const ${tableName}ListBy_${PK} = (${PK}: string) =>
  query<${ref}>({ 
    PK: \`${namedKey(PK, `\${${PK}}`)}\`,
    tableName: "${tableName}",
  });

// Create PK SK
export const ${tableName}Create${ref} = (data: ${ref}) =>
  put({
    PK: \`${namedKey(PK, `\${data.${PK}}`)}\`,
    SK: ${constantSK ? `"${SK}"` : `\`${namedKey(SK, `\${data.${SK}}`)}}\``},
    data,
    tableName: "${tableName}",
  });

// Update PK SK
export const ${tableName}Update${ref} = (data: ${ref}) =>
  update({
    PK: \`${namedKey(PK, `\${data.${PK}}`)}\`,
    SK: ${constantSK ? `"${SK}"` : `\`${namedKey(SK, `\${data.${SK}}`)}}\``},
    data,
    tableName: "${tableName}",
  });

// Read PK SK
export const ${tableName}Read${ref} = (${readParams}) =>
  read<${ref}>({
    PK: \`${namedKey(PK, `\${${PK}}`)}\`,
    SK: ${constantSK ? `"${SK}"` : `\`${namedKey(SK, `\${${SK}}`)}}\``},
    tableName: "${tableName}",
  });

// Delete PK SK
export const ${tableName}Delete${ref} = (${readParams}) =>
  deleter({
    PK: \`${namedKey(PK, `\${${PK}}`)}\`,
    SK: ${constantSK ? `"${SK}"` : `\`${namedKey(SK, `\${${SK}}`)}}\``},
    tableName: "${tableName}",
  });
`;
  });
  fs.writeFileSync(
    `generated/${table.name}-table.ts`,
    `// This file is auto-generated. Do not edit directly.

import {
  query,
  put,
  read,
  update,
  deleter,
} from "@dannywrayuk/aws/dynamodb";

${functions.join("\n")}`,
    "utf-8",
  );
};
