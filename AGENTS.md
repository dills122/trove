# Codex Steering

This repository keeps its repo-specific Codex guidance in `.codex/steering/README.md`.

## Default Rules

- Build inside the Rush monorepo model; do not introduce standalone root package-manager flows.
- Keep the product local-first: parsing, analysis, organization, and export stay in the Angular app.
- Treat Cloudflare Worker as cloud-assist only for link health checks in MVP.
- Prefer additive scaffolding and typed contracts over large speculative rewrites.
- Keep worker contracts and Angular DTOs aligned before implementing deeper features.

## Steering Files

- `.codex/steering/repository-steering.md`
- `.codex/steering/frontend-steering.md`
- `.codex/steering/backend-steering.md`
- `.codex/steering/mvp-phasing-steering.md`
