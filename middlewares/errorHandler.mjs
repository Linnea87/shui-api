// ==================================================
// Error handler middleware
// ==================================================

import { HttpError } from "../utils/errors.mjs";
import { sendResponse } from "../utils/response.mjs";

// Middy's JSON body parser throws 415 and 422. The API spec only uses 400 for bad input,
// so both are mapped to 400 with a message that tells the client what to fix.
const BODY_PARSER_ERRORS = {
  415: "Request Content-Type must be application/json",
  422: "Request body must be valid JSON",
};

export const errorHandler = () => ({
  onError: async (request) => {
    const { error, context } = request;

    // Expected errors thrown by services and middlewares
    if (error instanceof HttpError) {
      request.response = sendResponse(error.statusCode, {
        error: error.message,
      });
      return;
    }

    // Missing content type, missing body, malformed JSON or forbidden keys
    const bodyParserMessage = BODY_PARSER_ERRORS[error.statusCode];
    if (bodyParserMessage) {
      request.response = sendResponse(400, { error: bodyParserMessage });
      return;
    }

    // Unexpected errors: full details in CloudWatch, nothing leaked to the client
    console.error(`[${context?.awsRequestId}] Unhandled error:`, error);
    request.response = sendResponse(500, { error: "Internal server error" });
  },
});
