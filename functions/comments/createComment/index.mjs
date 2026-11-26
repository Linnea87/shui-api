// ==================================================
// POST /posts/{postId}/comments – logged-in users
// ==================================================

import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { requireAuth } from "../../../middlewares/requireAuth.mjs";
import { validate } from "../../../middlewares/validate.mjs";
import { createCommentSchema } from "../../../schemas/commentSchemas.mjs";
import { createComment } from "../../../services/commentService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const createCommentHandler = async (event) => {
  const comment = await createComment(
    event.pathParameters.postId,
    event.body,
    event.user,
  );

  return sendResponse(201, {
    message: "Comment created successfully",
    comment,
  });
};

export const handler = middy(createCommentHandler)
  .use(requireAuth())
  .use(httpJsonBodyParser())
  .use(validate({ body: createCommentSchema }))
  .use(errorHandler());
