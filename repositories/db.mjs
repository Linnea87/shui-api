// ==================================================
// DynamoDB client
// ==================================================

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Created once per Lambda container and reused across warm invocations
const client = new DynamoDBClient({});

export const db = DynamoDBDocumentClient.from(client);