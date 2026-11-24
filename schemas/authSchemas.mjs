// ==================================================
// Auth schemas
// ==================================================

import { z } from "zod";

// Trimmed and lowercased, so login matches the stored username regardless of case
const normalizedUsername = z
  .string({ error: "Username is required" })
  .trim()
  .toLowerCase();

// Registration rules for new usernames
const username = normalizedUsername
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

// Login only checks that the fields are present. The format rules belong to registration.
export const loginSchema = z.object({
  username: normalizedUsername.min(1, "Username is required"),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});
