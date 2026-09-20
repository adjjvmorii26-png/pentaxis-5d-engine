# Free Hosting Paths

## Current fit

Pentaxis is a Node/TypeScript + Vite/TanStack Start application with Three.js, Better Auth, PostgreSQL/PGLite, and Nitro.

### Path A — Cloudflare
Use Cloudflare Pages/Workers when the Nitro adapter and runtime-compatible dependencies are confirmed.

- Static/edge domain: `<project>.pages.dev`
- Worker domain: `<worker>.workers.dev`
- Custom domain: `app.example.com`

### Path B — Deno Deploy
Use the new Deno Deploy platform as an alternative for a Node-compatible TypeScript deployment.

- Default domain: `<app>.deno.net`
- Custom domains can be attached when you own the domain.

### Path C — Cloud Run
Use Cloud Run when the full Node/Nitro server output needs a container runtime.

- Default domain: `<service>-<hash>.<region>.run.app`
- Best when SSR/auth/database behavior cannot be cleanly mapped to an edge runtime.

## Database/auth

Keep durable database state outside the deployment filesystem. Supabase/Postgres is the natural shared backend; PGLite should remain a local/development fallback unless its persistence model is deliberately designed for the target host.

## Validation gate

Before enabling a provider workflow:

1. `npm run typecheck`
2. `npm run test`
3. `npm run build`
4. Confirm the generated Nitro output matches the provider adapter.
5. Confirm Better Auth callbacks use the final HTTPS origin.
