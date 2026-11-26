// ==================================================
// Comment service
// ==================================================

import { randomUUID } from "node:crypto";
import * as commentRepository from "../repositories/commentRepository.mjs";
import { NotFoundError } from "../utils/errors.mjs";
import { getPost } from "./postService.mjs";

// Creates a comment on an existing post, normal or guest. Throws 404 if the post does not exist.
// The server sets id, postId, owner and timestamp, the client only decides the content.
export const createComment = async (postId, { content }, user) => {
  await getPost(postId);

  const comment = await commentRepository.createComment({
    id: randomUUID(),
    postId,
    username: user.username,
    content,
    createdAt: new Date().toISOString(),
  });

  // The post was deleted between the check above and the transaction
  if (!comment) {
    throw new NotFoundError("Post not found");
  }

  return comment;
};
