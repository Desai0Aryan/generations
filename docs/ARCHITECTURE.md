# Architecture

```
App.tsx                      screens: Title -> New life -> Game (tabs)
src/engine/                  pure TypeScript game rules (no UI, fully testable)
  types.ts                   every data type (state, events, effects, conditions)
  lifecycle.ts               newGame, ageUp, resolveChoice, death, continueAs (heirs), interact
  conditions.ts / effects.ts tiny rule languages that event content is written in
src/content/                 DATA, not code. One file per pack of events
  core.ts (free)             ~70 events across all life stages
  entrepreneur.ts (premium)  sample add-on pack
  goals.ts                   goals shown on the "You" tab
  index.ts                   pack registry (+ product ids)
src/monetization/            products, entitlements (TEST mode purchases)
src/store/                   React context + autosave (AsyncStorage)
src/ui/                      screens, tabs, components
scripts/simulate.ts          balance testing
preview/                     browser build (shims real React Native components for the web)
```

## Why this scales
- **Events are data.** A pack is an array of `EventDef`. Add 500 events without touching the engine. Later they can be downloaded
  from a server so you can ship new story content without an App Store update.
- **Add-ons are just packs.** Eras (Renaissance Florence), regions, careers, storylines: new file + one line in `content/index.ts`.
  A pack is switched on by ownership (`entitlements.ts`), and applies to a running game instantly.
- **Memory and legacy are first-class.** Events can target a specific person (`target`), tag them (`rtag`), and later events can
  react to those tags or to remembered tags (`mem`) or family generation (`gen`).
- **State is one serializable object** with a version number, so saves, cloud sync and migrations are straightforward.

## Suggested next parts
1. Art and feel: portraits, haptics, sound, animated stat changes, onboarding.
2. More content: 300+ events, careers with promotion ladders, schools, crime/health branches, random "world news".
3. Eras and regions (the Generations map): era-specific rules, names, money and jobs.
4. Real IAP via RevenueCat, App Store listing, analytics, cloud save (iCloud/Firebase).
5. Optional: AI-written flavor text for events (server-side, cached) so no two lives read the same.
