// ==================================================
// User repository
// ==================================================

import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "./db.mjs";

const TABLE_NAME = process.env.USERS_TABLE;

// Writes the user only if the username is free. Returns false if it is already taken.
export const createUser = async (user) => {
  try {
    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
        ConditionExpression: "attribute_not_exists(username)",
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

// Returns the user or null. Used by login in SH-5.
export const getUserByUsername = async (username) => {
  const { Item } = await db.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { username } }),
  );
  return Item ?? null;
};
