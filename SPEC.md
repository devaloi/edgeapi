# H01: edgeapi — Edge-First REST API with Hono

**Catalog ID:** H01 | **Size:** S | **Language:** TypeScript / Hono 4.x
**Repo name:** `edgeapi`
**One-liner:** An edge-first REST API built with Hono — middleware chain, JWT auth, rate limiting, Zod-validated schemas, OpenAPI 3.1 generation, and multi-runtime support (Node.js, Bun, Cloudflare Workers).

---

## Why This Stands Out

- **Hono 4.x** — the fastest-growing edge-native framework, shows awareness of the post-Express ecosystem
- **OpenAPI 3.1 auto-generation** — schemas defined once in Zod, OpenAPI spec generated automatically via `@hono/zod-openapi`
- **Multi-runtime** — runs on Node.js, Bun, and Cloudflare Workers without code changes
- **Full middleware chain** — CORS, structured logging, JWT auth, rate limiting, error handling — all composable
- **Zod validation everywhere** — request params, body, query, and response schemas all type-safe and validated
- **Edge computing patterns** — D1 database adapter, KV-compatible rate limiter, minimal cold start
- **TypeScript strict mode** — zero `any`, full type inference from Zod schemas to route handlers
- **Vitest tests** — using Hono's built-in test client for fast, realistic integration tests

---

## Architecture

```
edgeapi/
├── src/
│   ├── index.ts                  # Entry point: create app, attach routes, export
│   ├── app.ts                    # Hono app factory with global middleware
│   ├── env.ts                    # Environment variable types and validation
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification middleware (bearer token)
│   │   ├── rateLimiter.ts        # Sliding window rate limiter (in-memory Map)
│   │   ├── errorHandler.ts       # Global error handler → RFC 7807 problem details
│   │   └── logger.ts             # Structured request/response logger
│   ├── routes/
│   │   ├── index.ts              # Route aggregator
│   │   ├── auth.routes.ts        # POST /auth/login, POST /auth/register
│   │   ├── bookmarks.routes.ts   # Full CRUD: GET, POST, PUT, DELETE /bookmarks
│   │   └── health.routes.ts      # GET /health, GET /health/ready
│   ├── schemas/
│   │   ├── auth.schema.ts        # Zod schemas: LoginRequest, RegisterRequest, TokenResponse
│   │   ├── bookmark.schema.ts    # Zod schemas: CreateBookmark, UpdateBookmark, Bookmark, BookmarkList
│   │   ├── common.schema.ts      # Shared: PaginationQuery, ErrorResponse, IdParam
│   │   └── openapi.ts            # OpenAPI route definitions using @hono/zod-openapi
│   ├── services/
│   │   ├── auth.service.ts       # Password hashing, JWT generation, user lookup
│   │   └── bookmark.service.ts   # Bookmark CRUD logic
│   ├── db/
│   │   ├── client.ts             # Database client factory (better-sqlite3 / D1)
│   │   ├── schema.sql            # Table definitions (users, bookmarks)
│   │   ├── migrate.ts            # Simple migration runner
│   │   └── seed.ts               # Seed data for development
│   ├── lib/
│   │   ├── jwt.ts                # JWT sign/verify with jose library
│   │   ├── password.ts           # Password hash/verify (bcrypt or web crypto)
│   │   └── errors.ts             # Custom error classes (AppError, NotFound, Unauthorized)
│   └── types/
│       └── env.d.ts              # Hono environment bindings type
├── tests/
│   ├── setup.ts                  # Test environment setup
│   ├── auth.test.ts              # Auth endpoint tests
│   ├── bookmarks.test.ts         # Bookmark CRUD tests
│   ├── middleware.test.ts         # Middleware unit tests
│   └── helpers.ts                # Auth token helpers, test fixtures
├── wrangler.toml                 # Cloudflare Workers config (optional deployment)
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── .env.example
├── .gitignore
├── .eslintrc.json
├── LICENSE
└── README.md
```

---

## API Reference

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Register new user |
| `POST` | `/auth/login` | No | Login, receive JWT |

### Bookmark Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/bookmarks` | Yes | List bookmarks (paginated) |
| `GET` | `/bookmarks/:id` | Yes | Get bookmark by ID |
| `POST` | `/bookmarks` | Yes | Create bookmark |
| `PUT` | `/bookmarks/:id` | Yes | Update bookmark |
| `DELETE` | `/bookmarks/:id` | Yes | Delete bookmark |

### System Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `GET` | `/health/ready` | No | Readiness check (DB connected) |
| `GET` | `/doc` | No | OpenAPI JSON spec |
| `GET` | `/swagger` | No | Swagger UI (optional) |

### Error Response Format (RFC 7807)

```json
{
  "type": "https://edgeapi.dev/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Bookmark with id '123' not found",
  "instance": "/bookmarks/123"
}
```

### Rate Limiting Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Window reset time (Unix timestamp) |
| `Retry-After` | Seconds until next allowed request (when limited) |

---

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | Hono 4.x |
| Language | TypeScript 5.x (strict mode) |
| Validation | Zod + @hono/zod-openapi |
| Auth | JWT via `jose` (edge-compatible) |
| Database | better-sqlite3 (local) / D1 (Cloudflare) |
| Testing | Vitest + Hono test client |
| Linting | ESLint + TypeScript strict |
| Runtimes | Node.js 22+, Bun 1.x, Cloudflare Workers |

---

## Phased Build Plan

### Phase 1: Project Setup + App Skeleton

**1.1 — Project initialization**
- `npm init`, install hono, @hono/zod-openapi, zod, jose, better-sqlite3
- Dev deps: vitest, typescript, eslint, @types/better-sqlite3
- tsconfig.json with strict: true, target: ESNext, module: ESNext
- package.json scripts: dev, build, test, lint
- .gitignore, .env.example, LICENSE

**1.2 — Hono app factory**
- Create Hono app with typed environment bindings
- Attach global middleware: CORS (hono/cors), logger, error handler
- Health check routes: `/health` returns `{ status: "ok" }`
- Entry point exports for Node.js (`@hono/node-server`), Bun, and Workers

**1.3 — Error handling**
- Custom error classes: AppError, NotFoundError, UnauthorizedError, ValidationError
- Global error handler middleware: catch errors, return RFC 7807 problem details
- Tests: error handler returns correct status codes and format

### Phase 2: Database + Auth

**2.1 — Database setup**
- SQLite schema: `users` table (id, email, password_hash, name, created_at, updated_at)
- `bookmarks` table (id, user_id, url, title, description, tags, created_at, updated_at)
- Migration runner: read schema.sql, apply to database
- Seed script with sample data
- Tests: migration creates tables, seed inserts data

**2.2 — Auth service**
- Password hashing with bcrypt (or Web Crypto PBKDF2 for edge compat)
- JWT generation/verification with jose (EdDSA or HS256)
- Token payload: { sub: userId, email, iat, exp }
- Access token: 15 min expiry
- Tests: hash/verify passwords, sign/verify tokens

**2.3 — Auth routes + middleware**
- `POST /auth/register` — validate with Zod, hash password, create user, return token
- `POST /auth/login` — validate credentials, return token
- JWT auth middleware: extract Bearer token, verify, set user in context
- Zod schemas for all request/response types
- Tests: register flow, login flow, invalid credentials, expired token

### Phase 3: Bookmark CRUD

**3.1 — Bookmark service**
- Create, read (by ID), list (paginated), update, delete
- List supports: pagination (limit/offset), sort (created_at, title)
- User scoping: all operations filtered by authenticated user's ID
- Tests: full CRUD operations, pagination, user isolation

**3.2 — Bookmark routes with OpenAPI**
- Define all routes using `@hono/zod-openapi` createRoute()
- Each route: Zod request schema, Zod response schema, OpenAPI metadata
- Response includes pagination metadata: { data: [...], total, page, pageSize }
- OpenAPI spec served at `/doc`
- Tests: all CRUD endpoints, validation errors, not found, unauthorized

### Phase 4: Rate Limiting + Middleware Polish

**4.1 — Rate limiter middleware**
- Sliding window algorithm with in-memory Map
- Configurable: requests per window, window duration
- Key by: IP address (or user ID if authenticated)
- Set rate limit headers on all responses
- Return 429 with Retry-After when exceeded
- Tests: allow requests under limit, block over limit, window reset

**4.2 — Structured logger**
- Log: method, path, status, duration, request ID
- Request ID: X-Request-ID header or generated UUID
- JSON format for production, pretty format for development
- Tests: logs contain expected fields

### Phase 5: Testing + Multi-Runtime

**5.1 — Integration test suite**
- Full auth flow: register → login → use token
- Full bookmark CRUD flow with auth
- Rate limiting behavior
- Error scenarios: bad input, not found, unauthorized, rate limited
- Use Hono test client (no HTTP server needed)

**5.2 — Multi-runtime verification**
- Node.js entry: `src/node.ts` using `@hono/node-server`
- Bun entry: `src/bun.ts` using Bun.serve
- Workers entry: `src/worker.ts` with default export
- Verify app starts on at least Node.js and Bun
- Document runtime differences in README

### Phase 6: Documentation

**6.1 — README**
- Badges (CI, TypeScript, license)
- Quick start (npm install, dev server, curl examples)
- Full API reference table
- OpenAPI spec generation instructions
- Multi-runtime deployment guide
- Architecture overview
- Tech stack rationale (why Hono over Express/Fastify)

---

## Commit Plan

1. `chore: scaffold Hono project with TypeScript config`
2. `feat: add Hono app factory with global middleware`
3. `feat: add health check routes`
4. `feat: add error handling with RFC 7807 problem details`
5. `feat: add SQLite database with migrations and seed`
6. `feat: add auth service with JWT and password hashing`
7. `feat: add auth routes with Zod validation`
8. `feat: add JWT auth middleware`
9. `feat: add bookmark CRUD service`
10. `feat: add bookmark routes with OpenAPI schemas`
11. `feat: add rate limiter middleware`
12. `feat: add structured request logger`
13. `test: add integration tests for all endpoints`
14. `feat: add multi-runtime entry points (Node, Bun, Workers)`
15. `docs: add README with API reference and deployment guide`
