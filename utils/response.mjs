// ==================================================
// HTTP response helper
// ==================================================

// Builds a Lambda proxy response. Body is omitted when undefined (204 No Content).
export const sendResponse = (statusCode, body) => {
  if (body === undefined) {
    return { statusCode };
  }

  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
};
