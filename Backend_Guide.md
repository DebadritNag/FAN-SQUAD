# Backend Guide — Fan Squad

> **Audience:** Backend Engineer building the AWS cloud infrastructure for the Fan Squad mobile app.
> **Last Updated:** May 2026

---

## 1. Project Overview & Frontend State

### What is Fan Squad?

Fan Squad is a gamified second-screen companion app for Bundesliga football fans. Users pick a club (FC Bayern München, Borussia Dortmund, or SV Werder Bremen), follow a favorite player, and engage with live matches through:

- **Prop Locker** — swipe-based match predictions (binary choices, sliders, multi-option)
- **Blind Draft** — build a 5-player squad from both teams before kickoff
- **Live Match Center** — real-time timeline, momentum bar, squad chat with emotes
- **Leaderboard** — global ranking based on prediction accuracy and draft performance
- **Matchday Tasks** — daily missions that reward lobby points

### How the Frontend Works Today

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React Native + Expo (SDK 54) | File-based routing via `expo-router` |
| State | Zustand (`useAppStore`) | Single store with match data, user state, tasks, WebSocket |
| Theming | Dynamic per-club | Colors, gradients, card styles all derived from `selectedClub` |
| Data | `constants/MockData.ts` | Static arrays of clubs, players, events, users |
| Real-time | Raw WebSocket to `ws://192.168.0.104:8765` | Python emitter sends DFL-format XML events |

### Key Zustand State Shape

```typescript
interface AppState {
  // Identity
  user: { username: string } | null;
  isAuthenticated: boolean;
  selectedClub: string | null;       // 'fcb' | 'bvb' | 'svw'
  followedPlayers: string[];         // player IDs from onboarding

  // Match
  matchId: string | null;
  matchTitle: string | null;
  teams: Team[];                     // home/guest with lineup, colors
  events: MatchEvent[];              // raw event buffer (last 50)
  timelineEvents: TimelineEvent[];   // enriched, filtered, newest-first
  homeScore: number;
  awayScore: number;
  homeMomentum: number;              // 0–1 derived from xPosition
  awayMomentum: number;

  // Gamification
  lobbyPoints: number;
  matchdayTasks: MatchdayTask[];
  hasJoinedLobby: boolean;
}
```

### Critical Frontend Expectations

1. **Null safety** — the UI guards against `null` with `??` fallbacks everywhere. The backend must never send `undefined` for required fields.
2. **Exact key matching** — player names must match the `PLAYER_IMAGES` dictionary keys exactly (e.g., `'Harry Kane'`, `'Leroy Sané'`, `'Niclas Füllkrug'`).
3. **Club IDs** — always lowercase: `'fcb'`, `'bvb'`, `'svw'`.
4. **Timestamps** — ISO 8601 strings (`2026-05-10T15:30:00.000Z`).

---

## 2. Core Backend Responsibilities (MVP Scope)

### 2.1 Authentication & User Profile

| Responsibility | Details |
|---------------|---------|
| Sign up / Sign in | Email + password, or social (Google/Apple) |
| Store user preferences | `selectedClub`, `followedPlayers[]`, `username`, `avatarUrl` |
| Issue JWT tokens | Short-lived access token + refresh token |
| Profile updates | Name changes, avatar upload (S3 presigned URL) |

### 2.2 Match Engine

| Responsibility | Details |
|---------------|---------|
| Fixture list | Serve upcoming matches with teams, kickoff time, status |
| Match state machine | `UPCOMING → LIVE → HALF_TIME → LIVE → FULL_TIME` |
| Live event stream | Push events (goals, cards, subs) to connected clients |
| Score tracking | Authoritative source — frontend never calculates score |

### 2.3 Prediction Engine (Prop Locker)

| Responsibility | Details |
|---------------|---------|
| Serve questions | Per-match, per-club question sets (5 questions each) |
| Accept submissions | Validate: user hasn't already submitted, match hasn't started |
| Lock deadline | Reject submissions after kickoff timestamp |
| Score predictions | After match ends, compare answers to actual outcomes |
| Award points | Write to user's `lobbyPoints` balance |

### 2.4 Draft Lobby (Real-Time)

| Responsibility | Details |
|---------------|---------|
| Create/join lobby | 5-character alphanumeric code |
| Player pool | 12 players (6 per team) available for drafting |
| Draft validation | A player can only be drafted by ONE user per lobby |
| Roster limit | Max 5 players per user |
| Real-time sync | All lobby members see picks instantly |
| Lock mechanism | Once 5 players selected, roster is immutable |

### 2.5 Leaderboard

| Responsibility | Details |
|---------------|---------|
| Global ranking | Sort all users by total points descending |
| Point sources | Predictions + Draft performance + Task completions |
| Pagination | Return top 20 + user's own rank/position |
| Real-time updates | Push rank changes during live matches |

---

## 3. Proposed AWS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Expo)                           │
│  Cognito Auth │ AppSync (GraphQL + Subscriptions) │ S3 (Assets) │
└───────┬───────────────────────┬───────────────────────┬─────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────────────┐    ┌─────────────┐
│ Amazon       │    │ AWS AppSync          │    │ Amazon S3   │
│ Cognito      │    │ (GraphQL API)        │    │ (Avatars,   │
│              │    │                      │    │  Assets)    │
│ • User Pool  │    │ • Queries/Mutations  │    └─────────────┘
│ • JWT Issuer │    │ • Subscriptions (WS) │
└──────────────┘    │ • Pipeline Resolvers │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
          ┌─────────────────┐    ┌─────────────────┐
          │ AWS Lambda      │    │ Amazon DynamoDB  │
          │ (Node.js/TS)    │    │                  │
          │                 │    │ • Users          │
          │ • Auth triggers │    │ • Matches        │
          │ • Scoring logic │    │ • Predictions    │
          │ • Draft rules   │    │ • Drafts         │
          │ • Event ingest  │    │ • Leaderboard    │
          └─────────────────┘    └─────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │ EventBridge     │
          │ (Match Clock)   │
          │                 │
          │ • Scheduled     │
          │   event emitter │
          │ • State machine │
          └─────────────────┘
```

### Service Selection Rationale

| Service | Why |
|---------|-----|
| **Amazon Cognito** | Managed auth with JWT, social sign-in, MFA — zero custom auth code. Free tier: 50,000 MAU. |
| **AWS AppSync** | Native GraphQL subscriptions over WebSocket. The Draft Lobby and Live Match Center both need real-time push. AppSync handles connection management, fan-out, and auth integration automatically. |
| **AWS Lambda** | Stateless compute for business logic. Pay-per-invocation. TypeScript for type safety matching the frontend contracts. |
| **Amazon DynamoDB** | Single-digit-ms latency, auto-scaling, pay-per-request. Perfect for leaderboard queries and high-write match events. Free tier: 25 GB + 25 WCU/RCU. |
| **Amazon S3** | Avatar uploads via presigned URLs. CloudFront CDN for global delivery. |
| **Amazon EventBridge** | Scheduled rules to simulate match events during demos. Decouples the event source from consumers. |

---

## 4. Real-Time Draft Lobby Specification

### Connection Flow

```
1. User creates lobby → Lambda generates 5-char code, writes to DynamoDB
2. User shares code → Other users join via mutation
3. AppSync subscription activated: `onDraftEvent(lobbyId: "ABC12")`
4. User drafts a player → Mutation with optimistic lock (DynamoDB condition)
5. On success → AppSync publishes event to all subscribers
6. On conflict (player already taken) → Return error, frontend shows toast
```

### Subscription Payload Schema

```graphql
type Subscription {
  onDraftEvent(lobbyId: ID!): DraftEvent
    @aws_subscribe(mutations: ["draftPlayer", "lockRoster", "joinLobby"])
}

type DraftEvent {
  eventType: DraftEventType!
  lobbyId: ID!
  userId: ID!
  username: String!
  playerId: String
  playerName: String
  rosterSize: Int
  timestamp: AWSDateTime!
}

enum DraftEventType {
  PLAYER_JOINED
  PLAYER_DRAFTED
  PLAYER_UNDRAFTED
  ROSTER_LOCKED
}
```

### Example Event Payloads

**Player Drafted:**
```json
{
  "eventType": "PLAYER_DRAFTED",
  "lobbyId": "ABC12",
  "userId": "user_456",
  "username": "BayernBoss",
  "playerId": "d1",
  "playerName": "Harry Kane",
  "rosterSize": 3,
  "timestamp": "2026-05-10T15:32:00.000Z"
}
```

**Roster Locked:**
```json
{
  "eventType": "ROSTER_LOCKED",
  "lobbyId": "ABC12",
  "userId": "user_456",
  "username": "BayernBoss",
  "playerId": null,
  "playerName": null,
  "rosterSize": 5,
  "timestamp": "2026-05-10T15:35:00.000Z"
}
```

### Concurrency Control (DynamoDB Condition Expression)

```typescript
// Lambda: draftPlayer resolver
const params = {
  TableName: 'Drafts',
  Key: { PK: `LOBBY#${lobbyId}`, SK: `PLAYER#${playerId}` },
  UpdateExpression: 'SET draftedBy = :userId, draftedAt = :now',
  ConditionExpression: 'attribute_not_exists(draftedBy)',
  ExpressionAttributeValues: {
    ':userId': userId,
    ':now': new Date().toISOString(),
  },
};
```

If the condition fails (player already drafted), DynamoDB throws `ConditionalCheckFailedException` → Lambda returns a user-friendly error → frontend shows "Player already taken!"

---

## 5. AWS Sandbox & Hackathon Guidelines

### Infrastructure as Code

Use **AWS CDK (TypeScript)** for the fastest iteration:

```bash
npx cdk init app --language typescript
npx cdk deploy --all
```

CDK advantages over SAM for this project:
- Same language as Lambda functions (TypeScript)
- L2 constructs for AppSync, Cognito, DynamoDB reduce boilerplate
- `cdk watch` for hot-deploy during development

### Free Tier Utilization

| Service | Free Tier Limit | Our Expected Usage |
|---------|----------------|-------------------|
| Cognito | 50,000 MAU | < 100 users (demo) |
| AppSync | 250,000 queries/month | < 10,000 |
| Lambda | 1M invocations/month | < 50,000 |
| DynamoDB | 25 GB + 25 RCU/WCU | < 1 GB, on-demand |
| S3 | 5 GB + 20,000 GETs | < 100 MB |
| EventBridge | All events free | Minimal |

**Cost estimate for hackathon: $0.00**

### Mocking the Live Data Feed

Instead of paying for a real sports data API (Opta, Sportradar = $5,000+/month), simulate match events:

**Option A: Scheduled Lambda (Recommended)**
```typescript
// EventBridge rule: rate(45 seconds)
// Lambda reads from a pre-scripted JSON array of 19 match events
// Publishes each event sequentially via AppSync mutation
// Frontend receives via subscription — identical to real data flow
```

**Option B: Manual API Gateway Trigger**
```bash
# POST /admin/emit-event
curl -X POST https://api.example.com/admin/emit-event \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"matchId": "m1", "type": "goal", "team": "fcb", "player": "Harry Kane", "minute": 12}'
```

**Option C: Replay the existing Python emitter**
The project already has `backend/emitter.py` that sends DFL XML events over WebSocket. Wrap it in a Lambda or ECS task and point it at the AppSync mutation endpoint instead of a raw WebSocket.

---

## 6. Data Contracts (JSON/GraphQL Schemas)

### 6.1 Player Object

**Frontend expects:**
```typescript
interface Player {
  id: string;
  name: string;
  clubCrestUrl: string;
  imageUrl: string;
}
```

**GraphQL Schema:**
```graphql
type Player {
  id: ID!
  name: String!
  clubId: ID!
  clubCrestUrl: AWSURL!
  imageUrl: AWSURL!
  position: String
  shirtNumber: Int
}
```

**DynamoDB Item:**
```json
{
  "PK": "CLUB#fcb",
  "SK": "PLAYER#p1",
  "id": "p1",
  "name": "Harry Kane",
  "clubId": "fcb",
  "clubCrestUrl": "https://cdn.fansquad.app/crests/fcb.png",
  "imageUrl": "https://cdn.fansquad.app/players/harry_kane.png",
  "position": "ST",
  "shirtNumber": 9
}
```

### 6.2 Match Context

**Frontend expects (from WebSocket INIT message):**
```typescript
interface MatchInit {
  type: 'INIT';
  matchId: string;
  matchTitle: string;
  teams: Array<{
    teamId: string;
    teamName: string;
    shortName: string;
    role: 'home' | 'guest';
    primaryColor: string;
    secondaryColor: string;
    lineup: string;
    players: PlayerLineup[];
  }>;
}
```

**GraphQL Schema:**
```graphql
type Match {
  id: ID!
  title: String!
  status: MatchStatus!
  kickoffTime: AWSDateTime!
  homeTeam: MatchTeam!
  awayTeam: MatchTeam!
  homeScore: Int!
  awayScore: Int!
  currentMinute: Int
}

type MatchTeam {
  teamId: ID!
  teamName: String!
  shortName: String!
  role: TeamRole!
  primaryColor: String!
  secondaryColor: String!
  players: [MatchPlayer!]!
}

enum MatchStatus { UPCOMING LIVE HALF_TIME FULL_TIME }
enum TeamRole { HOME GUEST }
```

**Example Query Response:**
```json
{
  "data": {
    "getMatch": {
      "id": "m_2026_fcb_bvb",
      "title": "FC Bayern München vs Borussia Dortmund",
      "status": "LIVE",
      "kickoffTime": "2026-05-10T15:30:00.000Z",
      "homeTeam": {
        "teamId": "fcb",
        "teamName": "FC Bayern München",
        "shortName": "FCB",
        "role": "HOME",
        "primaryColor": "#DC052D",
        "secondaryColor": "#0066B2",
        "players": [
          { "id": "p1", "name": "Harry Kane", "position": "ST", "shirtNumber": 9, "starting": true }
        ]
      },
      "awayTeam": {
        "teamId": "bvb",
        "teamName": "Borussia Dortmund",
        "shortName": "BVB",
        "role": "GUEST",
        "primaryColor": "#FDE100",
        "secondaryColor": "#000000",
        "players": []
      },
      "homeScore": 2,
      "awayScore": 1,
      "currentMinute": 67
    }
  }
}
```

### 6.3 Leaderboard Array

**Frontend expects:**
```typescript
interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  jersey: number;
  isCurrentUser: boolean;
  delta: string;
}
```

**GraphQL Schema:**
```graphql
type Query {
  getLeaderboard(limit: Int, clubId: ID): LeaderboardResponse!
}

type LeaderboardResponse {
  entries: [LeaderboardEntry!]!
  userEntry: LeaderboardEntry!
  totalParticipants: Int!
  lastUpdated: AWSDateTime!
}

type LeaderboardEntry {
  rank: Int!
  userId: ID!
  username: String!
  points: Int!
  jerseyNumber: Int
  delta: String!
  isCurrentUser: Boolean!
}
```

**Example Response:**
```json
{
  "data": {
    "getLeaderboard": {
      "totalParticipants": 1247,
      "lastUpdated": "2026-05-10T16:02:00.000Z",
      "userEntry": {
        "rank": 14,
        "userId": "user_123",
        "username": "My_SQUAD_User",
        "points": 1240,
        "jerseyNumber": 14,
        "delta": "+12",
        "isCurrentUser": true
      },
      "entries": [
        { "rank": 1, "userId": "user_789", "username": "King_Kane9", "points": 3500, "jerseyNumber": 9, "delta": "+55", "isCurrentUser": false },
        { "rank": 2, "userId": "user_456", "username": "Munich_Pro", "points": 2980, "jerseyNumber": 11, "delta": "+38", "isCurrentUser": false },
        { "rank": 3, "userId": "user_321", "username": "SoccerStar", "points": 2750, "jerseyNumber": 7, "delta": "+31", "isCurrentUser": false }
      ]
    }
  }
}
```

---

## 7. DynamoDB Table Design (Single-Table)

| PK | SK | Attributes |
|----|-----|-----------|
| `USER#<userId>` | `PROFILE` | username, email, selectedClub, followedPlayers[], avatarUrl, createdAt |
| `USER#<userId>` | `POINTS` | totalPoints, predictionPoints, draftPoints, taskPoints |
| `MATCH#<matchId>` | `META` | title, status, kickoffTime, homeTeamId, awayTeamId, homeScore, awayScore |
| `MATCH#<matchId>` | `EVENT#<timestamp>` | type, minute, description, teamId, playerId |
| `MATCH#<matchId>` | `PREDICTION#<userId>` | answers[], submittedAt, scored, pointsAwarded |
| `LOBBY#<lobbyId>` | `META` | matchId, createdBy, createdAt, status |
| `LOBBY#<lobbyId>` | `MEMBER#<userId>` | username, joinedAt, roster[], rosterLocked |
| `LOBBY#<lobbyId>` | `PLAYER#<playerId>` | draftedBy, draftedAt |
| `LEADERBOARD#global` | `RANK#<zero-padded-rank>` | userId, username, points, delta |

### GSI: Leaderboard by Points

- **GSI1PK:** `LEADERBOARD#global`
- **GSI1SK:** Zero-padded points (descending via `BETWEEN` scan)
- Enables efficient top-N queries without full table scan

---

## 8. Quick Start Checklist

```
□ 1. Set up AWS CDK project (TypeScript)
□ 2. Deploy Cognito User Pool + App Client
□ 3. Deploy DynamoDB table with GSI
□ 4. Deploy AppSync API with schema
□ 5. Wire Lambda resolvers for mutations
□ 6. Test auth flow: signup → login → JWT → AppSync query
□ 7. Implement draft mutation with condition expression
□ 8. Test subscription: two clients, one drafts, other receives
□ 9. Build EventBridge rule + Lambda for match event simulation
□ 10. Deploy, test end-to-end with Expo app pointing at AppSync endpoint
```

---

## 9. Frontend Integration Points

When the backend is ready, add this to the frontend :

1. Replace `MockData.ts` imports with AppSync `useQuery` / `useMutation` hooks
2. Replace the raw WebSocket in `useAppStore.connectWebSocket()` with AppSync subscription client
3. Replace `useAppStore.setState()` calls with mutation responses
4. Add Cognito auth flow to `app/auth/login.tsx` and `app/auth/signup.tsx`
5. Store JWT in secure storage and attach to AppSync headers

The Zustand store shape will remain identical — only the data source changes from local mock to remote API.

---

*End of Backend Guide*
