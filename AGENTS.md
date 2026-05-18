# Codex Steering

This repository keeps its repo-specific Codex guidance in `.codex/steering/README.md`.

## Default Rules

- Build inside the Rush monorepo model; do not introduce standalone root package-manager flows.
- Keep the product local-first: parsing, analysis, organization, and export stay in the Angular app.
- Treat Cloudflare Worker as cloud-assist only for link health checks in MVP.
- Prefer additive scaffolding and typed contracts over large speculative rewrites.
- Keep worker contracts and Angular DTOs aligned before implementing deeper features.
- Keep offline functionality and accessibility quality gates as first-class requirements.

## Steering Files

- `.codex/steering/repository-steering.md`
- `.codex/steering/angular-architecture-steering.md`
- `.codex/steering/angular-coding-standards-steering.md`
- `.codex/steering/pwa-offline-steering.md`
- `.codex/steering/accessibility-wcag22-steering.md`
- `.codex/steering/testing-quality-gates-steering.md`
- `.codex/steering/security-privacy-steering.md`
- `.codex/steering/frontend-steering.md`
- `.codex/steering/backend-steering.md`
- `.codex/steering/cloudflare-platform-steering.md`
- `.codex/steering/mvp-phasing-steering.md`
