# Security and Privacy Steering

## Privacy Model

- Bookmark file contents are local by default.
- URL transmission only occurs for user-approved health checks.

## MUST

- Health-check consent must be explicit, revocable, and persisted in settings.
- Telemetry must be anonymized and must not include bookmark titles, full URL lists, or file contents.
- Validate and sanitize all user-supplied file input before processing.
- Treat bookmark HTML/XML, filenames, titles, folder names, icons, tags, and URLs as untrusted data.
  Never execute imported scripts/bookmarklets or render imported markup with unsafe HTML APIs.
- Bound import file size, node count, nesting, text/attribute lengths, parser work, warnings, and worker
  lifetime before accepting a file into the workspace.
- Escape all export text/attribute values for the selected format and test malicious round trips.
- Enforce request validation on backend endpoints.
- Link-health fetches must allow only HTTP(S), reject credentials and unsafe target classes, revalidate
  every redirect hop, and block loopback, private, link-local, reserved, and provider-metadata targets.
- Apply request/body/chunk/concurrency/redirect/response-size/time bounds so URL checks cannot become an
  SSRF proxy or resource-exhaustion channel.
- Avoid exposing secrets in frontend bundles or logs.

## Data Handling

- Minimize stored data to what is required for UX continuity.
- Keep local workspace data isolated per app origin.
- Store the minimum bookmark fields needed for recovery. Provide a clear local-data deletion/reset path.
- Provide user-visible disclosure for what cloud calls send.
- Consent applies to the exact URL set and purpose shown to the user; it does not authorize uploads of
  titles, folder paths, tags, file contents, or later unrelated telemetry.

## SHOULD

- Add structured error logging with redaction for sensitive fields.
- Include security review checklist before production launch.
