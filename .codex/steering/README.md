# Steering Index

This folder defines enforceable engineering direction for Trove.

## Core Steering Files

- `repository-steering.md`: repository scope, boundaries, and ownership defaults
- `angular-architecture-steering.md`: Angular feature architecture, state boundaries, and dependency rules
- `angular-coding-standards-steering.md`: coding conventions, patterns, and maintainability requirements
- `pwa-offline-steering.md`: PWA behavior, offline-first rules, cache/update strategy, and recovery flows
- `accessibility-wcag22-steering.md`: WCAG 2.2 AA compliance and accessibility quality gates
- `testing-quality-gates-steering.md`: required test layers, CI gates, and merge criteria
- `security-privacy-steering.md`: data minimization, consent, telemetry, and backend privacy constraints
- `frontend-steering.md`: UI implementation guidance for current stack
- `backend-steering.md`: Cloudflare Worker and D1 guidance
- `cloudflare-platform-steering.md`: Cloudflare runtime, D1 governance, API/ops/cost standards
- `mvp-phasing-steering.md`: MVP phase sequencing and scope control

## Usage Rules

- Treat "MUST" rules as blocking requirements.
- Treat "SHOULD" rules as strong defaults; deviations require rationale.
- If steering files conflict, precedence is:
  1. `security-privacy-steering.md`
  2. `accessibility-wcag22-steering.md`
  3. `pwa-offline-steering.md`
  4. architecture/coding files
- PRs that violate MUST rules should not merge.
