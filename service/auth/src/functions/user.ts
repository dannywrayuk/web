import { dynamoDBTableCRUD } from "@dannywrayuk/aws/dynamoDBTable";
import { env } from "./user-env.gen";
import { success } from "./lib/results";

const userTable = dynamoDBTableCRUD(env.userTableName);

export const handler = async (event: any) => {
  const userId = event.requestContext.authorizer.lambda.userId;
  const userData = await userTable.read("USER_ID#" + userId, "RECORD");

  if (userData?.length !== 1) {
    console.log("user not found");
    return { statusCode: 404, body: "User not found" };
  }

  const { PK, SK, ...user } = userData[0];

  return success(user);
};
