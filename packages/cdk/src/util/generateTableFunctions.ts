import { casing } from "@dannywrayuk/casing";
import { Table } from "../table";

const tableNameVariableName = (tableName: string) =>
  `${casing.camel(tableName)}TableName`;

export const generateTableProperties = (table: Table) => {
  return `

export const ${tableNameVariableName(table.name)} = "${table.fullName}";`;
};

export const generateTableFunctions = (tableName: string) => {
  const tableNameVariable = tableNameVariableName(tableName);
  const tableNameCamel = casing.camel(tableName);
  return `
import { table } from "@dannywrayuk/aws/dynamoDBTable";
export const ${tableNameCamel}Table = table(${tableNameVariable});`;
};
