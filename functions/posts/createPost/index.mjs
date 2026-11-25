// ==================================================
// POST /posts – logged-in users and guests
// ==================================================

import middy from "@middy/core";
import { optionalAuth } from "../../../middlewares/optionalAuth.mjs";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { validate } from "../../../middlewares/validate.mjs";
import { createPostSchema } from "../../../schemas/postSchemas.mjs";
import { createPost } from "../../../services/postService.mjs";
import { sendResponse } from "../../../utils/response.mjs";


const createPostHandler = async (event) => {
  const post = await createPost(event.body, event.user);

  return sendResponse(201, { message: "Post created successfully", post });
};

export const handler = middy(createPostHandler)
  .use(optionalAuth())
  .use(httpJsonBodyParser())
  .use(validate({ body: createPostSchema }))
  .use(errorHandler());
