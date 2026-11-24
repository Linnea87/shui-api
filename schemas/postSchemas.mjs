// ==================================================
// Post schemas
// ==================================================

import { z } from "zod";

// Trimmed first, so a title of only spaces counts as missing
const title = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(100, "Title must be at most 100 characters");

const content = z
  .string({ error: "Content is required" })
  .trim()
  .min(1, "Content is required")
  .max(1000, "Content must be at most 1000 characters");

export const createPostSchema = z.object({ title, content });
