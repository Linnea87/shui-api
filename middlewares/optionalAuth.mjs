// ==================================================
// Optional auth middleware
// ==================================================

import { authenticate } from "./authenticate.mjs";

// For endpoints that also accept guests. No Authorization header means a guest (event.user = null).
// A header that is present is verified like in requireAuth, so a bad token gives 401 and never a guest.
export const optionalAuth = () => ({
  before: async (request) => {
    const { headers } = request.event;

    request.event.user = headers?.authorization ? authenticate(headers) : null;
  },
});
