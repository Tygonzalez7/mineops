# App Store + release runbook

MineOps ships as:

1. **Web / PWA** — Vercel auto-deploys from `main` (`https://mineops-ten.vercel.app`).
2. **Native iOS** — Capacitor wrapper, bundle ID **`com.mineops.app`**.

This document is the release + update runbook. Apple Developer enrollment and App Store Connect submission require Ty’s Apple account and are **out of band**.

---

## What is in this repo

| Piece | Location |
|--------|----------|
| Capacitor config | `capacitor.config.ts` — `appId: com.mineops.app` |
| iOS project | `ios/App` (Xcode) |
| Privacy strings | `ios/App/App/Info.plist` (camera + photo library for checks) |
| Icons / splash | `resources/` + `public/icons/` placeholders — replace before first store shot |
| Runtime config | `VITE_*` at build + `public/config.js` → `window.__MINEOPS_CONFIG__` |
| OTA (JS bundle) | [@capgo/capacitor-updater](https://capgo.app) — default when a `VITE_CAPGO_KEY` is set |

---

## Environment (no secrets in git)

Copy `.env.example` to `.env` locally. **Never commit `.env`.**

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Vite + optional runtime | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Vite + optional runtime | Anon key (RLS-protected) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Vite | Empty = payment-ready, not live |
| `VITE_PLATFORM_ADMIN_EMAILS` | Vite | Comma-separated super-admin emails (Ty) |
| `VITE_APP_VERSION` | Vite | Shown / used for native versioning |
| `VITE_CAPGO_KEY` | Vite / Capgo | Enables JS OTA; omit = App Store-only updates |
| `VITE_WEB_ORIGIN` | Vite | Share-code links |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Edge Function only | Required for live charges — not set = stub |

Native builds can override Vite bake-ins by editing `public/config.js` (or injecting it during CI) without resubmitting the IPA for config-only changes.

---

## Web / PWA updates (always)

- Merge to `main` → Vercel production deploy.
- PWA users (Safari “Add to Home Screen”) pick up the new JS on next load.
- No App Store review.

---

## Native update strategy (default)

**Prefer Capgo OTA for JS/CSS/HTML** after the app is live. Native shell (plugins, Info.plist, icons, permissions) still needs a store build.

### When to OTA (Capgo)

- Screen copy, UI polish, most React changes, feature flags, empty-state copy
- New pages that do not need new native plugins

Enable:

1. Create a Capgo app, put the key in Vercel + CI as `VITE_CAPGO_KEY` / `CAPGO_TOKEN`.
2. After `npm run build`, run `npx @capgo/cli bundle upload` (see `.github/workflows/release.yml`).
3. `main.jsx` calls `CapacitorUpdater.notifyAppReady()` only on native + when a key exists.

If Capgo is not configured, skip OTA and use the App Store checklist below for every release.

### When you must submit a new IPA

- First store version
- New Capacitor plugin, permission, or Info.plist string
- Icon / splash / bundle ID / version marketing number
- iOS SDK / Xcode bump required by Apple

---

## TestFlight + App Store Connect

**Out of this repo:** enroll in the Apple Developer Program (Ty), create the app record.

### First time (Apple)

1. [developer.apple.com](https://developer.apple.com) → enroll (Individual or Organization).
2. App Store Connect → **My Apps** → **+** → iOS.
3. Bundle ID: `com.mineops.app` (must match `capacitor.config.ts`).
4. Create a distribution certificate + App Store provisioning profile (Xcode “Automatically manage signing” is fine on Ty’s Mac).
5. Privacy Nutrition Labels: camera + photo library are used for pre-start / vehicle check evidence. No tracking unless you later add analytics SDKs.

### Each native release

1. Bump versions:
   - `package.json` `version`
   - `VITE_APP_VERSION`
   - iOS `MARKETING_VERSION` + increment `CURRENT_PROJECT_VERSION` (CFBundleVersion)
2. `npm ci && npm run lint && npm run build`
3. `npx cap sync ios`
4. Open `ios/App/App.xcworkspace` in Xcode on a Mac.
5. Replace placeholder icons (`AppIcon`) and splash with final 1024×1024 marketing art.
6. Product → Archive → Distribute → **App Store Connect** → TestFlight.
7. Add release notes (what changed, especially checks / VisionLink / billing “not live”).
8. Submit TestFlight group to internal testers, then external if needed.
9. When green: submit for App Review with the checklist below.

### App Review checklist (every store submission)

- [ ] Demo or reviewer login (mine code + operator) in Review Notes
- [ ] Camera / Photos usage described (equipment checks, not social)
- [ ] No fire-extinguisher copy left in screenshots
- [ ] Billing screen does **not** charge unless Stripe live keys are on
- [ ] Privacy Policy URL (host on the Vercel site)
- [ ] Support URL + Ty contact email
- [ ] Export compliance: usually “no encryption beyond HTTPS”
- [ ] Screenshots: iPhone 6.7" + 6.1" (and iPad if you declare it)

---

## CI notes (IPA)

GitHub Actions cannot produce a signed IPA without Apple certs in secrets. `.github/workflows/release.yml`:

- Always: `npm ci`, lint, build
- Optional: Capgo upload when `CAPGO_TOKEN` is present
- Optional: `npx cap sync ios` as a smoke check (does not codesign)

To build an IPA in CI later: add an Apple certificate, API key (`APP_STORE_CONNECT_API_KEY`), and a Mac or `macos-14` runner with Fastlane `deliver` / `pilot`. Until then, archive from Xcode.

---

## Capacitor local commands

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios    # macOS + Xcode only
```

Linux/CI can generate and sync the iOS folder; **signing and TestFlight upload require a Mac**.
