// ==================================================
// JSON Web Tokens
// ==================================================

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

// The algorithm is set explicitly, so signing and verifying always agree
const ALGORITHM = "HS256";

// Short lifetime limits the damage if a token is stolen, since there is no way to revoke one
const EXPIRES_IN = "1h";

export const signToken = (username) =>
  jwt.sign({ username }, SECRET, {
    algorithm: ALGORITHM,
    expiresIn: EXPIRES_IN,
  });
