// ==================================================
// GET /posts – public, optional ?username= filter
// ==================================================

import middy from "@middy/core";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { validate } from "../../../middlewares/validate.mjs";
import { getPostsQuerySchema } from "../../../schemas/postSchemas.mjs";
import { getPosts } from "../../../services/postService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const getPostsHandler = async (event) => {
  const posts = await getPosts(event.queryStringParameters);

  return sendResponse(200, posts);
};

export const handler = middy(getPostsHandler)
  .use(validate({ query: getPostsQuerySchema }))
  .use(errorHandler());
