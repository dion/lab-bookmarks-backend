import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const logger = new Logger({ serviceName: "BookmarkContestService" });

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event, context) => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    functionName: context.functionName,
  });

  logger.info("Incoming event", { event });

  if (process.env.FORCE_ERROR === "true") {
    throw new Error("Forced error for testing alarms & traces");
  }

  // console.log("BookmarkContest event:", JSON.stringify(event, null, 2));
  // Extract needed fields
  const { detail, validationResult, approvalResult } = event;

  if (!detail?.bookmarkId || !detail?.userId || !detail?.url) {
    throw new Error("Missing bookmark fields in event.detail");
  }
  if (!validationResult) {
    throw new Error("Missing validationResult in event");
  }
  if (!validationResult.deterministicId) {
    throw new Error("Missing deterministicId in validationResult");
  }

  const entry = {
    id: validationResult.deterministicId, // ✅ deterministic key for duplicates
    originalBookmarkId: detail.bookmarkId,
    userId: detail.userId,
    url: detail.url,
    approved: approvalResult?.approved ?? false,
    createdAt: new Date().toISOString(),
  };

  try {
    await ddb.send(
      new PutCommand({
        TableName: "BookmarkContestEntries",
        Item: entry,
        ConditionExpression: "attribute_not_exists(id)" // ✅ prevent duplicates
      })
    );
  } catch (err) {
    logger.error("Error processing bookmark", { error: err });

    if (err.name === "ConditionalCheckFailedException") {
      console.warn("Duplicate contest entry detected, skipping insert.");
      return {
        statusCode: 409,
        body: "Duplicate entry detected. Not added to contest.",
      };
    }
    throw err;
  }

  return {
    statusCode: 200,
    body: "Contest entry added.",
  };
};
