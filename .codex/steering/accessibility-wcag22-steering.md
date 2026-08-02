# Accessibility Steering (WCAG 2.2 AA)

## Compliance Target

- Target WCAG 2.2 Level AA for MVP.

## MUST

- All interactive controls must be keyboard-operable.
- Visible focus indicator must be present and high-contrast.
- Use semantic landmarks (`header`, `nav`, `main`, etc.) and proper heading hierarchy.
- Form inputs must have programmatic labels and error associations.
- Status changes (async completion/errors) must be announced accessibly when needed.
- Color must not be the only means of conveying meaning.
- Maintain sufficient color contrast for text and controls.
- Modal/panel interactions must trap and restore focus correctly.
- File input and drag/drop affordances must have an equivalent labelled keyboard path and clear file
  requirements before selection.
- Parsing, analysis, organization, and export progress must expose meaningful status without announcing
  every item; completion and blocking errors must be announced.
- Tree, duplicate-group, and comparison views must expose programmatic names, relationships, selection,
  and state. Do not encode folder depth or keep/remove decisions through indentation or color alone.
- Destructive or bulk decisions require an accessible preview/summary and an operable undo path.
- Meet WCAG 2.2 target-size, reflow, zoom, and focus-not-obscured requirements for primary workflows.

## Testing Gates (Required)

- Automated a11y scan in CI for key routes (axe-based).
- Manual keyboard-only pass for major flows.
- Screen reader smoke pass for import/dashboard/export.
- Screen reader and keyboard smoke pass for duplicate review, bulk decisions, update banners, offline
  recovery, and large-tree navigation.

## SHOULD

- Prefer native elements over custom role emulation.
- Use Angular CDK a11y primitives (`LiveAnnouncer`, focus management) for complex interactions.
- Keep language clear and task-oriented.

## References

- W3C WCAG 2.2 docs and quick reference.
- Angular accessibility best practices.
