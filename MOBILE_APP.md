# Kidzopedia — Mobile App (Capacitor)

The mobile apps wrap the **exact same** Vite/React web build (`dist/`). There is **one codebase and one UI** — the Android/iOS apps and the website are identical, and all connect to the **same Supabase backend** (via the `VITE_SUPABASE_*` env vars baked into the build). Nothing about the web app's behaviour changes.

## What was added (all additive)
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`
- `capacitor.config.ts` — `appId: com.unimisk.kidzopedia`, `appName: Kidzopedia`, `webDir: dist`
- `android/` — native Android project (Gradle)
- `public/manifest.webmanifest` + Apple meta in `index.html` — makes the web app **installable** (Android PWA + iOS "Add to Home Screen")
- `src/pages/GetApp.tsx` + route **`/get-app`** — an on-brand download page (uses the existing `LandingLayout`/`SEO`/`Button`, so the look is unchanged)
- `public/downloads/` — where the distributable APK is served from (`/downloads/kidzopedia.apk`)

## Rebuild after any web change
```bash
npm run build        # rebuild the web app into dist/
npx cap sync         # copy dist/ + plugins into the native projects
```

## Android — build the APK
Requires JDK 17 + Android SDK (both already installed on this machine; `ANDROID_HOME` is set).

Debug build (installable, for testing / internal sharing):
```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
# output: android/app/build/outputs/apk/debug/app-debug.apk
```

Make it downloadable from the website:
```bash
cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/kidzopedia.apk
```
Then redeploy the web app. Visitors get it at **/get-app** (or directly `/downloads/kidzopedia.apk`).

> Tip: open the native project in Android Studio with `npx cap open android` to build/run on a device or emulator.

### Release (signed) build — for Play Store or public distribution
A debug APK is fine for testing but should not be shipped publicly. For a release build:
```bash
# 1) create a keystore once
keytool -genkey -v -keystore kidzopedia.keystore -alias kidzopedia -keyalg RSA -keysize 2048 -validity 10000
# 2) add signingConfig to android/app/build.gradle (or use Android Studio → Build → Generate Signed Bundle/APK)
cd android && ./gradlew assembleRelease   # APK   (or bundleRelease for an .aab for Play Store)
```
Keep the keystore + passwords safe — you need the same key for every future update.

## iOS — needs a Mac
Apple does not allow installing apps from a website (no sideloading), so iOS has two real paths:
1. **Add to Home Screen** (works today, no Mac): on iPhone, open the site in Safari → Share → *Add to Home Screen*. This is what the `/get-app` page instructs.
2. **Native App Store / TestFlight app** (needs a Mac + Apple Developer account):
   ```bash
   npm i @capacitor/ios
   npx cap add ios          # must be run on macOS
   npx cap sync ios
   npx cap open ios         # opens Xcode → archive → upload to App Store Connect / TestFlight
   ```

## App icon / splash (optional branding)
The launcher icon currently uses the Capacitor default. To brand it with the Kidzopedia logo:
```bash
npm i -D @capacitor/assets
# put a 1024x1024 icon at resources/icon.png (and resources/splash.png 2732x2732)
npx capacitor-assets generate --android
npx cap sync android
```

## Notes
- Routing uses `BrowserRouter`; inside Capacitor the app loads from `https://localhost`, and client-side navigation works normally.
- Auth, storage, realtime all use HTTPS to the self-hosted Supabase tunnel, so they behave identically to the website.
- The `/get-app` page auto-detects the visitor's device and shows the right install option.
