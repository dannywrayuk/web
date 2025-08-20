import { casing } from "@dannywrayuk/casing";

export const generateTableReadFunctions = (tableName: string) => {
  return `

import { dynamoDBQuery } from "@dannywrayuk/aws/dynamoDBTable";
export const read${casing.pascal(tableName)} = dynamoDBQuery("${tableName}");`;
};

export const generateTableWriteFunctions = (tableName: string) => {
  return `

import { dynamoDBPut, dynamoDBDelete, dynamoDBUpdate } from "@dannywrayuk/aws/dynamoDBTable";
export const create${casing.pascal(tableName)} = dynamoDBPut("${tableName}");
export const update${casing.pascal(tableName)} = dynamoDBUpdate("${tableName}");
export const delete${casing.pascal(tableName)} = dynamoDBDelete("${tableName}");`;
};
