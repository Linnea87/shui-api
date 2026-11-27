// ==================================================
// Require post owner middleware
// ==================================================

import { getPost } from "../services/postService.mjs";
import { ForbiddenError } from "../utils/errors.mjs";

// Protects an endpoint that changes a post. Must run after requireAuth, so event.user is set.
// Throws 404 if the post does not exist and 403 if the user is not the owner.
// The post is available to the handler as event.post.
export const requirePostOwner = () => ({
  before: async (request) => {
    const { pathParameters, user } = request.event;
    const post = await getPost(pathParameters.postId);

    // Guest posts have no owner: a registered user with the same name as a guest must not take them over
    if (post.isGuest) {
      throw new ForbiddenError("Guest posts cannot be changed");
    }

    if (post.username !== user.username) {
      throw new ForbiddenError("You can only change your own posts");
    }

    request.event.post = post;
  },
});
