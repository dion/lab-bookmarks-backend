import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const entry = {
    id: event.detail.bookmarkId,
    user: event.detail.userId,
    url: event.detail.url,
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
