# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React Native / Expo mobile app for tracking baby sleep sessions. Targets Android and iOS. UI language is Croatian.

## Commands

```bash
# Install dependencies (run after cloning or when package.json changes)
npx expo install

# Start development server (scan QR with Expo Go app)
npx expo start

# Run on specific platform
npx expo start --android
npx expo start --ios
```

> If package version conflicts arise after Expo upgrades, run `npx expo install --fix` to resolve peer dependencies automatically.

## Architecture

```
App.js                          # Root: NavigationContainer + bottom tab navigator
src/
  storage/sleepStorage.js       # All AsyncStorage reads/writes — single source of truth
  utils/formatTime.js           # Pure formatting helpers (duration, date, time)
  screens/
    TrackerScreen.js            # Start/Stop button + live elapsed timer
    HistoryScreen.js            # FlatList of completed sessions, swipe-to-delete via Alert
    StatisticsScreen.js         # Summary cards + 7-day bar chart (pure RN Views, no charting lib)
```

### Data model

Sessions are stored as a JSON array under the key `@baby_sleep_sessions` in AsyncStorage:

```js
{
  id: string,          // Date.now() string
  startTime: number,   // Unix timestamp (ms)
  endTime: number | null,   // null while session is active
  duration: number | null,  // ms, null while active
}
```

An active session is any entry where `endTime === null`. Only one active session is allowed at a time.

### Key patterns

- **Data loading on tab focus**: All screens use `useFocusEffect` + `useCallback` to reload from storage whenever the tab becomes active. This keeps all tabs in sync without a global state manager.
- **No state library**: App state is local to each screen; AsyncStorage is the single source of truth. If this grows, consider Zustand or React Query.
- **Locale**: `hr-HR` used for all date/time formatting throughout `formatTime.js`.
- **Color palette**: primary `#7B5EA7` (purple), background `#F8F4FF` (lavender), accent `#FF85A2` (pink for Stop button).
