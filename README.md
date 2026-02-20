# edgeapi

[![CI](https://github.com/devaloi/edgeapi/actions/workflows/ci.yml/badge.svg)](https://github.com/devaloi/edgeapi/actions/workflows/ci.yml)

A type-safe, edge-first REST API built with [Hono](https://hono.dev/). Features structured routing, a composable middleware stack, Zod request validation, and a pluggable storage adapter pattern — ready for Cloudflare Workers, Deno Deploy, Bun, or Node.js.

## Architecture

```
src/
├── index.ts                 # Node.js entry point (@hono/node-server)
├── app.ts                   # Hono app factory — wires middleware + routes
├── types.ts                 # App-level type bindings (Hono env)
├── errors.ts                # AppError class, RFC 7807 error responses
├── schemas/
│   └── note.ts              # Zod schemas: CreateNote, UpdateNote, ListQuery
├── middleware/
│   ├── request-id.ts        # X-Request-Id injection / passthrough
│   ├── logger.ts            # Structured JSON request logging
│   ├── auth.ts              # Bearer token API key authentication
│   └── rate-limit.ts        # Fixed-window rate limiter with headers
├── storage/
│   ├── adapter.ts           # StorageAdapter interface
│   └── memory.ts            # In-memory implementation
└── routes/
    ├── health.ts            # GET /health, GET /ready
    └── notes.ts             # CRUD /api/v1/notes
```

### Request Flow

```
Request → Request ID → Logger → CORS → Rate Limit → Auth → Route Handler → Response
```

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | [Hono](https://hono.dev/) v4 |
| Validation | [Zod](https://zod.dev/) v3 |
| Runtime | Node.js 22+ (portable to any edge runtime) |
| Language | TypeScript 5 (strict mode) |
| Testing | [Vitest](https://vitest.dev/) |

## Prerequisites

- Node.js >= 22.0.0

## Getting Started

```bash
git clone https://github.com/devaloi/edgeapi.git
cd edgeapi
npm install
```

Copy the environment file and adjust as needed:

```bash
cp .env.example .env
```

### Run in Development

```bash
npm run dev
```

### Run in Production

```bash
npm start
```

The server starts on `http://localhost:3000` by default.

## API Reference

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Returns `{ status: "ok", timestamp }` |
| `GET` | `/ready` | No | Returns readiness with storage check |

### Notes

All `/api/v1/notes` endpoints require `Authorization: Bearer <API_KEY>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/notes` | List notes (paginated) |
| `POST` | `/api/v1/notes` | Create a note |
| `GET` | `/api/v1/notes/:id` | Get a note by ID |
| `PUT` | `/api/v1/notes/:id` | Update a note |
| `DELETE` | `/api/v1/notes/:id` | Delete a note |

**Query parameters for list:** `?limit=20&offset=0&tag=...`

### Examples

```bash
# Health check
curl http://localhost:3000/health

# Create a note
curl -X POST http://localhost:3000/api/v1/notes \
  -H "Authorization: Bearer dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello", "content": "World", "tags": ["demo"]}'

# List notes
curl http://localhost:3000/api/v1/notes \
  -H "Authorization: Bearer dev-api-key"

# Get a note
curl http://localhost:3000/api/v1/notes/<id> \
  -H "Authorization: Bearer dev-api-key"

# Update a note
curl -X PUT http://localhost:3000/api/v1/notes/<id> \
  -H "Authorization: Bearer dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete a note
curl -X DELETE http://localhost:3000/api/v1/notes/<id> \
  -H "Authorization: Bearer dev-api-key"
```

### Error Responses

Errors follow [RFC 7807](https://tools.ietf.org/html/rfc7807) Problem Details:

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Note with id 'abc' not found",
  "instance": "/api/v1/notes/abc"
}
```

## Middleware

| Middleware | Description |
|-----------|-------------|
| **Request ID** | Generates or forwards `X-Request-Id` for distributed tracing |
| **Logger** | Structured JSON logs: method, path, status, duration, request ID |
| **CORS** | Cross-origin resource sharing via Hono built-in |
| **Rate Limit** | Fixed-window rate limiter with `X-RateLimit-*` headers |
| **Auth** | Bearer token API key validation with configurable path exclusions |

## Storage Adapter

The `StorageAdapter` interface abstracts data persistence:

```typescript
interface StorageAdapter {
  get(id: string): Promise<Note | null>;
  list(options: ListOptions): Promise<ListResult>;
  create(data: CreateNoteInput): Promise<Note>;
  update(id: string, data: UpdateNoteInput): Promise<Note | null>;
  delete(id: string): Promise<boolean>;
}
```

The included `MemoryStorage` implementation is suitable for development and testing. Implement the interface for your production backend (KV, D1, PostgreSQL, etc.).

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `API_KEY` | `dev-api-key` | Bearer token for API authentication |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck
```

## License

MIT
