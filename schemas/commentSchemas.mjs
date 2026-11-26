// ==================================================
// Comment schemas
// ==================================================

import { z } from "zod";

// Trimmed first, so a comment of only spaces counts as missing.
// Shorter than a post, since a comment is a reply, not a new topic.
const content = z
  .string({ error: "Content is required" })
  .trim()
  .min(1, "Content is required")
  .max(500, "Content must be at most 500 characters");

export const createCommentSchema = z.object({ content });
