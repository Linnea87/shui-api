// ==================================================
// Post service
// ==================================================

import { randomUUID } from "node:crypto";
import * as postRepository from "../repositories/postRepository.mjs";

// Creates a post for a logged-in user. The server sets id, owner and timestamps,
// the client only decides title and content.
export const createPost = async ({ title, content }, user) => {
  const now = new Date().toISOString();

  return postRepository.createPost({
    id: randomUUID(),
    username: user.username,
    isGuest: false,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  });
};
