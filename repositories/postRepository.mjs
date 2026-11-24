// ==================================================
// Post repository
// ==================================================

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "./db.mjs";

const TABLE_NAME = process.env.POSTS_TABLE;

// Every post shares this partition key in CreatedAtIndex, so all posts can be listed newest first with one Query
const POST_TYPE = "POST";

// Stores a new post. The condition makes sure an existing post is never silently overwritten.
export const createPost = async (post) => {
  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { ...post, type: POST_TYPE },
      ConditionExpression: "attribute_not_exists(id)",
    }),
  );

  return post;
};
