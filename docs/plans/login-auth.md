# Plan: Login y Autenticación

## Referencia

- Spec: `docs/specs/login-auth.md`

## Estado de tareas

| # | Tarea | Archivos | Estado | Deps |
| --- | --- | --- | --- | --- |
| T1 | Auth store (Zustand + persist) | `src/stores/auth-store.ts` | pending | — |
| T2 | API helper de login | `src/lib/api/auth.ts` | pending | — |
| T3 | Mover pantallas a `(tabs)/` | `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/explore.tsx` | pending | — |
| T4 | Layout de auth `(auth)/` | `src/app/(auth)/_layout.tsx` | pending | — |
| T5 | Pantalla de login | `src/app/(auth)/login.tsx` | pending | T1, T2, T4 |
| T6 | Layout raíz con redirect | `src/app/_layout.tsx` | pending | T1, T3 |
| T7 | Interceptor 401 global | `src/lib/query-client.ts` | pending | T1, T6 |
| T8 | Verificación final (typecheck + lint) | — | pending | T1–T7 |

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/stores/auth-store.ts` | **crear** | Store Zustand con persist (AsyncStorage). Interface `AuthState` con `token`, `user`, `isAuthenticated`, acciones `login()` y `logout()`. Seguir patrón exacto de `settings-store.ts`. |
| `src/lib/api/auth.ts` | **crear** | Mutación `useLoginMutation` que llama `POST /auth/login` via `fetch`. Exporta hook que encapsula `useMutation` de TanStack Query. Definir tipos `LoginRequest`, `LoginResponse`. |
| `src/app/(tabs)/_layout.tsx` | **crear** | Mover el contenido del actual `_layout.tsx` (NativeTabs + tabs) a este archivo. Se vuelve el layout de las rutas protegidas. |
| `src/app/(tabs)/index.tsx` | **crear** | Mover contenido de `src/app/index.tsx` (HomeScreen) sin cambios. |
| `src/app/(tabs)/explore.tsx` | **crear** | Mover contenido de `src/app/explore.tsx` (TabTwoScreen) sin cambios. |
| `src/app/(auth)/_layout.tsx` | **crear** | Layout Stack simple para rutas públicas. Importa `global.css` (nativo para NativeWind). No incluye tabs ni providers (ya están en `_layout.tsx` raíz). |
| `src/app/(auth)/login.tsx` | **crear** | Pantalla de login con formulario email+password. Valida campos vacíos y formato email. Usa `useLoginMutation`. Botón con estado loading. Mensajes de error inline. Estilos vía NativeWind `className`. |
| `src/app/_layout.tsx` | **modificar** | Convertir en layout raíz con `<Stack>` de expo-router. Verificar `auth-store` al montar. Si hay token → redirect `(tabs)`. Si no → redirect `(auth)/login`. Mantener `QueryClientProvider`, `ThemeProvider`, `AnimatedSplashOverlay` y `SplashScreen.preventAutoHideAsync()`. |
| `src/lib/query-client.ts` | **modificar** | Agregar callback `onError` al `QueryClient` que detecte respuestas 401, ejecute `auth-store.logout()`, invalide queries (`queryClient.clear()`), y redirija a `(auth)/login`. Usar un flag/guard para evitar logout múltiple simultáneo. |
| `src/app/index.tsx` | **eliminar** | Se reubica en `src/app/(tabs)/index.tsx`. |
| `src/app/explore.tsx` | **eliminar** | Se reubica en `src/app/(tabs)/explore.tsx`. |

## Descomposición en tareas

### T1 — Auth Store

- **Archivos**: crear `src/stores/auth-store.ts`
- **Qué hacer**: Crear store Zustand siguiendo el patrón de `settings-store.ts`. Interface `AuthState` con `token: string | null`, `user: { id, name, email } | null`, `isAuthenticated: boolean`. Acciones `login(token, user)` y `logout()`. Persistir con `createJSONStorage(() => AsyncStorage)` bajo key `'auth'`.
- **Dependencias**: ninguna

### T2 — API Helper de Login

- **Archivos**: crear `src/lib/api/auth.ts`
- **Qué hacer**: Definir tipos `LoginRequest { email, password }` y `LoginResponse { token, user }`. Crear hook `useLoginMutation` que usa `useMutation` de TanStack Query con `mutationFn` que hace `fetch` POST al endpoint. El hook recibe `onSuccess` callback para que la pantalla maneje redirect y guardado en store.
- **Dependencias**: ninguna

### T3 — Mover pantallas a grupo `(tabs)/`

- **Archivos**:
  - crear `src/app/(tabs)/_layout.tsx` (contenido del actual `_layout.tsx` adaptado: importa `AppTabs` y renderiza `<NativeTabs>`)
  - crear `src/app/(tabs)/index.tsx` (contenido de `src/app/index.tsx` exacto)
  - crear `src/app/(tabs)/explore.tsx` (contenido de `src/app/explore.tsx` exacto)
  - eliminar `src/app/index.tsx`
  - eliminar `src/app/explore.tsx`
- **Qué hacer**: Reorganizar las pantallas existentes dentro del grupo `(tabs)`. El layout de tabs se queda con los triggers de NativeTabs. Las pantallas se copian sin cambios.
- **⚠️ Conflicto de archivos**: T3 elimina `src/app/index.tsx` y `src/app/explore.tsx`. T6 modifica `src/app/_layout.tsx`. Estas tareas pueden ejecutarse en paralelo.
- **Dependencias**: ninguna

### T4 — Layout de Auth

- **Archivos**: crear `src/app/(auth)/_layout.tsx`
- **Qué hacer**: Layout con `<Stack screenOptions={{ headerShown: false }}>` para el grupo público. Solo contiene la ruta `login.tsx`. Importa `global.css` si es necesario para NativeWind (verificar si el import ya está en `_layout.tsx` raíz).
- **Dependencias**: ninguna

### T5 — Pantalla de Login

- **Archivos**: crear `src/app/(auth)/login.tsx`
- **Qué hacer**: Componente `LoginScreen` con:
  - `TextInput` email (keyboardType email, autoCapitalize none)
  - `TextInput` password (secureTextEntry)
  - Estado local para `email`, `password`, `error`
  - Validación inline: campos vacíos, formato email (regex simple)
  - `useLoginMutation` con `onSuccess` que hace `authStore.login(token, user)` + `router.replace('/(tabs)')`
  - Botón "Iniciar sesión" con `ActivityIndicator` cuando `isPending`
  - Mensaje de error condicional
  - Accesibilidad: `accessibilityLabel` en campos, `accessibilityRole="button"` en botón
  - Estilos 100% NativeWind `className`
- **Dependencias**: requiere T1 (auth-store), T2 (useLoginMutation), T4 (layout para que exista la ruta)

### T6 — Layout Raíz con Redirect

- **Archivos**: modificar `src/app/_layout.tsx`
- **Qué hacer**: Reestructurar el layout raíz:
  - Mantener `SplashScreen.preventAutoHideAsync()`, `QueryClientProvider`, `ThemeProvider`, `AnimatedSplashOverlay`
  - Reemplazar `<AppTabs />` por `<Stack>` de expo-router
  - Leer `useAuthStore` para obtener `isAuthenticated`
  - Usar `useEffect` o lógica en el layout para: si hidratado + autenticado → `router.replace('/(tabs)')`; si hidratado + no autenticado → `router.replace('/(auth)/login')`
  - Mantener `SplashScreen` visible hasta que Zustand hidrate (usar `useAuthStore.persist.hasHydrated()` o el callback `onRehydrateStorage`)
  - `router.replace` para evitar que el usuario navegue hacia atrás al login tras autenticarse
- **⚠️ Conflicto de archivos**: T6 modifica `src/app/_layout.tsx` (el existente). T3 crea archivos nuevos en `(tabs)/`. No hay conflicto directo, pero T6 debe ejecutarse después de T3 para que las rutas `(tabs)` y `(auth)` existan.
- **Dependencias**: requiere T1 (auth-store), T3 (rutas existan)

### T7 — Interceptor 401 Global

- **Archivos**: modificar `src/lib/query-client.ts`
- **Qué hacer**:
  - Importar `useAuthStore` (el store, no el hook — usar `useAuthStore.getState()`)
  - Importar `router` de `expo-router`
  - Agregar `onError` callback al `QueryClient` que:
    1. Verifique si el error es 401 (chequear `error.status` o `error.message`)
    2. Use un guard (flag `let isLoggingOut = false`) para evitar logout múltiple simultáneo
    3. Ejecute `useAuthStore.getState().logout()`
    4. Ejecute `queryClient.clear()`
    5. Ejecute `router.replace('/(auth)/login')`
    6. Resete el flag después de un timeout corto
  - Consideración: `router` desde un archivo no-React puede no estar disponible. Alternativa: exportar una función `handle401` y llamarla desde componentes, o usar un event emitter. **Decisión**: crear una función `createAuthQueryClient` que reciba `router` como parámetro y se llame desde `_layout.tsx` donde el router ya está disponible.
- **Dependencias**: requiere T1 (auth-store), T6 (layout con router disponible)

### T8 — Verificación Final

- **Archivos**: no crea/modifica archivos directamente
- **Qué hacer**: Ejecutar `npm run typecheck` y `npm run lint:fix`. Corregir cualquier error encontrado.
- **Dependencias**: requiere T1–T7 completados

## Orden de implementación

```
Fase 1 (paralelo, sin deps):
  T1 (auth-store)  ─┐
  T2 (api/auth)    ─┤
  T3 (mover tabs)  ─┤
  T4 (auth layout) ─┘

Fase 2 (requiere Fase 1):
  T5 (pantalla login) — requiere T1, T2, T4
  T6 (layout raíz)   — requiere T1, T3

Fase 3 (requiere Fase 2):
  T7 (interceptor 401) — requiere T1, T6

Fase 4:
  T8 (verificación) — requiere todos
```

## Librerías / dependencias

- No se necesitan nuevas dependencias. `@tanstack/react-query`, `zustand`, `@react-native-async-storage/async-storage`, `expo-router` y `expo-splash-screen` ya están instalados.
- `expo-router` provee `<Stack>` y `useRouter` que se usarán para el layout y redirects.

## Riesgos / dependencias

- **Hidratación de Zustand**: `SplashScreen.preventAutoHideAsync()` ya está configurado. Se debe mantener el splash hasta que `auth-store` hidrate para evitar flicker (mostrar login flash antes de redirigir a tabs). Usar `onRehydrateStorage` del persist middleware.
- **Re-export de `router`**: `useRouter()` solo funciona dentro de componentes React. Para el interceptor 401 en `query-client.ts`, se debe pasar el router como dependencia o crear la queryClient dentro del layout. **Decisión**: exportar una función factory `createQueryClient(router)` que se llame en `_layout.tsx`.
- **Ruta raíz vacía**: Al mover las pantallas a `(tabs)/` y `(auth)/`, la ruta raíz `src/app/` queda sin archivo de pantalla (solo `_layout.tsx`). Expo-router maneja esto correctamente con redirects.
- **Web compatibility**: `app-tabs.web.tsx` existe. Verificar que el archivo `(tabs)/_layout.tsx` funcione en web. El componente `AppTabs` se importa igual, así que debería funcionar.
- **`AppTabs` import**: El `AppTabs` component se importa en el actual `_layout.tsx`. Al moverlo a `(tabs)/_layout.tsx`, el import sigue siendo `@/components/app-tabs`.

## Verificación

- `npm run typecheck` — debe pasar sin errores
- `npm run lint:fix` — debe pasar sin warnings
- Pruebas manuales:
  1. App sin token → muestra login
  2. Login exitoso → redirige a Home
  3. Login fallido → error inline
  4. Cerrar y reabrir con token → va a Home directo
  5. Simular 401 → redirect a login + limpiar estado
  6. Tabs (Home, Explore) funcionan igual que antes
