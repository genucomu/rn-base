# rn-base

Proyecto base de React Native con **Expo SDK 57** (React Native 0.86, React 19.2.3) y `expo-router`, listo para escalar: Tailwind (NativeWind), TanStack Query, Zustand, Biome y Husky.

## Stack

| Área | Herramienta |
| --- | --- |
| Framework | [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) |
| Routing | [expo-router](https://docs.expo.dev/router/introduction/) (file-based) + NativeTabs |
| Estilos | [NativeWind v5](https://www.nativewind.dev/v5) + [Tailwind CSS v4](https://tailwindcss.com) |
| Datos de servidor | [TanStack Query v5](https://tanstack.com/query/latest) |
| Estado global | [Zustand v5](https://zustand.docs.pmnd.rs) + `AsyncStorage` (persist) |
| Lint / format | [Biome](https://biomejs.dev) |
| Git hooks | Husky + lint-staged |

## Requisitos

- Node.js ≥ 22.13 (recomendado: 24+)
- Expo Go o emulador (Android/iOS)

## Setup

```bash
npm install
```

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run start` | Levanta Expo dev server |
| `npm run android` | Abre en Android |
| `npm run ios` | Abre en iOS |
| `npm run web` | Abre en web |
| `npm run lint` | Biome check (sin escribir) |
| `npm run lint:fix` | Biome check con autofix |
| `npm run format` | Biome format --write |
| `npm run typecheck` | `tsc --noEmit` |

El hook `pre-commit` (Husky) corre `typecheck` + `lint-staged` (Biome `check --write`) sobre los archivos staged.

## Estructura

```
src/
├── app/            # Rutas (expo-router): _layout.tsx, index.tsx, explore.tsx
├── components/     # Componentes UI (app-tabs, themed-text, etc.)
├── constants/      # theme.ts (colores, fuentes, spacing)
├── hooks/          # Hooks: use-theme, use-health (ejemplo de query)
├── lib/            # query-client.ts (TanStack Query + focus/online manager)
├── stores/         # Zustand: settings-store.ts (ejemplo con persist)
└── global.css      # Tailwind v4 imports + variables de fuente
```

## Convenciones

- **Estado servidor → TanStack Query** (fetch, caché, mutaciones). Nunca guardar datos de API en Zustand.
- **Estado global cliente → Zustand** (settings, auth, UI), con `persist` via AsyncStorage si debe sobrevivir al reinicio.
- **Estilos con NativeWind**: usar `className` en componentes RN. Para colores que cambian con el tema, usar variantes `dark:`.
- **Nuevas pantallas**: archivo en `src/app/` + registro en `src/components/app-tabs.tsx` (ver skill `new-screen`).
- **Módulos nativos**: instalar con `npx expo install` (respeta versiones del SDK).
- **Lint**: Biome reemplaza ESLint y Prettier. Correr `npm run lint:fix` antes de commitear.

## Notas del setup

- NativeWind v5 (pre-release) + Tailwind v4: se configura en `metro.config.js` (`withNativewind`) y `postcss.config.mjs` (`@tailwindcss/postcss`). No hay `babel.config.js`.
- ⚠️ `package.json` fija `overrides.lightningcss: "1.30.1"` — **no tocarlo**. Sin ese pin el bundler falla al procesar `global.css`.
- El app usa light/dark mode automático (usa `useColorScheme` / `useTheme`).

## Docs

- Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/
- NativeWind v5: https://www.nativewind.dev/v5
- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://zustand.docs.pmnd.rs
- Biome: https://biomejs.dev
