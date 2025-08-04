import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const tableName = process.env.TABLE_NAME;
  const userSub = event.requestContext.authorizer.claims.sub;
  const body = JSON.parse(event.body);

  const item = {
    userId: userSub,
    bookmarkId: randomUUID(),
    url: body.url,
    title: body.title,
    createdAt: new Date().toISOString(),
  };

  try {
    await ddb.send(new PutCommand({
      TableName: tableName,
      Item: item,
    }));

    return {
      statusCode: 201,
      body: JSON.stringify(item),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
