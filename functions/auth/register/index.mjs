// ==================================================
// POST /auth/register – public
// ==================================================

import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { validate } from "../../../middlewares/validate.mjs";
import { registerSchema } from "../../../schemas/authSchemas.mjs";
import { registerUser } from "../../../services/authService.mjs";
import { sendResponse } from "../../../utils/response.mjs";

const registerHandler = async (event) => {
  const { username } = await registerUser(event.body);

  return sendResponse(201, {
    message: "User registered successfully",
    username,
  });
};

export const handler = middy(registerHandler)
  .use(httpJsonBodyParser())
  .use(validate({ body: registerSchema }))
  .use(errorHandler());
