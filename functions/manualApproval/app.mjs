import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  const userId = event.input?.detail?.userId;
  const bookmarkId = event.input?.detail?.bookmarkId;
  const { token } = event;

  const approvalLinkBase = process.env.APPROVAL_LINK_BASE;
  const approvalLink = `${approvalLinkBase}?token=${encodeURIComponent(token)}`;

  const message = `
    A new bookmark was created that requires manual approval.

    Details:
    - User ID: ${userId}
    - Bookmark ID: ${bookmarkId}

    Click the link below to approve:
    ${approvalLink}
  `;

  await sns.send(
    new PublishCommand({
      Subject: "Approval Needed: New Bookmark Created",
      Message: message,
      TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
    })
  );

  return {
    statusCode: 200,
    body: "Approval email sent.",
  };
};
