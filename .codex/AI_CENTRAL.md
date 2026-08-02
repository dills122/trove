# AI Central Integration

Trove's reusable Codex skills follow the same local-link pattern used by Wap Labs, Capsule Corp, and
Reef:

- `.codex/skills/` is ignored by Git.
- `scripts/setup-codex-links.mjs` creates or repairs local symlinks.
- Project-specific `AGENTS.md` and `.codex/steering/*.md` files remain real, tracked files.
- No contributor-specific absolute path is stored in the repository or Git index.

## Setup

With `ai-central` checked out beside Trove:

```sh
npm run codex:links
```

The default template root is `../ai-central/templates`. If AI Central lives elsewhere, set
`AI_CENTRAL_HOME` to either the AI Central repository or its `templates` directory:

```sh
AI_CENTRAL_HOME=/path/to/ai-central npm run codex:links
```

Preview without changing links:

```sh
npm run codex:links -- --dry-run
```

## Curated Selection

The setup command links Trove-relevant reviewed content:

- adapted planning, frontend review, and Hallmark skills
- general engineering lifecycle and brevity skills
- selected Claude engineering, accessibility, Playwright, product, and design-system skills
- product discovery/strategy skills
- planning-with-files
- selected workflow/toolkit skills, excluding React-only helpers
- web accessibility, performance, SEO, and quality skills

It intentionally excludes JVM, Rust, Vue/Nuxt, Terraform, standalone frontend-tooling, greenfield
repo scaffolding, and non-Rush monorepo guidance.

The command preserves any real file or directory already present at a selected link path. It repairs
stale or broken managed symlinks and fails clearly when AI Central cannot be found or exposes duplicate
link names.
