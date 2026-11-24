// ==================================================
// POST /auth/login – public
// ==================================================

import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { validate } from "../../../middlewares/validate.mjs";
import { loginSchema } from "../../../schemas/authSchemas.mjs";
import { loginUser } from "../../../services/authService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const loginHandler = async (event) => {
  const { username, token } = await loginUser(event.body);

  return sendResponse(200, { message: "Login successful", token, username });
};

export const handler = middy(loginHandler)
  .use(httpJsonBodyParser())
  .use(validate({ body: loginSchema }))
  .use(errorHandler());
