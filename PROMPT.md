# Build edgeapi — Edge-First REST API with Hono

You are building a **portfolio project** for a Senior AI Engineer's public GitHub. It must be impressive, clean, and production-grade. Read these docs before writing any code:

1. **`H01-hono-edge-api.md`** — Complete project spec: architecture, phases, API reference, commit plan. This is your primary blueprint. Follow it phase by phase.
2. **`github-portfolio.md`** — Portfolio goals and Definition of Done (Level 1 + Level 2). Understand the quality bar.
3. **`github-portfolio-checklist.md`** — Pre-publish checklist. Every item must pass before you're done.

---

## Instructions

### Read first, build second
Read all three docs completely before writing a single line of code. Understand Hono's middleware model, the Zod-OpenAPI integration, the multi-runtime architecture, and the quality expectations.

### Follow the phases in order
The project spec has 6 phases. Do them in order:
1. **Project Setup + App Skeleton** — Hono app, error handling, health checks
2. **Database + Auth** — SQLite, JWT, auth routes, auth middleware
3. **Bookmark CRUD** — service layer, OpenAPI-defined routes, pagination
4. **Rate Limiting + Middleware Polish** — sliding window limiter, structured logger
5. **Testing + Multi-Runtime** — Vitest integration tests, Node/Bun/Workers entry points
6. **Documentation** — README with API reference and deployment guide

### Commit frequently
Follow the commit plan in the spec. Use **conventional commits** (`feat:`, `test:`, `refactor:`, `docs:`, `chore:`). Each commit should be a logical unit.

### Quality non-negotiables
- **TypeScript strict mode.** `strict: true` in tsconfig. No `any` types anywhere. Full type inference from Zod schemas.
- **Zod-OpenAPI integration.** Every route defined with `createRoute()` from `@hono/zod-openapi`. Request and response schemas validated automatically.
- **RFC 7807 error responses.** All errors return problem details format. No raw strings or ad-hoc error objects.
- **Edge-compatible libraries.** Use `jose` for JWT (not jsonwebtoken — it needs Node crypto). Use Web Crypto where possible.
- **Middleware composability.** Each middleware is independent, testable, and configurable. No global state.
- **Rate limiting correctness.** Sliding window with proper header emission. Must handle concurrent requests safely.
- **Lint clean.** ESLint must pass with zero warnings. TypeScript must compile with zero errors.
- **Tests with Hono test client.** Use `app.request()` — no HTTP server needed. Fast, deterministic tests.

### What NOT to do
- Don't use Express-style middleware patterns. Hono has its own middleware API — learn it.
- Don't use `jsonwebtoken` or `bcrypt` native packages. They won't work on edge runtimes. Use `jose` and Web Crypto / `bcryptjs`.
- Don't skip OpenAPI schema generation. The auto-generated spec is a key differentiator.
- Don't hardcode environment values. Use Hono's typed env bindings.
- Don't leave Swagger UI integration as a stub. Either implement it or remove the route.
- Don't ignore the multi-runtime story. The app must at minimum run on Node.js and Bun.

---

## GitHub Username

The GitHub username is **devaloi**. The npm package scope is not needed (not publishing to npm). Use `edgeapi` as the project name in package.json.

## Start

Read the three docs. Then begin Phase 1 from `H01-hono-edge-api.md`.
