// ==================================================
// PUT /posts/{postId} – post owner only
// ==================================================

import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { requireAuth } from "../../../middlewares/requireAuth.mjs";
import { validate } from "../../../middlewares/validate.mjs";
import { updatePostSchema } from "../../../schemas/postSchemas.mjs";
import { updatePost } from "../../../services/postService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const updatePostHandler = async (event) => {
  const post = await updatePost(
    event.pathParameters.postId,
    event.body,
    event.user,
  );

  return sendResponse(200, { message: "Post updated successfully", post });
};

export const handler = middy(updatePostHandler)
  .use(requireAuth())
  .use(httpJsonBodyParser())
  .use(validate({ body: updatePostSchema }))
  .use(errorHandler());
