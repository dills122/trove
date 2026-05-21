# Bookmark Cleaner App

Angular standalone frontend for Trove’s local-first bookmark cleanup MVP.

## Stack

- Angular 20 standalone + Signals
- NgRx Signal Store for core app state
- Angular Material + Tailwind CSS
- Angular Service Worker (PWA)
- Dexie/IndexedDB local persistence

## Run (from repo root)

```bash
npm run update
npm run dev:web
```

The app is served at `http://localhost:4200`.

## Project focus

- Import Chrome bookmark HTML
- Analyze duplicates/quality locally
- Review and organize safely (non-destructive)
- Export cleaned output
- Optional cloud-assisted health checks via worker

## Validation commands (from repo root)

```bash
npm run lint
npm run test
npm run build
npm run typecheck
```
