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

## Testing Gates (Required)

- Automated a11y scan in CI for key routes (axe-based).
- Manual keyboard-only pass for major flows.
- Screen reader smoke pass for import/dashboard/export.

## SHOULD

- Prefer native elements over custom role emulation.
- Use Angular CDK a11y primitives (`LiveAnnouncer`, focus management) for complex interactions.
- Keep language clear and task-oriented.

## References

- W3C WCAG 2.2 docs and quick reference.
- Angular accessibility best practices.
