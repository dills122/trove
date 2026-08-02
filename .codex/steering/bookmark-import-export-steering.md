# Bookmark Import And Export Steering

## Scope

Trove's primary input is Netscape-style bookmark HTML. Any future XML-based browser format is a
separate adapter. Both formats, their metadata, and every contained URL are untrusted data.

## Input Boundary (MUST)

- Validate extension, media type when available, encoding, byte size, and a format signature before
  loading the complete file. Do not trust extension or `File.type` alone.
- Define and test an explicit maximum file size, node count, nesting depth, attribute length, and
  warning count. Fail with a user-safe error when a bound is exceeded.
- Parse and transform off the UI thread. Worker requests and responses must use discriminated,
  versionable contracts and must support error, timeout/termination, and cancellation cleanup.
- Treat titles, folder names, tags, icons, descriptions, and URLs as plain data. Never attach imported
  nodes to the live DOM, evaluate scripts, use unsafe HTML bindings, or execute bookmarklets.
- Keep format detection, parsing, URL normalization, analysis, and persistence as separate pure
  stages so each can be tested and changed independently.

## HTML And XML Rules (MUST)

- Preserve Netscape bookmark HTML compatibility, including mixed-case tags/attributes, quoted entity
  values, nested folders, missing optional fields, and fail-forward warnings for recoverable entries.
- Do not use a single regular expression as the trust or validation boundary for nested markup.
  Bounded token extraction may supplement, but not replace, structural validation and fixture tests.
- If XML support is added, reject DTDs and external entities, do not resolve external resources or
  processing instructions, detect parser errors, and bound entity/text expansion.
- Decode entities exactly once. Keep source text separate from decoded display values so repeated
  import/export cycles do not corrupt data.

## URL And Bookmarklet Rules (MUST)

- Parse URLs with standards-based URL APIs where applicable; preserve the original URL separately
  from the normalized comparison key.
- Keep `http` and `https` distinct unless an explicit, reviewable rule or health-check result proves a
  relationship. Normalization changes must be deterministic and fixture-tested.
- Classify non-HTTP schemes explicitly. `javascript:` bookmarklets may be inventoried and exported
  only as inert text; they must never become clickable or executable inside Trove.
- Reject or safely quarantine control characters, malformed URLs, oversized values, and schemes that
  the UI/export path does not support.

## Snapshot And Export Rules (MUST)

- Preserve the imported source snapshot as immutable. Analysis and organize operations produce typed
  proposals/action-log entries; they do not mutate the source tree.
- Generate exports only from the source snapshot plus accepted decisions. Preview and final export
  must use the same materialization pipeline.
- Escape text and attribute values for the target format. Never concatenate untrusted titles or URLs
  into markup without a format-aware serializer/escaper.
- Round-trip exported fixtures through supported browser import semantics and Trove's parser. Verify
  folder shape, titles, URL bytes/decoding, bookmarklets, and accepted removals.

## SHOULD

- Report progress for large imports without emitting bookmark content to logs or telemetry.
- Preserve unknown metadata when safe and practical; otherwise emit a visible, counted warning.
- Keep malformed-entry diagnostics bounded and content-minimized so a hostile file cannot flood UI,
  memory, logs, or telemetry.
