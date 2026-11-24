// ==================================================
// Password hashing
// ==================================================

import bcrypt from "bcryptjs";

// Cost factor 10: slow enough to make brute force expensive, fast enough for a login request
const SALT_ROUNDS = 10;

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = (password, hash) =>
  bcrypt.compare(password, hash);
