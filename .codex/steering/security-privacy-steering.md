# Security and Privacy Steering

## Privacy Model

- Bookmark file contents are local by default.
- URL transmission only occurs for user-approved health checks.

## MUST

- Health-check consent must be explicit, revocable, and persisted in settings.
- Telemetry must be anonymized and must not include bookmark titles, full URL lists, or file contents.
- Validate and sanitize all user-supplied file input before processing.
- Enforce request validation on backend endpoints.
- Avoid exposing secrets in frontend bundles or logs.

## Data Handling

- Minimize stored data to what is required for UX continuity.
- Keep local workspace data isolated per app origin.
- Provide user-visible disclosure for what cloud calls send.

## SHOULD

- Add structured error logging with redaction for sensitive fields.
- Include security review checklist before production launch.
