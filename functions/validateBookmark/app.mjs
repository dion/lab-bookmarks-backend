import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

// Helper to normalize a URL
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = ""; // Ignore fragments (#section)
    parsed.searchParams.sort(); // Sort query params for consistency
    return parsed.toString().toLowerCase(); // Case-insensitive comparison
  } catch {
    return url.trim().toLowerCase();
  }
}

// Helper to generate SHA-256 deterministic ID
function generateDeterministicId(url) {
  const normalized = normalizeUrl(url);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export const handler = async (event) => {
  console.log("ValidateBookmark event:", JSON.stringify(event, null, 2));

  const { detail } = event;

  if (!detail?.bookmarkId || !detail?.userId || !detail?.url) {
    throw new Error("Missing bookmark fields in event.detail");
  }

  const deterministicId = generateDeterministicId(detail.url);

  // Check if this URL (deterministicId) already exists in contest
  const existing = await ddb.send(
    new GetCommand({
      TableName: process.env.CONTEST_TABLE_NAME,
      Key: { id: deterministicId },
    })
  );

  if (existing.Item) {
    console.log("Duplicate contest entry detected for URL:", detail.url);
    return {
      status: "duplicate",
      deterministicId,
    };
  }

  // Simple validation: check if URL is valid and uses http/https
  try {
    const parsedUrl = new URL(detail.url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { status: "invalid", deterministicId };
    }
  } catch {
    return { status: "invalid", deterministicId };
  }

  // If passed all checks
  return {
    status: "valid",
    deterministicId,
  };
};
