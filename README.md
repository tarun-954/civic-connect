# Civic Connect Monorepo

This repository contains a ready-to-design cross-platform mobile app (Expo/React Native) and a backend API (Express/TypeScript), organized as a monorepo with shared code.

## Structure

```
/ (repo root)
  package.json           # npm workspaces + root scripts (dev:all etc.)
  tsconfig.base.json     # shared TS config
  .gitignore
  README.md
  
  apps/
    mobile/              # Expo React Native app (Android/iOS)
    api/                 # Express TypeScript backend API

  packages/
    shared/              # Shared utilities/types between mobile and API
```

## Prerequisites

- Node.js 18+ and npm 9+
- Android Studio (Android emulator) and/or Xcode (iOS Simulator on macOS)

## Quick Start

1) Install dependencies (root will install all workspaces):

```bash
npm install
```

2) Start API and Mobile together (two terminals in one):

```bash
npm run dev:all
```

- API: http://localhost:4000/health
- Mobile: Expo Dev Tools will open; press "a" for Android, "i" for iOS (macOS only)

### Run separately

- API only:
```bash
npm run dev:api
```

- Mobile only:
```bash
npm run dev:mobile
```

## Environment Variables

Copy example env files and adjust as needed:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

- API reads from `apps/api/.env`
- Mobile reads from `apps/mobile/.env`. For production-grade env access, consider `@react-native-dotenv` or Expo config plugins.

## Shared Code

`packages/shared` exposes shared types/utilities imported by both API and Mobile, e.g. `@civic/shared`.

## Scripts

- `npm run dev:all` – runs API and Mobile concurrently
- `npm run dev:api` – runs Express API with hot-reload (ts-node-dev)
- `npm run dev:mobile` – starts Expo development server

## Notes

- This is a minimal skeleton intended for immediate design and feature development.
- Add libraries as needed (UI kits, state management, data fetching, auth, etc.).
