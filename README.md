# Fan Squad

A gamified second-screen companion app for Bundesliga football fans. Built with React Native and Expo, Fan Squad delivers real-time match experiences through swipeable predictions, blind player drafting, a live banter engine, and a dynamic leaderboard — all re-skinned instantly in your club's colors.

> **Current state:** Frontend complete with local Zustand state and mock data. AWS cloud infrastructure is documented in `Backend_Guide.md` and ready for implementation.

---

## Features

| Screen | Description |
|--------|-------------|
| **Onboarding** | Choose your club (Bayern, Dortmund, Bremen) and follow a player |
| **Arena Hub** | Central dashboard with match card, stats, and navigation |
| **Prop Locker** | Swipe-based match predictions (binary, slider, multi-option) |
| **Blind Draft** | Draft 5 players from both teams — no stats, pure instinct |
| **Live Match Center** | Real-time timeline, momentum bar, squad chat with emotes |
| **Leaderboard** | Podium + full ranked list with dynamic user highlighting |
| **Profile** | Avatar upload, name editing, squad display with player photos |
| **Tasks** | Matchday missions that reward lobby points |
| **Club Pulse** | TikTok-style AI-tagged news feed |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| State | Zustand v5 |
| Animations | React Native Reanimated v4 + Gesture Handler |
| Image Picker | expo-image-picker |
| Haptics | expo-haptics |
| Styling | StyleSheet (dark esports aesthetic, club-driven theming) |
| Backend | Python WebSocket server (DFL XML replay emitter) |
| AWS (planned) | Cognito, AppSync, DynamoDB, Lambda, EventBridge, S3 |

---

## Project Structure

```
FAN-SQUAD/
├── README.md                    # This file
├── Backend_Guide.md             # AWS architecture & data contracts for backend engineer
├── QUICK_START.md               # Quick setup reference
├── IMPLEMENTATION_SUMMARY.md    # Feature implementation log
│
├── backend/                     # Python WebSocket emitter
│   ├── emitter.py               # DFL XML parser + WebSocket server
│   └── requirements.txt         # Python dependencies
│
└── fan-squad/                   # React Native / Expo app
    ├── app/
    │   ├── index.tsx            # Auth splash screen
    │   ├── onboarding.tsx       # Club + player selection
    │   ├── _layout.tsx          # Root navigator
    │   ├── auth/                # Login / signup screens
    │   └── (app)/               # Authenticated route group
    │       ├── _layout.tsx      # Auth guard + stack navigator
    │       ├── hub.tsx          # Arena dashboard
    │       ├── prop-locker.tsx  # Swipe predictions
    │       ├── draft.tsx        # 5-player blind draft
    │       ├── live.tsx         # Live match center + banter
    │       ├── leaderboard.tsx  # Podium + ranked list
    │       ├── profile.tsx      # User profile + image upload
    │       ├── tasks.tsx        # Matchday missions
    │       ├── pulse.tsx        # News feed
    │       └── squad.tsx        # Squad management
    ├── assets/
    │   └── images/
    │       ├── player_photos/   # 17 local player PNGs
    │       ├── bayern.png       # Club crests
    │       ├── dortmund.png
    │       └── bremen.png
    ├── components/              # Shared UI components
    │   ├── EmoteButton.tsx
    │   ├── MatchCenterCard.tsx
    │   ├── PlayerCard.tsx
    │   └── SquadRow.tsx
    ├── constants/
    │   ├── MockData.ts          # Clubs, players, events, users
    │   ├── PlayerAssets.ts      # Master player image dictionary
    │   └── Theme.ts             # Design tokens + club theme system
    ├── hooks/
    │   └── useTheme.ts          # Club-driven dynamic theme hook
    ├── services/
    │   ├── awsStubs.ts          # AWS integration stubs (no-op)
    │   └── dflLineupParser.ts   # DFL XML lineup parser
    ├── store/
    │   └── useAppStore.ts       # Zustand global state
    ├── types/
    │   └── index.ts             # Shared TypeScript interfaces
    └── utils/
        ├── formatCountdown.ts
        └── swipeInterpolation.ts
```

---

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Python** 3.9+ (for the backend emitter)
- **Expo Go** app on your phone, or an iOS Simulator / Android Emulator

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd FAN-SQUAD/fan-squad
npm install --legacy-peer-deps
```

### 2. Start the Expo app

```bash
npx expo start --port 4000
```

Then:
- **Physical device** — scan the QR code with Expo Go
- **iOS Simulator** — press `i`
- **Android Emulator** — press `a`
- **Web browser** — press `w`

### 3. Start the backend (optional — for live WebSocket events)

```bash
cd backend
pip install websockets
python emitter.py
```

Expected output:
```
📊 Parsing match information...
📈 Parsing KPI data...
⚽ Parsing events...
✅ Loaded 1234 events
🚀 WebSocket server running on ws://0.0.0.0:8765
⚡ Speed: 10x
```

---

## Available Scripts

```bash
npm run start     # Start Expo dev server (port 4000)
npm run android   # Start on Android
npm run ios       # Start on iOS
npm run web       # Start on web
npm run test      # Run Jest test suite (watch mode)
```

---

## App Flow

```
Auth Splash (index.tsx)
    │  tap Sign Up or Log In
    ▼
Onboarding (onboarding.tsx)
    │  select club → select favorite player
    ▼
Arena Hub (hub.tsx)
    ├──► Prop Locker    — swipe 5 predictions before kickoff
    ├──► Blind Draft    — draft 5 players, lock squad → leaderboard
    ├──► Live Center    — real-time timeline + squad banter
    ├──► Leaderboard    — podium + full ranked list
    ├──► Tasks          — matchday missions for points
    ├──► Club Pulse     — vertical-snap AI news feed
    └──► Profile        — avatar upload, name edit, squad info
```

---

## Dynamic Theme Engine

Selecting a club during onboarding instantly re-skins the entire app. The `useTheme` hook reads `selectedClub` from Zustand and returns a complete `ClubTheme` object:

| Club | Primary | On Primary | Card Radius | Button Radius |
|------|---------|-----------|-------------|---------------|
| FC Bayern München | `#DC052D` | `#FFFFFF` | 4px (sharp) | 4px |
| Borussia Dortmund | `#FDE100` | `#000000` | 24px (rounded) | 999px (pill) |
| Werder Bremen | `#1D9053` | `#FFFFFF` | 24px (rounded) | 999px (pill) |
| Default (DFL) | `#00FFC2` | `#003828` | 24px | 999px |

Every screen uses `LinearGradient` backgrounds that fade from the club color into dark, ensuring consistent visual identity across all states.

---

## Player Image System

All player photos are local PNG assets mapped through `constants/PlayerAssets.ts`:

```typescript
import { PLAYER_IMAGES, getPlayerImage } from '../constants/PlayerAssets';

// Direct lookup
<Image source={PLAYER_IMAGES['Harry Kane']} style={{ width: 64, height: 64 }} />

// Safe getter (returns undefined if not found)
const src = getPlayerImage(player.name);
```

The dictionary includes full-name keys (`'Harry Kane'`), surname aliases (`'Kane'`), and ASCII fallbacks (`'Muller'` for `'Müller'`) to handle all data sources.

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Zustand over Redux | Minimal boilerplate, no providers, direct store access |
| Local player images | Offline-first, no CDN dependency, instant rendering |
| `router.replace()` for draft→leaderboard | Prevents back-navigation to modify locked squad |
| Module-level mutable tokens in `live.tsx` | Avoids prop-drilling through 10+ sub-components |
| Single WebSocket in store | Prevents duplicate connections across tab switches |
| `useAnimatedStyle` + `Reanimated.View` | UI-thread animations for 60fps emote floaters |

---

## Backend — DFL XML Emitter

The Python backend parses DFL XML files and replays match events over WebSocket at **10x real-time speed** (90-minute match in ~9 minutes).

**Message types:**

| Type | When | Payload |
|------|------|---------|
| `INIT` | On connect | Teams, players, match metadata |
| `EVENT` | Per event | Event type, time, position, merged KPIs |
| `COMPLETE` | End of stream | Empty |

**Supported event types:** `KickOff`, `ShotAtGoal` (goal/woodwork/blocked), `Foul`, `Caution`, `RedCard`, `Corner`, `Substitution`, `Penalty`, `TacklingGame`, `Play` (momentum only)

---

## AWS Integration (Planned)

Full architecture documented in `Backend_Guide.md`. Summary:

| Service | Purpose |
|---------|---------|
| Amazon Cognito | User auth + JWT |
| AWS AppSync | GraphQL API + real-time subscriptions |
| AWS Lambda | Business logic (scoring, validation) |
| Amazon DynamoDB | NoSQL storage (single-table design) |
| Amazon EventBridge | Match event simulation scheduler |
| Amazon S3 | Avatar uploads + asset CDN |

The frontend's Zustand store shape will remain identical — only the data source changes from local mock to remote API.

---

## Testing

```bash
# Run all tests once
npx jest --testPathPattern="\.test\.ts" --passWithNoTests

# Watch mode
npm run test
```

Uses **Jest** + **@testing-library/react-native** for unit/integration tests and **fast-check** for property-based tests (10 properties, 100 inputs each).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` peer dep conflicts | Use `npm install --legacy-peer-deps` |
| Port 8765 in use (backend) | `netstat -ano \| findstr :8765` then `taskkill /PID <PID> /F` |
| Expo cache issues | `npx expo start -c` |
| Metro stale cache | Delete `node_modules/.cache` |
| WebSocket not connecting | Use LAN IP on physical device, confirm emitter is running |
| Reanimated frozen object error | Ensure `Reanimated.View` (not `Animated.View`) with `useAnimatedStyle` |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| WebSocket event latency | < 100ms |
| Match replay speed | 10x (90 min → ~9 min) |
| UI frame rate | 60 fps (Reanimated on UI thread) |
| App memory usage | < 100MB |

---

## License

MIT
