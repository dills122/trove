# Angular Architecture Steering

## Scope

Defines scalable Angular architecture for Trove with standalone APIs, Signals, workers, and local-first persistence.

## MUST

- Organize code by feature/domain, not by file type.
- Keep route-level features under `src/app/features/*`.
- Keep shared primitives under `src/app/shared/*`.
- Keep cross-feature domain logic in `src/app/core/*`.
- Use standalone components and route definitions; no NgModule-based feature architecture.
- Use NgRx Signal Store for shared workflow state and action history; use component signals for local,
  ephemeral presentation state. Do not introduce a second global state system without a decision note.
- Treat worker contracts as public APIs: changes require corresponding tests and migration notes.
- Keep parsing/analysis/export compute on workers, not main UI thread.
- Keep worker creation, cancellation, termination, progress, and error translation behind services;
  components must not manage raw worker event protocols.
- Keep source-import snapshot immutable and separate from working/proposed trees.
- Keep cloud-assisted operations behind explicit service boundaries (`core/api` / `core/services`).

## SHOULD

- Use Signals for local UI and workspace state.
- Keep components presentational where feasible; move orchestration into stores/services.
- Keep functions pure for parse/normalize/analyze transforms.
- Enforce explicit DTO mapping between backend and UI models.
- Derive view state with computed signals/selectors; do not duplicate persisted or derived state across
  components and stores.

## Forbidden

- Business logic embedded heavily in templates.
- Direct backend fetch calls inside components.
- Mutating imported source snapshot.
- Persisting component instances, DOM nodes, browser events, or other non-serializable objects in stores.
