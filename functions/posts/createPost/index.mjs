// ==================================================
// POST /posts – logged-in users
// ==================================================

import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { requireAuth } from "../../../middlewares/requireAuth.mjs";
import { validate } from "../../../middlewares/validate.mjs";
import { createPostSchema } from "../../../schemas/postSchemas.mjs";
import { createPost } from "../../../services/postService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const createPostHandler = async (event) => {
  const post = await createPost(event.body, event.user);

  return sendResponse(201, { message: "Post created successfully", post });
};

export const handler = middy(createPostHandler)
  .use(requireAuth())
  .use(httpJsonBodyParser())
  .use(validate({ body: createPostSchema }))
  .use(errorHandler());