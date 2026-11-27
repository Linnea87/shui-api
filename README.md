# Shui API

Shui is a REST API for a digital message board. Users can register, log in and write posts. Guests can write posts without an account, and logged-in users can comment on any post, including guest posts. A post can only be changed or deleted by the user who wrote it, and deleting a post also deletes its comments.

The API is serverless: every endpoint is its own AWS Lambda function behind API Gateway, and all data is stored in DynamoDB.

**Base URL:** https://ixunky6lg0.execute-api.eu-north-1.amazonaws.com

## Table of contents

- [Tech stack](#tech-stack)
- [Planning and workflow](#planning-and-workflow)
  - [User stories](#user-stories)
  - [GitHub Kanban board](#github-kanban-board)
  - [Workflow](#workflow)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Deployment](#deployment)
- [Endpoints](#endpoints)
  - [Overview](#overview)
  - [Request bodies](#request-bodies)
  - [Guest posts](#guest-posts)
  - [Errors](#errors)
- [Project structure](#project-structure)
  - [Structure tree](#structure-tree)
  - [Layers](#layers)
- [Database design](#database-design)
  - [Tables](#tables)
  - [Access patterns](#access-patterns)
- [Design decisions](#design-decisions)
  - [Security](#security)
  - [Data integrity](#data-integrity)
  - [Performance](#performance)
  - [Errors and validation](#errors-and-validation)
- [Testing](#testing)
  - [Approach](#approach)
  - [Auth](#auth)
  - [Posts](#posts)
  - [Guest posts](#guest-posts-1)
  - [Comments](#comments)
  - [Validation and errors](#validation-and-errors)

## Tech stack

Shui is built entirely on managed AWS services, so there are no servers to run or maintain. Each endpoint is a small Lambda function, and the Serverless Framework creates all functions, routes and tables from a single `serverless.yml`.

| Area | Technology |
| --- | --- |
| Runtime | Node.js 22 (ES modules) |
| Compute | AWS Lambda |
| API | AWS API Gateway (HTTP API) |
| Database | AWS DynamoDB |
| Infrastructure as code | Serverless Framework v4 |
| Middleware | Middy |
| Validation | Zod |
| Authentication | JSON Web Tokens (jsonwebtoken), HS256 |
| Password hashing | bcryptjs |
| AWS SDK | AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) |
| Region | eu-north-1 (Stockholm) |

[Back to top](#table-of-contents)

## Planning and workflow

### User stories

The work was split into 18 user stories, each covering one feature or part of the setup, and grouped into 5 EPICs. An overview of all user stories, sorted by EPIC, is in the [user stories list](docs/USERSTORIES.md).

Each user story is also a [GitHub Issue](https://github.com/Linnea87/shui-api/issues?q=is%3Aissue+state%3Aclosed) with acceptance criteria, tasks and the pull request that closed it.

### GitHub Kanban board

The user stories were planned and followed on a [GitHub Kanban board](https://github.com/users/Linnea87/projects/21/views/1), from backlog to done. Only the user stories are on the board. The EPICs are separate issues that group the user stories, and each user story has a label for its EPIC.

### Workflow

Every user story was built the same way:

1. A branch from `dev` named `feature/SH-<n>-<description>`
2. Commits in the format `type(SH-<n>): Message`, for example `feat(SH-14): Add create comment endpoint`
3. A pull request to `dev` that closes the story with `Closes #<n>`
4. When everything was done, `dev` was merged into `main` and deployed to production

[Back to top](#table-of-contents)

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- An [AWS account](https://aws.amazon.com/) with credentials configured locally, for example with `aws configure`
- An IAM role for the Lambda functions with access to DynamoDB and CloudWatch Logs
- A [Serverless Framework](https://www.serverless.com/) account and organization

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Linnea87/shui-api.git
cd shui-api
npm install
```

### Configuration

The personal settings are kept in `local.yml`, which is listed in `.gitignore` and never committed. Copy the template and fill in your own values:

```bash
cp local.example.yml local.yml
```

| Key | Description |
| --- | --- |
| `org` | Your Serverless Framework organization |
| `role` | The ARN of the IAM role the Lambda functions run as |
| `jwtSecret` | The secret used to sign and verify JWTs. Use a long random value |

A secure secret can be generated with Node:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Deployment

Deploy to the default `dev` stage:

```bash
npx serverless deploy
```

Deploy to production:

```bash
npx serverless deploy --stage prod
```

Each stage is a separate stack with its own Lambda functions, DynamoDB tables and URL, so testing in `dev` never touches the data in `prod`. The URL of the API is printed in the terminal when the deploy is done.

To remove a stage and all of its resources:

```bash
npx serverless remove --stage <stage>
```

[Back to top](#table-of-contents)

## Endpoints

### Overview

All request and response bodies are JSON. Protected endpoints need the header `Authorization: Bearer <token>`, where the token comes from `POST /auth/login` and is valid for one hour.

| Method | Endpoint | Access | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | Public | 201 | 400, 409 |
| POST | `/auth/login` | Public | 200 | 400, 401 |
| GET | `/posts` | Public | 200 | 400 |
| GET | `/posts?username=<username>` | Public | 200 | 400 |
| GET | `/posts/{postId}` | Public | 200 | 404 |
| POST | `/posts` | Logged-in user or guest | 201 | 400, 401 |
| PUT | `/posts/{postId}` | Post owner | 200 | 400, 401, 403, 404 |
| DELETE | `/posts/{postId}` | Post owner | 204 | 401, 403, 404 |
| GET | `/posts/{postId}/comments` | Public | 200 | 404 |
| POST | `/posts/{postId}/comments` | Logged-in user | 201 | 400, 401, 404 |

> [!NOTE]
> Any endpoint can also return `500` if something unexpected goes wrong on the server.

### Request bodies

| Endpoint | Field | Rules |
| --- | --- | --- |
| `POST /auth/register` | `username` | 3–20 characters: letters, numbers and `_`. Saved in lowercase |
| | `password` | At least 8 characters and at most 72 bytes |
| `POST /auth/login` | `username`, `password` | Required |
| `POST /posts`, `PUT /posts/{postId}` | `title` | 1–100 characters |
| | `content` | 1–1000 characters |
| `POST /posts/{postId}/comments` | `content` | 1–500 characters |

Validation rules for all endpoints:

- Text fields are trimmed before they are validated, so a value with only spaces is rejected.
- Unknown fields in the body are ignored and never saved.
- Unknown query parameters are rejected with `400`.

### Guest posts

`POST /posts` works both with and without a token:

- With a valid token, the post belongs to the user and has `isGuest: false`.
- Without a token, the post becomes a guest post with a generated username, for example `unicorn123`, and `isGuest: true`.
- With an invalid or expired token, the request is rejected with `401`. It never falls back to a guest post.

Guest posts cannot be updated or deleted by anyone, not even by a registered user with the same username.

### Errors

All errors use the same format:

```json
{
  "error": "Post not found"
}
```

[Back to top](#table-of-contents)

## Project structure

### Structure tree

The project is organized by responsibility: each folder holds one kind of code, and every endpoint has its own folder under `functions/`.

```text
shui-api/
├── docs/
│   └── USERSTORIES.md
├── functions/                     # Lambda handlers, one folder per endpoint
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── comments/
│   │   ├── createComment/
│   │   └── getComments/
│   └── posts/
│       ├── createPost/
│       ├── deletePost/
│       ├── getPost/
│       ├── getPosts/
│       └── updatePost/
├── middlewares/                   # Reusable Middy middlewares
│   ├── authenticate.mjs
│   ├── errorHandler.mjs
│   ├── optionalAuth.mjs
│   ├── requireAuth.mjs
│   └── validate.mjs
├── repositories/                  # All DynamoDB access
│   ├── commentRepository.mjs
│   ├── db.mjs
│   ├── postRepository.mjs
│   ├── queryAll.mjs
│   └── userRepository.mjs
├── schemas/                       # Zod schemas for request validation
│   ├── authSchemas.mjs
│   ├── commentSchemas.mjs
│   └── postSchemas.mjs
├── services/                      # Business logic
│   ├── authService.mjs
│   ├── commentService.mjs
│   └── postService.mjs
├── utils/                         # Small shared helpers
│   ├── errors.mjs
│   ├── guestUsername.mjs
│   ├── jwt.mjs
│   ├── password.mjs
│   └── response.mjs
├── local.example.yml
├── package.json
└── serverless.yml
```

### Layers

The code is split into layers, and each layer only talks to the layer below it:

```text
Request → middlewares → handler → service → repository → DynamoDB
```

| Layer | Folder | Responsibility |
| --- | --- | --- |
| Middleware | `middlewares/` | Authentication, body parsing, validation and error handling, shared by all handlers |
| Handler | `functions/` | Reads the request and returns the response. No business logic |
| Service | `services/` | The rules of the API, such as ownership checks, guest posts and that a post must exist |
| Repository | `repositories/` | Reads and writes DynamoDB. The only layer that knows about tables and keys |

Schemas in `schemas/` describe what a valid request looks like, and are used by the `validate` middleware. Helpers in `utils/` are shared by all layers.

A handler is therefore only a few lines. This is the whole handler for `POST /posts`:

```js
const createPostHandler = async (event) => {
  const post = await createPost(event.body, event.user);

  return sendResponse(201, { message: "Post created successfully", post });
};

export const handler = middy(createPostHandler)
  .use(optionalAuth())
  .use(httpJsonBodyParser())
  .use(validate({ body: createPostSchema }))
  .use(errorHandler());
```

[Back to top](#table-of-contents)

## Database design

### Tables

The API uses three DynamoDB tables, one per resource. All tables use on-demand billing (`PAY_PER_REQUEST`), and the table names include the stage, for example `shui-api-posts-prod`.

**Users**

| Attribute | Type | Key |
| --- | --- | --- |
| `username` | String | Partition key |
| `passwordHash` | String | |
| `createdAt` | String (ISO 8601) | |

**Posts**

| Attribute | Type | Key |
| --- | --- | --- |
| `id` | String (UUID) | Partition key |
| `username` | String | Partition key in `UsernameIndex` |
| `type` | String, always `"POST"` | Partition key in `CreatedAtIndex` |
| `createdAt` | String (ISO 8601) | Sort key in both indexes |
| `isGuest` | Boolean | |
| `title` | String | |
| `content` | String | |
| `updatedAt` | String (ISO 8601) | |

**Comments**

| Attribute | Type | Key |
| --- | --- | --- |
| `postId` | String (UUID) | Partition key |
| `createdAtId` | String, `<createdAt>#<id>` | Sort key |
| `id` | String (UUID) | |
| `username` | String | |
| `content` | String | |
| `createdAt` | String (ISO 8601) | |

`type` and `createdAtId` only exist for the database and are never returned by the API.

### Access patterns

Every read uses a key or an index. No request scans a whole table.

| Endpoint | Table or index | Operation |
| --- | --- | --- |
| `POST /auth/register` | Users | `PutItem` that fails if the username exists |
| `POST /auth/login` | Users | `GetItem` by `username` |
| `GET /posts` | Posts, `CreatedAtIndex` | `Query` on `type = "POST"`, newest first |
| `GET /posts?username=` | Posts, `UsernameIndex` | `Query` on `username`, newest first |
| `GET /posts/{postId}` | Posts | `GetItem` by `id` |
| `PUT /posts/{postId}` | Posts | `UpdateItem` that fails if the post is gone |
| `DELETE /posts/{postId}` | Posts, Comments | `DeleteItem` on the post, then `BatchWriteItem` on its comments |
| `GET /posts/{postId}/comments` | Comments | `Query` on `postId`, oldest first |
| `POST /posts/{postId}/comments` | Posts, Comments | `TransactWriteItems`: checks that the post exists and saves the comment |

[Back to top](#table-of-contents)

## Design decisions

### Security

- **Identity only comes from the token.** The username is read from a verified JWT, never from the request body. Tokens are signed with HS256, verification only accepts HS256, and a token is valid for one hour.
- **Passwords are hashed with bcrypt.** Only the hash is stored. Passwords longer than 72 bytes are rejected, because bcrypt silently ignores everything after 72 bytes.
- **Login does not reveal which usernames exist.** A wrong username and a wrong password return the same message, and bcrypt runs even when the user does not exist, so both cases take about the same time.
- **An invalid token is never treated as a guest.** `POST /posts` without a token creates a guest post, but a broken or expired token returns `401`. Otherwise a client with an expired session would post as a guest without noticing.
- **Guest posts cannot be taken over.** The ownership check looks at `isGuest` before it compares usernames, so a user who registers the same name as a guest still cannot change the guest's posts.
- **Responses only contain allowed fields.** The repositories map every item to a fixed list of fields, so internal fields like `type`, `createdAtId` and `passwordHash` never reach the client.

### Data integrity

- **Conditional writes.** Creating a user or a post fails if the key already exists, so two requests at the same time cannot overwrite each other. Updating and deleting a post fails if the post no longer exists, since DynamoDB would otherwise create a new item on update.
- **A comment is saved in a transaction.** The check that the post exists and the write of the comment happen together, so a comment can never be saved on a post that was deleted a moment before.
- **The post is deleted before its comments.** From that moment the transaction above rejects new comments, so deleting the comments afterwards catches all of them. They are deleted in batches of 25, and items DynamoDB could not process are retried with increasing wait times.

### Performance

- **No table scans.** Every request reads with a key or an index, so the response time does not grow with the size of the table. Listing all posts uses `CreatedAtIndex`, where every post has `type = "POST"` and is sorted by `createdAt`.
- **Impossible ids return 404 without a database call.** Post ids are always lowercase UUID v4, so any other value cannot exist. This also stops long ids from reaching DynamoDB, which would fail with a key size error and return `500`.

### Errors and validation

- **Errors are checked in a fixed order.** The middlewares run in the order authentication, body parsing and validation, and the service then checks that the post exists before it checks ownership. The result is always `401`, then `400`, then `404`, then `403`.
- **Unknown query parameters are rejected.** A typo like `?user=jesper` returns `400` instead of silently returning all posts.
- **Unexpected errors never leak details.** The error handler returns a generic `500` and logs the full error with the request id in CloudWatch. Errors from the JSON body parser are mapped to `400`, since the API spec uses `400` for all bad input.

[Back to top](#table-of-contents)

## Testing

### Approach

The API was tested end-to-end against the deployed API with a local script that sends real HTTP requests with `curl`. The script has 150 checks: the status code of every request, and the fields, order and content of the responses. It also reads DynamoDB directly to confirm that comments are deleted together with their post.

The tables below summarize the test cases. All tests pass.

### Auth

| Test | Expected | Passed |
| --- | --- | --- |
| Register a new user | 201, no password in the response | ✅ |
| Register with spaces and uppercase in the username | 201, username trimmed and lowercased | ✅ |
| Register a username that already exists, also in uppercase | 409 | ✅ |
| Register with an empty body | 400 | ✅ |
| Register with a username shorter than 3 characters or with invalid characters | 400 | ✅ |
| Register with a password shorter than 8 characters or longer than 72 bytes | 400 | ✅ |
| Log in with correct credentials | 200, token and username | ✅ |
| Token contains the username and is valid for 1 hour | `exp - iat = 3600` | ✅ |
| Log in with spaces and uppercase in the username | 200 | ✅ |
| Log in with a wrong password | 401 | ✅ |
| Log in with an unknown username | 401, same message as a wrong password | ✅ |
| Log in without password or with an empty body | 400 | ✅ |

### Posts

| Test | Expected | Passed |
| --- | --- | --- |
| Create a post with a token | 201, username from the token, `isGuest: false` | ✅ |
| Server sets `id`, `createdAt` and `updatedAt` | UUID, ISO 8601 and equal timestamps | ✅ |
| Create a post with a tampered token | 401 | ✅ |
| Get all posts without a token | 200, array, newest first | ✅ |
| Filter posts by username | 200, only that user's posts, newest first | ✅ |
| Filter by username in uppercase | 200, same posts | ✅ |
| Filter by an unknown username | 200, `[]` | ✅ |
| Get a single post without a token | 200, the correct post | ✅ |
| Get an unknown post | 404 | ✅ |
| Get a post with an id that is not a UUID or is over the DynamoDB key limit | 404 | ✅ |
| Update own post | 200, title and content changed, `updatedAt` set | ✅ |
| Update keeps `id`, `username`, `createdAt` and `isGuest` | Unchanged | ✅ |
| Update another user's post | 403 | ✅ |
| Update without a token or with a tampered token | 401 | ✅ |
| Update an unknown post | 404 | ✅ |
| Delete another user's post | 403, post still exists | ✅ |
| Delete without a token or with a tampered token | 401 | ✅ |
| Delete own post | 204, no body | ✅ |
| Get, list and delete a deleted post | 404, not in the list, 404 | ✅ |

### Guest posts

| Test | Expected | Passed |
| --- | --- | --- |
| Create a post without a token | 201, `isGuest: true`, generated username like `unicorn123` | ✅ |
| Guest tries to choose a username in the body | Ignored, username is generated | ✅ |
| Create a post with a tampered token | 401, no guest post created | ✅ |
| Filter by the guest's generated username | 200, the guest post is in the list | ✅ |
| Get a guest post by id | 200 | ✅ |
| Register a user with the guest's name and update the guest post | 403 "Guest posts cannot be changed" | ✅ |
| Register a user with the guest's name and delete the guest post | 403 | ✅ |
| Another user updates the guest post | 403, post unchanged | ✅ |

### Comments

| Test | Expected | Passed |
| --- | --- | --- |
| Comment on another user's post | 201, username from the token, `postId` from the path | ✅ |
| Comment on a guest post | 201 | ✅ |
| Comment without a token or with a tampered token | 401 | ✅ |
| Comment without content, with blank content or over 500 characters | 400 | ✅ |
| Comment on an unknown, deleted or non-UUID post | 404 | ✅ |
| Get comments without a token | 200, array, oldest first | ✅ |
| Get comments on a guest post | 200 | ✅ |
| Get comments on a post without comments | 200, `[]` | ✅ |
| Get comments on an unknown, deleted or non-UUID post | 404 | ✅ |
| Another user deletes a post with 30 comments | 403, all 30 comments kept | ✅ |
| Owner deletes a post with 30 comments | 204, all 30 deleted from DynamoDB over two batches | ✅ |

### Validation and errors

| Test | Expected | Passed |
| --- | --- | --- |
| Malformed JSON | 400 | ✅ |
| Wrong `Content-Type` | 400 | ✅ |
| Empty `username` query parameter | 400 | ✅ |
| Unknown query parameter | 400 | ✅ |
| Invalid body without a token on a protected endpoint | 401, not 400 | ✅ |
| Unknown post with another user's token | 404, not 403 | ✅ |
| Internal fields `type` and `createdAtId` | Never returned | ✅ |
| Error responses | Always `{ "error": "..." }` | ✅ |

[Back to top](#table-of-contents)