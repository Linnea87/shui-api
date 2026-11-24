// ==================================================
// Auth service
// ==================================================

import { createUser } from "../repositories/userRepository.mjs";
import { ConflictError } from "../utils/errors.mjs";
import { hashPassword } from "../utils/password.mjs";

// Hashes the password and stores the user. Throws 409 if the username is taken.
export const registerUser = async ({ username, password }) => {
  const passwordHash = await hashPassword(password);

  const created = await createUser({
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  if (!created) {
    throw new ConflictError("Username is already taken");
  }
  return { username };
};
