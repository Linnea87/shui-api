// ==================================================
// DELETE /posts/{postId} – post owner only
// ==================================================

import middy from "@middy/core";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { requireAuth } from "../../../middlewares/requireAuth.mjs";
import { requirePostOwner } from "../../../middlewares/requirePostOwner.mjs";
import { deletePost } from "../../../services/postService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const deletePostHandler = async (event) => {
  await deletePost(event.pathParameters.postId);

  return sendResponse(204);
};

export const handler = middy(deletePostHandler)
  .use(requireAuth())
  .use(requirePostOwner())
  .use(errorHandler());