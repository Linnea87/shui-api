// ==================================================
// Comment repository
// ==================================================

import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "./db.mjs";
import { queryAll } from "./queryAll.mjs";

const TABLE_NAME = process.env.COMMENTS_TABLE;
const POSTS_TABLE_NAME = process.env.POSTS_TABLE;

// Sort key: createdAt first so comments sort oldest first, id last so two comments
// in the same millisecond can never get the same key and overwrite each other
const toSortKey = ({ createdAt, id }) => `${createdAt}#${id}`;

// Builds the public comment shape in the same field order as the API spec.
// Only listed fields are returned, so the internal createdAtId never leaks.
const toComment = ({ id, postId, username, content, createdAt }) => ({
  id,
  postId,
  username,
  content,
  createdAt,
});

// Stores a comment only if its post still exists, in one atomic transaction.
// Returns false if the post was deleted, so no orphaned comment is ever written.
export const createComment = async (comment) => {
  try {
    await db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            ConditionCheck: {
              TableName: POSTS_TABLE_NAME,
              Key: { id: comment.postId },
              ConditionExpression: "attribute_exists(id)",
            },
          },
          {
            Put: {
              TableName: TABLE_NAME,
              Item: { ...comment, createdAtId: toSortKey(comment) },
              ConditionExpression: "attribute_not_exists(createdAtId)",
            },
          },
        ],
      }),
    );
    return toComment(comment);
  } catch (error) {
    if (
      error.name === "TransactionCanceledException" &&
      error.CancellationReasons?.[0]?.Code === "ConditionalCheckFailed"
    ) {
      return false;
    }
    throw error;
  }
};

// All comments on one post, oldest first. Every comment shares the postId partition,
// and the sort key starts with createdAt, so one Query returns them in order.
export const getCommentsByPostId = async (postId) => {
  const items = await queryAll({
    TableName: TABLE_NAME,
    KeyConditionExpression: "postId = :postId",
    ExpressionAttributeValues: { ":postId": postId },
    ScanIndexForward: true,
  });

  return items.map(toComment);
};
