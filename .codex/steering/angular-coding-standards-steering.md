# Angular Coding Standards Steering

## MUST

- Follow Angular style guide conventions for naming and file layout.
- Use strict TypeScript and avoid `any` unless annotated with rationale.
- Use `interface` for extensible object contracts and discriminated `type` unions for finite states,
  worker messages, and result envelopes.
- Accept `unknown` at file, storage, worker, and API boundaries; validate/narrow before domain use.
- Keep files cohesive and single-purpose.
- Handle error/loading/empty states explicitly for all async UI workflows.
- Validate all external data inputs (file parse and API response boundaries).
- Keep lint and format checks passing in CI.
- New or materially modified components must use `ChangeDetectionStrategy.OnPush` unless a documented
  constraint requires otherwise.
- Keep template expressions side-effect-free; do not parse, normalize, sort large collections, or call
  network/storage APIs from templates.

## SHOULD

- Prefer `inject()` over constructor injection when it improves locality.
- Prefer signal-based `input()`/`output()` and computed derivation for new components when compatible
  with the surrounding implementation.
- Use descriptive handler names by action (`saveSettings`, not `onClick`).
- Use semantic HTML first, then ARIA enhancements where needed.
- Keep component templates readable and shallow.

## Naming and Structure

- Feature folders: kebab-case.
- Components: `*.component.ts` with matching template/style files when needed.
- Utilities should be framework-agnostic when possible.
- Browser-global access belongs behind injectable adapters/services when it affects tests, SSR-like
  tooling, service workers, install prompts, storage, or network state.

## Documentation

- Complex logic should include short intent comments.
- Breaking architectural decisions should be captured in repo docs.
