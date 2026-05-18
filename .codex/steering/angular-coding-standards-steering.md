# Angular Coding Standards Steering

## MUST

- Follow Angular style guide conventions for naming and file layout.
- Use strict TypeScript and avoid `any` unless annotated with rationale.
- Prefer `interface` for object shape contracts.
- Keep files cohesive and single-purpose.
- Handle error/loading/empty states explicitly for all async UI workflows.
- Validate all external data inputs (file parse and API response boundaries).
- Keep lint and format checks passing in CI.

## SHOULD

- Prefer `inject()` over constructor injection when it improves locality.
- Use descriptive handler names by action (`saveSettings`, not `onClick`).
- Use semantic HTML first, then ARIA enhancements where needed.
- Keep component templates readable and shallow.

## Naming and Structure

- Feature folders: kebab-case.
- Components: `*.component.ts` with matching template/style files when needed.
- Utilities should be framework-agnostic when possible.

## Documentation

- Complex logic should include short intent comments.
- Breaking architectural decisions should be captured in repo docs.
