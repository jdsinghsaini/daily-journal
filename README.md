# Daily Journal

A private daily journal for iPhone and Android, built with Expo (SDK 58) and React Native.

## Features

- **Colourful calendar home screen.** Each month has its own gradient, written days are filled with your mood colour and emoji, and there's a day streak.
- **Today page**
  - a daily prompt
  - a mood picker (Great → Awful)
  - your entry text
  - Gratitude: 3 good things
  - a **daily list you name yourself** ("My prayers", "My mantras"…); tap an item to mark it Completed, and ticks reset each day
  - tags
  - up to 4 photos
  - "On this day" memories
- **Search** by word or `#tag`.
- **Insights:** streak, average mood, a 30-day mood chart, which tags lift your mood, mood by weekday, and a weekly AI reflection.
- **Time capsule:** letters to your future self that stay sealed until a date you choose.
- **Privacy:** a PIN lock (kept in the iOS Keychain / Android Keystore), optional Face ID or fingerprint, and all data stays on the device.
- **Export:** share every entry as plain text.
- Light and dark mode.

## Run it on your phone (development)

You need Node.js 22.13 or newer.

```bash
npm install
npx expo start
```

SDK 58 needs a **development build**, because Expo Go for SDK 58 is still rolling out to the stores.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android   # or ios
```

Install the build on your phone, run `npx expo start`, and scan the QR code. If you have Android Studio or Xcode, `npx expo run:android` / `npx expo run:ios` builds locally instead.

To try it in a browser: `npx expo start --web`.

## Before publishing

1. **App IDs:** change `com.yourname.dailyjournal` in `app.json` (iOS `bundleIdentifier`, Android `package`).
2. **Icons:** replace the icons and splash image in `assets/`.
3. **AI key:** for now, the user pastes their own Anthropic API key in Settings. For a store release, move `src/lib/ai.ts`'s request to your own small backend (for example a Cloudflare Worker or Supabase Edge Function) that holds your key. That backend is also where you meter free vs. Premium reflections.
4. **Build and submit:**
   ```bash
   npx eas-cli@latest build --platform all
   npx eas-cli@latest submit --platform ios      # needs an Apple Developer account ($99/yr)
   npx eas-cli@latest submit --platform android  # needs a Google Play account ($25 once)
   ```
5. **Privacy policy:** both stores require a privacy policy URL. The data stays on the device, except text the user sends for an AI reflection.

## Tests

```bash
npm run typecheck   # TypeScript
npx expo lint       # ESLint
npm test            # unit tests for dates, streaks, search, insights, export
npx expo export -p web && npm run e2e   # end-to-end run-through in a phone-sized browser (needs Playwright)
```

## Project layout

```
src/app/              screens (Expo Router)
  (tabs)/index.tsx      calendar (home)
  (tabs)/today.tsx      daily entry
  (tabs)/insights.tsx   stats + AI reflection
  (tabs)/capsule.tsx    time capsule
  (tabs)/settings.tsx   PIN, AI key, export
src/components/       PinPad, LockGate, RitualList, UI pieces
src/lib/              data store, storage, logic, photos, PIN, AI
tests/                unit tests
e2e/                  end-to-end test
```

## Ideas for v1.1

- Daily reminder notification (expo-notifications)
- Voice journaling with in-app speech-to-text (expo-speech-recognition, needs a dev build)
- Encrypted cloud backup and sync (Premium)
- Printed yearbook export
