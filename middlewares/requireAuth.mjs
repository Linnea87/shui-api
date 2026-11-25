// ==================================================
// Require auth middleware
// ==================================================

import { authenticate } from "./authenticate.mjs";

// Protects an endpoint. The verified user is available to the handler as event.user.
export const requireAuth = () => ({
  before: async (request) => {
    request.event.user = authenticate(request.event.headers);
  },
});
