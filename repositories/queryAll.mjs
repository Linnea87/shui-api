// ==================================================
// Paginated query
// ==================================================

import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import { db } from "./db.mjs";

// DynamoDB returns at most 1 MB per Query. The paginator follows LastEvaluatedKey
// until every page is read, so no items are silently left out. Shared by all repositories.
export const queryAll = async (params) => {
  const items = [];

  for await (const page of paginateQuery({ client: db }, params)) {
    items.push(...page.Items);
  }

  return items;
};
