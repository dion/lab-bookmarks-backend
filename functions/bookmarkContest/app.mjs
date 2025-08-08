import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const detail = event.detail;

  if (!detail) {
    throw new Error("Missing detail in event");
  }

  const entry = {
    id: detail.bookmarkId,
    user: detail.userId,
    url: detail.url,
    createdAt: new Date().toISOString(),
  };

  await ddb.send(
    new PutCommand({
      TableName: "BookmarkContestEntries",
      Item: entry,
    })
  );

  return {
    statusCode: 200,
    body: "Contest entry added.",
  };
};
