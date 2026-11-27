// ==================================================
// Token authentication
// ==================================================

import { UnauthorizedError } from "../utils/errors.mjs";
import { verifyToken } from "../utils/jwt.mjs";

// "Bearer" is case-insensitive (RFC 6750). The token is one run of non-space characters.
const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

// Reads and verifies the token from the Authorization header. Returns the user or throws 401.
// Shared by requireAuth and optionalAuth, so both reject a bad token in exactly the same way.
export const authenticate = (headers) => {
  const header = headers?.authorization;

  if (!header) {
    throw new UnauthorizedError("Missing token");
  }

  const match = header.match(BEARER_PATTERN);

  if (!match) {
    throw new UnauthorizedError("Authorization header must be: Bearer <token>");
  }

  let payload;

  try {
    payload = verifyToken(match[1]);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new UnauthorizedError("Invalid token");
    }
    throw error;
  }

  if (typeof payload.username !== "string") {
    throw new UnauthorizedError("Invalid token");
  }

  return { username: payload.username };
};
