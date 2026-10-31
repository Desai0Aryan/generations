# Generations (Part 2)

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

## What's new in Part 2: freedom
- **Do tab**: ~70 things you choose to do, grouped as Love, Friends, School, Career, Sports, Money, Health, Family, Life. You get 5 free-time slots a year.
- **Love & people**: flirt, date, gift, make it official, move in, propose, try for a baby, break up, get back together. Romance is non-explicit and 18+ only (teens only get crushes and sweet dates).
- **School**: school tiers, majors, GPA, tuition, student loans, trade school, gap year, dropping out, grad school.
- **Careers**: 13 career fields with ladders, requirements, application odds, job performance, promotions, firing.
- **Sports**: train, compete, go pro (careers end around 36).
- **Stuff tab**: buy or finance cars, homes, luxury items and pets. Loans, credit limit, upkeep, depreciation, selling, bankruptcy.
- **Legacy**: family tree, heirlooms and the family home pass to heirs; 18 trophies.
- **Look & feel**: procedural portraits, life-stage scenes, animated bars and money, haptics (toggle in Settings).

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
- Part 2 UI was tested only in the browser preview (`preview/play.html`), not on a real iPhone yet. The engine passes ~230-life simulations with no errors.
- Purchases are TEST MODE. Swap in RevenueCat before release.
- If `npx expo start` complains about versions, create a fresh Expo project (`npx create-expo-app`) and copy `src`, `App.tsx` and `assets` into it.
- The game engine is tested: thousands of simulated lives and generations with no errors; the UI was played through in a browser build.
- The real iPhone app (Expo / React Native) could not be installed in the sandbox where this was built, so it has **not** been run on a device yet.
  The UI code uses only standard React Native components, so it should work; expect to fix small things on the first run.
