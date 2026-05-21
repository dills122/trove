# PWA QA Checklist

## Scope
Manual verification for Trove PWA installability, offline behavior, and update flows.

## Preconditions
- Build and serve production assets (`ngsw-worker.js` must be present).
- Test on:
  - Chrome desktop (latest)
  - Chrome Android (latest)
  - Safari iOS (latest, manual install path)

## Desktop Chrome
1. Open app over HTTPS.
2. Confirm no console errors related to service worker registration.
3. Confirm header shows no offline banner while online.
4. Trigger install:
   - Verify Install CTA appears when eligible.
   - Click `Install` and confirm installed app launches standalone.
5. Hard refresh while online and verify app still loads.
6. Go offline (DevTools Network Offline) and reload:
   - App shell loads.
   - Existing local snapshot/workspace can be viewed.
   - Offline banner appears.
7. Return online and verify offline banner clears.
8. Simulate update deployment:
   - Confirm `Update available` banner appears.
   - Click `Later`, refresh, and confirm same hash remains dismissed.
   - Deploy a newer build, verify banner appears again.
   - Click `Reload` and verify app reloads to new version.

## Android Chrome
1. Open app over HTTPS.
2. Verify install prompt/CTA behavior and install succeeds.
3. Launch from homescreen and verify standalone display.
4. Offline reload test from homescreen:
   - App shell renders.
   - Offline banner appears.
5. Return online and verify normal behavior resumes.

## iOS Safari
1. Open app in Safari.
2. Verify manual install hint appears:
   - "Tap Share and choose Add to Home Screen" guidance.
3. Use Share -> Add to Home Screen.
4. Launch from homescreen and verify standalone appearance.
5. Offline reload test:
   - App shell renders.
   - Offline banner appears.

## Accessibility checks
1. Keyboard-only navigation reaches banner actions.
2. `Reload` and `Later` actions are focus-visible and operable via Enter/Space.
3. Banner copy remains legible at 200% zoom.

## Pass criteria
- App is installable on Chrome desktop and Android.
- iOS path is clearly guided and successful via Add to Home Screen.
- Offline reload works for app shell and local review workflow.
- Update flow is actionable and recoverable.
