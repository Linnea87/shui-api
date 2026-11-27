// ==================================================
// GET /posts/{postId} – public
// ==================================================

import middy from "@middy/core";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { getPost } from "../../../services/postService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const getPosthandler = async (event) => {
  const post = await getPost(event.pathParameters.postId);

  return sendResponse(200, post);
};

export const handler = middy(getPosthandler).use(errorHandler());
