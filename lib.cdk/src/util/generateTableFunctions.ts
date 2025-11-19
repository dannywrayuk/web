import { casing } from "@dannywrayuk/casing";
import { Table } from "../table.ts";

const tableNameVariableName = (tableName: string) =>
  `${casing.camel(tableName)}TableName`;

export const generateTableProperties = (table: Table) => {
  return `

export const ${tableNameVariableName(table.name)} = "${table.fullName.split("-").slice(0, -1).join("-")}-" + env.stage;`;
};

export const generateTableFunctions = (tableName: string) => {
  const tableNameVariable = tableNameVariableName(tableName);
  const tableNameCamel = casing.camel(tableName);
  return `
import { table, Table } from "@dannywrayuk/aws/dynamoDBTable";
export const ${tableNameCamel}Table: Table = table(${tableNameVariable});`;
};
