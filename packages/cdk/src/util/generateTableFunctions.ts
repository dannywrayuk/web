import { casing } from "@dannywrayuk/casing";
import { Table } from "../table";

const tableNameVariableName = (tableName: string) =>
  `${casing.camel(tableName)}TableName`;

export const generateTableProperties = (table: Table) => {
  return `

export const ${tableNameVariableName(table.name)} = "${table.name}";`;
};

export const generateTableReadFunctions = (tableName: string) => {
  return `
import { dynamoDBQuery } from "@dannywrayuk/aws/dynamoDBTable";
export const read${casing.pascal(tableName)}Entry = dynamoDBQuery(${tableNameVariableName(tableName)});`;
};

export const generateTableWriteFunctions = (tableName: string) => {
  const tableNameVariable = tableNameVariableName(tableName);
  const tableNamePascal = casing.pascal(tableName);
  return `
import { dynamoDBPut, dynamoDBDelete, dynamoDBUpdate } from "@dannywrayuk/aws/dynamoDBTable";
export const create${tableNamePascal}Entry = dynamoDBPut(${tableNameVariable});
export const update${tableNamePascal}Entry = dynamoDBUpdate(${tableNameVariable});
export const delete${tableNamePascal}Entry = dynamoDBDelete(${tableNameVariable});`;
};
