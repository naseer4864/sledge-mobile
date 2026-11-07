# sledge-mobile

Customer-facing SLEDGE app — Expo SDK 58, React Native 0.88, TypeScript
strict, Expo Router, NativeWind, TanStack Query, expo-secure-store.

(Internal codename: COIN — package names and SecureStore keys are still `coin*`.)

## Prerequisites

- Node.js 22+ and npm
- [Expo Go](https://expo.dev/go) on a physical device, **or** an emulator:
  - Android: Android Studio + an AVD
  - iOS: Xcode + Simulator (macOS only)
- **sledge-backend** running (see that repo's README): API on
  `http://localhost:3000` — or reachable at your machine's LAN IP for
  physical devices.

## Getting started

```bash
npm install
npm run dev        # expo start → scan the QR code with Expo Go
npm run android    # build + launch on Android emulator
npm run ios        # build + launch on iOS simulator
```

## API base URL

The app reads `EXPO_PUBLIC_API_URL` (see `src/services/api.ts`). Default is
`http://localhost:3000`, which only works for the iOS simulator — pick the
right value for your target:

| Environment | Value |
|---|---|
| iOS simulator | `EXPO_PUBLIC_API_URL=http://localhost:3000` |
| Android emulator | `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` (10.0.2.2 = host loopback) |
| Physical device | `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000` — same Wi-Fi; LAN IP via `ipconfig` |

Set it inline (`EXPO_PUBLIC_API_URL=... npm run android`) or in a local
`.env` (gitignored — a commented template ships in the repo's history/.env).

## Structure

```
app/                    # Expo Router routes
├── (auth)/             # welcome, onboarding, register, login, mfa,
│                       # verify-email, forgot/reset-password
├── (tabs)/             # Home / Wallet / Trade / Savings / Account shell
├── wallet/ deposit/ withdraw/ trade/ fiat/ savings/ gift-cards/
├── kyc/ chat/ support/ # feature stacks
└── notifications.tsx push-settings.tsx

src/
├── services/           # typed API layer (one module per backend domain)
│   ├── api.ts          #   fetch client: SecureStore tokens, single-flight
│   │                   #   refresh, zod validation, 15s timeout, x-request-id
│   └── auth.ts kyc.ts wallets.ts deposits.ts withdrawals.ts trades.ts
│       fiat.ts savings.ts giftcards.ts support.ts chat.ts dashboard.ts
│       notifications.ts push.ts onboarding.ts
├── components/         # error boundary, loading/empty/error states,
│                       # shadcn-style ui primitives
├── providers/          # theme (system/light/dark), query client
├── theme/              # SLEDGE palette (light + dark)
└── __tests__/
```

## API layer contract

`src/services/api.ts` talks to the backend under `/api/v1`:

- `POST /auth/refresh` — single-flight: concurrent 401s share one refresh
  request; a failed refresh clears SecureStore and routes to login.
- All other calls attach `Authorization: Bearer <access>` from SecureStore.
- Response bodies are validated with zod schemas before reaching the UI.
- Every request sends a fresh `x-request-id` for tracing.

## Security

- Tokens live in **expo-secure-store** — never AsyncStorage, never the bundle.
- `EXPO_PUBLIC_*` vars ship in the JS bundle; only non-secret values belong
  there (the API URL is fine).
- Session expiry clears tokens and returns to the auth stack.

## Scripts

```bash
npm run dev         # expo start
npm run android     # expo start --android
npm run ios         # expo start --ios
npm run typecheck   # tsc --noEmit
npm run lint        # eslint . --max-warnings 0
npm test            # jest (jest-expo)
```

## Sibling repositories

| Repo | Purpose |
|---|---|
| `sledge-backend` | API + worker + MongoDB/Redis infra — required |
| `sledge-admin` | Admin console (port 3001) |
| `sledge-web` | Marketing site (port 3002) |
| `sledge-mobile` (this one) | Customer app |
