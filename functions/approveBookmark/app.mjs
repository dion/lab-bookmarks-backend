import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn";

const stepFunctions = new SFNClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  const token = event.queryStringParameters?.token;

  if (!token) {
    return {
      statusCode: 400,
      body: "Missing task token..",
    };
  }

  try {
    await stepFunctions.send(
      new SendTaskSuccessCommand({
        taskToken: token,
        output: JSON.stringify({ approved: true }),
      })
    );

    return {
      statusCode: 200,
      body: "✅ Bookmark approved successfully!",
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `❌ Error approving bookmark: ${error.message}`,
    };
  }
};
