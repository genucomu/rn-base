---
name: stack-overview
description: Describes the rn-base project stack, how to run/lint/typecheck the app, and where each concern (routing, styling, server state, client state) lives. Use when the user asks how to run the project, add dependencies, or asks what library/pattern to use for a given concern.
---

# Stack Overview

Proyecto base de React Native (Expo SDK 57, RN 0.86, React 19.2.3) con expo-router.

## Librerías clave

- **Routing**: `expo-router` (file-based), NativeTabs en `src/components/app-tabs.tsx`. Las rutas viven en `src/app/`.
- **Estilos**: NativeWind v5 (preview) + Tailwind CSS v4. Usar clases `className` directamente en componentes RN.
- **Server state**: TanStack Query v5. `QueryClient` en `src/lib/query-client.ts`, Provider en `src/app/_layout.tsx`.
- **Client state**: Zustand v5. Stores en `src/stores/`, con persist via `AsyncStorage`.
- **Lint/format**: Biome (reemplaza ESLint + Prettier).

## Comandos

| Comando | Para qué |
| --- | --- |
| `npm run start` | Expo dev server |
| `npm run android` / `npm run ios` / `npm run web` | Plataforma específica |
| `npm run lint` | Biome check |
| `npm run lint:fix` | Biome check --write |
| `npm run format` | Biome format --write |
| `npm run typecheck` | `tsc --noEmit` |

## Reglas de oro

1. Estado de servidor (fetch, caché, mutaciones) → TanStack Query. Nunca guardar datos de API en Zustand.
2. Estado global del cliente (settings, auth, UI global) → Zustand con persist si hace falta.
3. Nuevos módulos nativos → `npx expo install` (no `npm install`).
4. No tocar `overrides.lightningcss` en `package.json` (el bundler rompe).
5. Antes de escribir código de Expo, consultar docs versionadas: https://docs.expo.dev/versions/v57.0.0/
