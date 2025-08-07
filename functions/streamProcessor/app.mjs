import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const eb = new EventBridgeClient({});

export const handler = async (event) => {
  const entries = [];

  for (const record of event.Records) {
    if (record.eventName !== "INSERT") continue; // 👈 Only handle INSERTs

    const newItem = unmarshall(record.dynamodb.NewImage);

    entries.push({
      Source: "bookmark.table",
      DetailType: "BookmarkCreated",
      Detail: JSON.stringify(newItem),
      EventBusName: "default",
    });
  }

  if (entries.length > 0) {
    await eb.send(new PutEventsCommand({ Entries: entries }));
  }
};
