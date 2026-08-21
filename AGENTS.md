# rn-base

Proyecto base de React Native con **Expo SDK 57** (RN 0.86, React 19.2.3) + expo-router.

## Stack

- **Expo SDK 57** — `expo-router` (file-based routing) con NativeTabs, estructura en `src/`, alias `@/*` → `src/` y `@/assets/*` → `assets/`.
- **NativeWind v5 (preview)** + **Tailwind CSS v4** — utilidades de Tailwind en RN. Sin `babel.config.js`; se configura en `metro.config.js` (`withNativewind`) y `postcss.config.mjs` (`@tailwindcss/postcss`). Requiere `overrides.lightningcss: "1.30.1` (ver abajo).
- **TanStack Query v5** — fetching/caching de servidor. Provider en `src/app/_layout.tsx`, config en `src/lib/query-client.ts`. Services en `src/services/`, hooks en `src/hooks/`, query keys en `src/lib/query-keys.ts`.
- **Zustand v5** — estado global. Stores en `src/stores/`. Auth store (`auth-store.ts`) maneja tokens + usuario con persist.
- **Biome** — linter + formatter (reemplaza ESLint y Prettier). Config en `biome.json`.
- **Husky + lint-staged** — hook `pre-commit` que corre `typecheck` y `biome check --write`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run start` | Levanta Expo dev server |
| `npm run android` / `npm run ios` / `npm run web` | Abre en plataforma específica |
| `npm run lint` | Biome check (sin escribir) |
| `npm run lint:fix` | Biome check con autofix |
| `npm run format` | Biome format --write |
| `npm run typecheck` | `tsc --noEmit` |

## Setup de NativeWind

- `metro.config.js` envuelve con `withNativewind(config)`.
- `src/global.css` se importa en `src/app/_layout.tsx` (top-most component). Usa `@import` de Tailwind v4 (`theme`, `preflight`, `utilities`) + `nativewind/theme`, y define las variables de fuente.
- `nativewind-env.d.ts` referencia las types de `react-native-css`. Es generado/consumido por el toolchain; se regenera con `npx expo customize tsconfig.json`.
- ⚠️ **No tocar `overrides.lightningcss`** en `package.json`: sin fijarlo a 1.30.1 el bundler falla con `failed to deserialize; expected an object-like struct named Specifier`.

## Convenciones

- Estilo: Biome (spaces/2, single quotes, semicolons always, trailing commas all, lineWidth 100). Formatear antes de commit: `npm run lint:fix`.
- Estado servidor → TanStack Query. Estado global cliente → Zustand.
- Nuevos componentes: seguir skill `nativewind-generator` (NativeWind className > StyleSheet).
- Nuevas pantallas: agregar archivo en `src/app/` (expo-router) y registrar el tab en `src/components/app-tabs.tsx`.
- Al agregar librerías con módulos nativos usar `npx expo install` (respeta versiones del SDK).

## Arquitectura de capas

```
src/app/<route>.tsx    →  pages/layouts: orquestan hooks + componentes
src/hooks/use-*.ts     →  useQuery / useMutation: llaman a services
src/services/*.ts      →  services: fetch a la API, retornan Promise<T>
src/services/http.ts   →  cliente HTTP: token injection, auto-refresh 401
src/components/*.tsx   →  componentes: UI pura, reciben data por props
src/types/api.ts       →  types: DTOs tipados de la API
src/lib/query-keys.ts  →  query keys: constantes centralizadas
src/lib/config.ts      →  config: API_BASE_URL desde EXPO_PUBLIC_API_URL
src/stores/*.ts        →  stores: Zustand para estado global del cliente
```

**Regla clave**: las pages/layouts usan hooks. Los componentes solo renderizan. Los services solo hacen fetch.

## API

La app consume una API NestJS en `http://localhost:3000` (configurable vía `EXPO_PUBLIC_API_URL`).

Módulos: Auth, Users, Billing (legal entities, points of sale, customers, products, price lists, invoices), Pricing (sync catálogo externo).

## Workflow SDD (Spec-Driven Development)

Features nuevas se construyen con el pipeline SDD:

```
idea de feature
  spec-writer ─► docs/specs/<slug>.md  → [gate: aprobás?]
  architect   ─► docs/plans/<slug>.md  → [gate: aprobás?]
  implementer ─► código (paralelo cuando no hay conflictos)
  verificación: npm run typecheck + lint:fix
  reviewer    ─► informe diff vs spec/plan
```

### Sistema Genérico Multi-IA

El proyecto está configurado para trabajar con múltiples IAs (opencode, Devin, etc.)
de forma genérica:

- **Configuración centralizada**: `.opencode/agents/` y `.opencode/skills/` contienen
  las instrucciones y playbooks que cualquier IA puede seguir.
- **Adaptadores Devin**: `.devin/skills/` contiene skills que actúan como puentes
  entre el sistema opencode y las herramientas nativas de Devin:
  - `sdd-orchestrator`: Orquestador SDD adaptado para `run_subagent` de Devin
  - `opencode-agent`: Carga instrucciones de agentes opencode para subagentes
  - `opencode-skill`: Carga skills opencode como contexto adicional
- **Artefactos**: spec en `docs/specs/`, plan en `docs/plans/` (mismo slug kebab-case).
- **Gates**: Aprobación del usuario (Aprobar / Editar / Rechazar). En "Editar" se
  re-ejecuta la etapa con el feedback.
- **El orquestador nunca hace commit** sin pedirlo.

### Uso

- **Con opencode**: Usa el comando `/sdd "idea"` que invoca el orquestador nativo.
- **Con Devin**: Invocá el skill `sdd-orchestrator` y pasale la idea. El skill usa
  `run_subagent` para coordinar los subagentes según las instrucciones de
  `.opencode/agents/`.

Ambos sistemas producen los mismos artefactos y siguen el mismo flujo.

## Docs

**Expo HAS CHANGED** — leer las docs versionadas en https://docs.expo.dev/versions/v57.0.0/ antes de escribir código.

- NativeWind v5: https://www.nativewind.dev/v5
- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://zustand.docs.pmnd.rs
- Biome: https://biomejs.dev
