import { upperSnake, pascal } from "@dannywrayuk/casing";
export const namedKey = (...args: (string | undefined)[]) =>
  args.filter(Boolean).join("#");

export type TableData = Record<string, TableEntry>;
type TableEntry = Record<
  string,
  {
    PK: string;
    SK?: string;
    columns: readonly string[];
  }
>;

const getPK = (entry: {
  PK: string;
  SK?: string;
  columns: readonly string[];
}) => {
  return entry.PK?.startsWith("$") ? entry.PK.slice(1) : entry.PK;
};

export const generateTable = ({
  serviceName,
  tables,
}: {
  serviceName: string;
  tables: TableData;
}) => {
  const uniquenessList = [] as string[];
  const functions = Object.entries(tables)
    .map(([tableName, entry]) =>
      Object.entries(entry).map(([ref, entry]) => {
        const snakeRef = upperSnake(ref);
        const pascalRef = pascal(tableName) + pascal(ref);
        const PK = getPK(entry);
        const constantSK = !entry.SK?.startsWith("$") || !entry.SK;
        const SK = !entry.SK
          ? undefined
          : constantSK
            ? upperSnake(entry.SK)
            : entry.SK?.slice(1);

        const readParams = constantSK
          ? `params: { ${PK}: string }`
          : `params: { ${PK}: string, ${SK}: string }`;

        if (uniquenessList.includes(`${tableName}-${snakeRef}`)) {
          throw new Error(
            `Duplicate table entry for ${tableName} with ref: ${ref}. Each table entry must have a unique ref.`,
          );
        } else {
          uniquenessList.push(`${tableName}-${snakeRef}`);
        }
        const tableNameValue = `\`${serviceName}-${tableName}-\${ctx.env.stage}\``;

        const listByPK = `
export const list${pascalRef}By${pascal(PK)} = (ctx: HandlerContext, params: { ${PK}: string }) =>
  query<${pascalRef}>({ 
    PK: \`${namedKey(snakeRef, PK, `\${params.${PK}}`)}\`,
    tableName: ${tableNameValue},
  });
`;

        const listBySK = `
export const list${pascalRef}By${pascal(SK || "ref")} = (ctx: HandlerContext, params: { ${SK}: string }) =>
query<${pascalRef}>({ 
  PK: \`${namedKey(snakeRef, SK, `\${params.${SK}}`)}\`,
    tableName: ${tableNameValue},
  inverse: true,
});
`;

        return `
export type ${pascalRef} = {
${entry.columns
  .map((col) =>
    col === PK || (!constantSK && col === SK)
      ? `  ${col}: string;`
      : `  ${col}?: string;`,
  )
  .join("\n")}
}
${!constantSK ? listByPK : ""}
${!constantSK ? listBySK : ""}
export const create${pascalRef} = (ctx: HandlerContext, data: ${pascalRef}) =>
  put({
    PK: \`${namedKey(snakeRef, PK, `\${data.${PK}}`)}\`,
    SK: ${constantSK ? `"${namedKey(snakeRef, SK)}"` : `\`${namedKey(snakeRef, SK, `\${data.${SK}}`)}\``},
    data,
    tableName: ${tableNameValue},
  });

export const update${pascalRef} = (ctx: HandlerContext, data: ${pascalRef}) =>
  update({
    PK: \`${namedKey(snakeRef, PK, `\${data.${PK}}`)}\`,
    SK: ${constantSK ? `"${namedKey(snakeRef, SK)}"` : `\`${namedKey(snakeRef, SK, `\${data.${SK}}`)}\``},
    data,
    tableName: ${tableNameValue},
  });

export const read${pascalRef} = (ctx: HandlerContext, ${readParams}) =>
  read<${pascalRef}>({
    PK: \`${namedKey(snakeRef, PK, `\${params.${PK}}`)}\`,
    SK: ${constantSK ? `"${namedKey(snakeRef, SK)}"` : `\`${namedKey(snakeRef, SK, `\${params.${SK}}`)}\``},
    tableName: ${tableNameValue},
  });

export const delete${pascalRef} = (ctx: HandlerContext, ${readParams}) =>
  remove({
    PK: \`${namedKey(snakeRef, PK, `\${params.${PK}}`)}\`,
    SK: ${constantSK ? `"${namedKey(snakeRef, SK)}"` : `\`${namedKey(snakeRef, SK, `\${params.${SK}}`)}\``},
    tableName: ${tableNameValue},
  });
`;
      }),
    )
    .flat();

  return (
    `
import {
  query,
  put,
  read,
  update,
  remove,
} from "@dannywrayuk/aws/dynamodb";

export const tableInformation = {
  tables: ${JSON.stringify(tables, null, 2)},
};
  ` + functions.join("\n")
  );
};
