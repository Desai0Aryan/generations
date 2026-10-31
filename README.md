# Generations (Part 1)

A life simulator where your bloodline lasts for centuries. This is Part 1: the playable core, built to grow.

**Combines your two concepts:** Lumen's grounded life choices (junior-year menu, "friend in need", the tech interview) with
Generations' bloodline legacy (heirs, family reputation, inheritance, ancestors, patron favors).

## Play it right now (no install)
Open `preview/play.html` in any browser (Chrome / Safari / Firefox). It runs the same game code. Progress saves in the browser.

## Run the real app on your iPhone
You need Node.js 20+ and the free **Expo Go** app on your phone.

```bash
cd generations
npm install
npx expo install react react-native expo-status-bar react-native-safe-area-context @react-native-async-storage/async-storage
npx expo start
```
Scan the QR code with your iPhone camera. (`expo install` picks the versions that match your Expo version.)

## Put it on the App Store (later)
1. Apple Developer account ($99/yr). 2. `npm i -g eas-cli`, `eas build --platform ios`, `eas submit`.
3. Real in-app purchases: create the product ids from `src/monetization/products.ts` in App Store Connect, then swap the two
   TODO functions in `src/monetization/entitlements.ts` for RevenueCat (`react-native-purchases`).

## What's in Part 1
- Create a bloodline (name, background, start at birth or age 16)
- Age up year by year with choices, consequences, and a life feed
- Stats: Health, Happiness, Smarts, Looks, Reputation + money, career, education, goals
- People: friends, family, partners, rivals, mentors; relationships fade unless you invest time (3 interactions per year)
- Memory: past choices come back (a friend you helped repays you; a patron's favor gets called in)
- Death, legacy score, and **continue as your child**: inheritance, family reputation, ancestors, legacy projects that help descendants
- Autosave, plus a shop with **test-mode** add-on packs and cosmetic themes

## Where to change things
| I want to... | Edit |
|---|---|
| Add or change story events | `src/content/core.ts` (copy any event) |
| Add a whole new paid pack (era, region, storyline) | new file like `src/content/entrepreneur.ts`, then register it in `src/content/index.ts` |
| Add a cosmetic or product to sell | `src/monetization/products.ts` |
| Change aging, money, death odds | `src/engine/lifecycle.ts` |
| Add a new stat / effect / condition type | `src/engine/types.ts`, `effects.ts`, `conditions.ts` |
| Restyle | `src/ui/theme.ts`, `src/ui/components.tsx` |
| Check game balance | `npm run simulate` (plays thousands of lives and prints stats) |

See `docs/ARCHITECTURE.md` for how it fits together and a suggested Part 2+ roadmap.

## Honest status
- The game engine is tested: thousands of simulated lives and generations with no errors; the UI was played through in a browser build.
- The real iPhone app (Expo / React Native) could not be installed in the sandbox where this was built, so it has **not** been run on a device yet.
  The UI code uses only standard React Native components, so it should work; expect to fix small things on the first run.
