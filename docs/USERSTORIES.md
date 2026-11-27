<h1 align="center">Shui API - User Stories</h1>

The user stories are grouped into five EPICs, and all of them are implemented.

## EPIC - Setup & Infrastructure

- **SH-1** As a developer I can start from a configured Serverless project, so every endpoint is built on the same structure.

- **SH-2** As a developer I can store users, posts and comments in DynamoDB, so data is persisted between requests.

- **SH-3** As a developer I can reuse middlewares for errors and validation, so handlers stay short and every error has the same format.

- **SH-17** As a developer or examiner I can read a README, so I can understand the project and run and test it.

- **SH-18** As an examiner I can test the API through a public URL, so I can verify that it works.

## EPIC - Authentication

- **SH-4** As a visitor I can register with a username and password, so I can log in and publish posts in my own name.

- **SH-5** As a registered user I can log in, so I can get a token that lets me create and manage my posts.

- **SH-6** As a developer I can protect endpoints with a reusable auth middleware, so the user identity always comes from a verified JWT.

## EPIC - Posts

- **SH-7** As a logged-in user I can create a post, so I can share a message on the board.

- **SH-8** As a visitor I can see all posts and filter them by username, so I can find what a specific user has written.

- **SH-9** As a visitor I can open a single post, so I can read it on its own.

- **SH-10** As a post owner I can update the title and content of my post, so I can correct or change what I wrote.

- **SH-11** As a post owner I can delete my post, so I can remove content I no longer want to share.

## EPIC - Guest Posts

- **SH-12** As a guest I can publish a post without logging in, so I can take part without creating an account.

- **SH-13** As a registered user I can trust that guest posts cannot be edited or deleted, so I can be sure nobody takes over a guest post by using the same username.

## EPIC - Comments

- **SH-14** As a logged-in user I can comment on any post, including guest posts, so I can respond to what others have written.

- **SH-15** As a visitor I can read the comments on a post, so I can follow the discussion.

- **SH-16** As a post owner I can delete my post together with its comments, so no orphaned comments are left behind.

[Return to README](../README.md#user-stories)