// ==================================================
// Post repository
// ==================================================

import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { queryAll } from "./queryAll.mjs";
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
export const getAllPosts = async () => {
  const items = await queryAll({
    TableName: TABLE_NAME,
    IndexName: "CreatedAtIndex",
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeNames: { "#type": "type" },
    ExpressionAttributeValues: { ":type": POST_TYPE },
    ScanIndexForward: false,
  });

  return items.map(toPost);
};

// Posts by one username, newest first. Includes guest posts, since they store their generated name in the same field.
export const getPostsByUsername = async (username) => {
  const items = await queryAll({
    TableName: TABLE_NAME,
    IndexName: "UsernameIndex",
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: { ":username": username },
    ScanIndexForward: false,
  });

  return items.map(toPost);
};

// One post by id, or null if it does not exist
export const getPostById = async (id) => {
  const { Item } = await db.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { id } }),
  );

  return Item ? toPost(Item) : null;
};

// Changes only title, content and updatedAt, so id, username, createdAt and isGuest can never be overwritten.
// Returns the updated post, or null if it no longer exists. Without the condition, an update on
// a missing id would create a new, incomplete item.
export const updatePost = async (id, { title, content, updatedAt }) => {
  try {
    const { Attributes } = await db.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression:
          "SET title = :title, content = :content, updatedAt = :updatedAt",
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeValues: {
          ":title": title,
          ":content": content,
          ":updatedAt": updatedAt,
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    return toPost(Attributes);
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return null;
    }
    throw error;
  }
};

// Deletes a post. Returns false if it was already gone, so the caller can answer 404.
export const deletePost = async (id) => {
  try {
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
      }),
    );
    return true;
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return false;
    }
    throw error;
  }
};
