# MVP Phasing Steering

Implement in this order unless explicitly reprioritized:

1. Local import engine (upload, parse, tree render)
2. Analysis (stats, top domains, malformed URLs)
3. Duplicate workflows
4. Organize/categorize workflow
5. Export workflow
6. Cloudflare health-check integration

## Delivery Constraints

- Keep each phase shippable behind clear routes and typed state.
- Favor vertical slices that include minimal tests.
- Avoid speculative post-MVP scope in active implementation PRs.
