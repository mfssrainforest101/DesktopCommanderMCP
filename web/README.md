# Wayfinder web and MCP service

This additive application leaves the desktop stdio client unchanged. Deploy **web/** as a Next.js app; do not deploy the repository's desktop `src/index.ts` as an HTTP server.

## Run

```
cd web
npm ci
npm run build
npm start
```

Routes: `/` website, `/api/health` non-secret readiness, `/api/mcp` authenticated stateless Streamable HTTP.

## Authentication and execution

Configure these via Vercel project environment variables, never commit secrets:

- `MCP_SUPABASE_URL`: your Supabase project URL.
- `MCP_SUPABASE_ANON_KEY`: its public anon/publishable key (NOT the service role key).
- `MCP_ALLOWED_USER_IDS`: comma-separated UUIDs of users explicitly permitted to execute commands.
- `MCP_ENABLE_CLOUD_EXECUTION=true`: explicit operator opt-in. Defaults off.

Clients send a Supabase user access token as `Authorization: Bearer ...`. The server validates it with Supabase Auth and enforces the allowlist. This initial service uses manually supplied bearer tokens; it does not yet provide OAuth discovery, registration, or a browser sign-in flow. Not all MCP clients support manual tokens.

`execution_options` describes modes. `cloud_execute` runs in a fresh Vercel Sandbox, network denied, 30-second lifetime, 4096-character command limit, 16KB per output stream, with cleanup in finally. Sandbox SDK uses managed deployment OIDC; no service-role key or client token enters the sandbox. It has no persistent workspace. Configure rate/spend controls before enabling for multiple users. Sandbox creation is billable; endpoint availability does not prove Sandbox authorization works.

Local desktop execution stays in the original stdio client. The existing `remote` client pairs with its upstream remote service, NOT this deployment. A self-hosted device relay needs a separately implemented, user/device-scoped queue, pairing/revocation, RLS, and a running local agent. No website can silently install that agent or grant access to a computer.

## Deployment

A scoped CLI preview can deploy `web/` with `--project desktop-commander-mcp`. Its `vercel.json` selects Next.js and overrides the desktop project's Node preset for this deployment. For Git deployments after merge, set Project Settings → Build and Deployment → Root Directory to `web` and Framework Preset to Next.js before promoting. Keep the desktop npm package's root build workflow unchanged.

Production should only be promoted after checking the website, health endpoint, missing/invalid/disallowed token rejection, authenticated MCP initialize/tools/list, and an opted-in sandbox call. No production aliases are changed by creating a preview.
