// ==================================================
// GET /posts/{postId}/comments – public
// ==================================================

import middy from "@middy/core";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { getComments } from "../../../services/commentService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const getCommentsHandler = async (event) => {
  const comments = await getComments(event.pathParameters.postId);

  return sendResponse(200, comments);
};

export const handler = middy(getCommentsHandler).use(errorHandler());
