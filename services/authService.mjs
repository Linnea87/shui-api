// ==================================================
// Auth service
// ==================================================

import { createUser, getUserByUsername } from "../repositories/userRepository.mjs";
import { ConflictError, UnauthorizedError } from "../utils/errors.mjs";
import { signToken } from "../utils/jwt.mjs";
import { hashPassword, verifyPassword } from "../utils/password.mjs";

// Same message for unknown username and wrong password, so the response does not reveal which usernames exist
const INVALID_CREDENTIALS = "Invalid username or password";

// bcrypt hash (cost 10) of a random string. Compared against when the user does not exist,
// so an unknown username takes as long as a wrong password.
const DUMMY_HASH =
  "$2b$10$.VAr2WQBQONWDVm0ekqkzeqmVK/0vtVqMcBaqsyvkcQzUmafHcy7m";

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

// Verifies the credentials and returns a signed token. Throws 401 with the same message for every failure.
export const loginUser = async ({ username, password }) => {
  const user = await getUserByUsername(username);
  const isValid = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !isValid) {
    throw new UnauthorizedError(INVALID_CREDENTIALS);
  }

  return { username: user.username, token: signToken(user.username) };
};
