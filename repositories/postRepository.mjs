// ==================================================
// Post repository
// ==================================================

import { PutCommand, paginateQuery } from "@aws-sdk/lib-dynamodb";
import { db } from "./db.mjs";

const TABLE_NAME = process.env.POSTS_TABLE;

// Every post shares this partition key in CreatedAtIndex, so all posts can be listed newest first with one Query
const POST_TYPE = "POST";

// Builds the public post shape in the same field order as the API spec.
// Only listed fields are returned, so internal keys like type never leak.
const toPost = ({
  id,
  username,
  isGuest,
  title,
  content,
  createdAt,
  updatedAt,
}) => ({
  id,
  username,
  isGuest,
  title,
  content,
  createdAt,
  updatedAt,
});

// DynamoDB returns at most 1 MB per Query. The paginator follows LastEvaluatedKey
// until every page is read, so no posts are silently left out.
const queryAll = async (params) => {
  const posts = [];

  for await (const page of paginateQuery(
    { client: db },
    { TableName: TABLE_NAME, ...params },
  )) {
    posts.push(...page.Items.map(toPost));
  }

  return posts;
};

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

// All posts, newest first
export const getAllPosts = () =>
  queryAll({
    IndexName: "CreatedAtIndex",
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeNames: { "#type": "type" },
    ExpressionAttributeValues: { ":type": POST_TYPE },
    ScanIndexForward: false,
  });

// Posts by one username, newest first. Includes guest posts, since they store their generated name in the same field.
export const getPostsByUsername = (username) =>
  queryAll({
    IndexName: "UsernameIndex",
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: { ":username": username },
    ScanIndexForward: false,
  });
