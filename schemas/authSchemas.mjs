// ==================================================
// Auth schemas
// ==================================================

import { z } from "zod";

// Usernames are trimmed and lowercased, so "Jesper" and "jesper" cannot both be registered
const username = z
  .string({ error: "Username is required" })
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-z0-9_]+$/,
    "Username may only contain letters, numbers and underscores",
  );

// bcrypt silently ignores everything after 72 bytes, so longer passwords are rejected
const password = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must be at most 72 bytes",
  );

export const registerSchema = z.object({ username, password });
