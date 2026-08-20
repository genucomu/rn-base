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
- **HTTP**: Fetch nativo wrappeado en `src/services/http.ts` (token injection, auto-refresh 401).
- **Types**: DTOs de la API en `src/types/api.ts`, paginación en `src/types/pagination.ts`.
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

## Arquitectura de capas

```
src/app/<route>.tsx    →  pages/layouts: orquestan hooks + componentes
src/hooks/use-*.ts     →  useQuery / useMutation: llaman a services
src/services/*.ts      →  services: fetch a la API, retornan Promise<T>
src/services/http.ts   →  cliente HTTP: token injection, auto-refresh
src/components/*.tsx   →  componentes: UI pura, reciben data por props
src/types/api.ts       →  types: DTOs tipados de la API
src/lib/query-keys.ts  →  query keys: constantes centralizadas
src/stores/*.ts        →  stores: Zustand para estado global del cliente
```

## Reglas de oro

1. Estado de servidor (fetch, caché, mutaciones) → TanStack Query. Nunca guardar datos de API en Zustand.
2. Estado global del cliente (settings, auth, UI global) → Zustand con persist si hace falta.
3. Services → solo hacen `fetch`, retornan `Promise<T>`. No conocen React ni Query.
4. Hooks → solo usan `useQuery`/`useMutation`. No hacen `fetch` directo.
5. Components → solo renderizan. No hacen `fetch` ni usan hooks de query.
6. Query keys → siempre en `src/lib/query-keys.ts`, nunca como strings inline.
7. Nuevos módulos nativos → `npx expo install` (no `npm install`).
8. No tocar `overrides.lightningcss` en `package.json` (el bundler rompe).
9. Antes de escribir código de Expo, consultar docs versionadas: https://docs.expo.dev/versions/v57.0.0/

## API existente

La app consume una API NestJS en `http://localhost:3000`. La spec OpenAPI está en `/api/docs-json`.

Módulos de la API:
- **Auth**: register, login, refresh, logout, Google OAuth
- **Users**: perfil del usuario
- **Billing**: legal entities (CUIT), points of sale, customers, products, price lists, invoices
- **Pricing**: sync de catálogo externo, productos importados

Cada módulo tiene su service (`src/services/<module>.service.ts`) y sus hooks (`src/hooks/use-<module>.ts`).
