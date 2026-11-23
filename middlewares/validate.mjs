// ==================================================
// Validation middleware
// ==================================================

import { BadRequestError } from "../utils/errors.mjs";

// Maps schema keys to where the data lives on the API Gateway event
const EVENT_SOURCES = {
  body: "body",
  query: "queryStringParameters",
  path: "pathParameters",
};

// Validates one or more parts of the request with Zod schemas.
// Usage: validate({ body: postSchema, path: postIdSchema })
// On success the parsed data replaces the raw input, so handlers get trimmed values without unknown fields.
export const validate = (schemas) => ({
  before: async (request) => {
    const messages = [];

    for (const [key, schema] of Object.entries(schemas)) {
      const source = EVENT_SOURCES[key];
      const result = schema.safeParse(request.event[source] ?? {});

      if (result.success) {
        request.event[source] = result.data;
      } else {
        messages.push(...result.error.issues.map((issue) => issue.message));
      }
    }

    if (messages.length > 0) {
      throw new BadRequestError(messages.join(". "));
    }
  },
});
