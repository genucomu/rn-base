# Cerrar sesión

## Contexto / Problema

El usuario autenticado no tiene forma de cerrar sesión desde la interfaz. Actualmente el `auth-store` expone la acción `logout()` pero no hay ningún botón o flujo de UI que la invoque. Se necesita un botón accesible desde el área principal autenticada para que el usuario pueda cerrar su sesión y volver a la pantalla de login.

## Objetivos

- Agregar un botón de cerrar sesión visible en la pantalla Home (`src/app/(tabs)/index.tsx`).
- Al tocar el botón, limpiar el estado de autenticación y redirigir al login.
- Pedir confirmación antes de cerrar sesión para evitar taps accidentales.

## No-objetivos

- Cerrar sesión desde un menú de settings (no existe pantalla de settings aún).
- Cerrar sesión automáticamente al recibir un 401 (eso ya está cubierto por el interceptor de la spec de auth).
- Cerrar sesión desde un perfil/usuario (no existe pantalla de perfil aún).
- Invalidar el token en el backend (asumimos que el backend maneja expiración por su cuenta).

## Supuestos

- El `auth-store` (`src/stores/auth-store.ts`) ya tiene la acción `logout()` que limpia `token`, `user` y `isAuthenticated`.
- El layout raíz (`src/app/_layout.tsx`) ya redirige a `(auth)/login` cuando `isAuthenticated` es `false`, así que después de llamar `logout()` la navegación ocurrirá automáticamente.
- El usuario quiere ver el botón en la pantalla Home, que es la pantalla principal a la que llega después del login.
- Se usa `Alert.alert` de React Native para la confirmación (no se necesita librería adicional).

## Requerimientos funcionales

- [ ] **RF-1: Botón de cerrar sesión en Home** — Agregar un botón/touchable en `src/app/(tabs)/index.tsx` con texto "Cerrar sesión" (o un ícono de logout) que, al ser presionado, muestre un diálogo de confirmación.
- [ ] **RF-2: Confirmación antes de logout** — Usar `Alert.alert` con título "Cerrar sesión" y mensaje "¿Estás seguro de que querés cerrar sesión?" con opciones "Cancelar" y "Cerrar sesión".
- [ ] **RF-3: Ejecutar logout** — Al confirmar, llamar a `useAuthStore.logout()`. El redirect a `(auth)/login` ocurrirá automáticamente por la lógica existente en `_layout.tsx`.
- [ ] **RF-4: Limpiar caché de TanStack Query** — Al hacer logout, invalidar o limpiar el `queryClient` para que no queden datos del usuario anterior en caché.

## Requerimientos no funcionales

- **Estilos**: El botón se estiliza con NativeWind (`className`). Se mantiene consistente con el diseño existente de la pantalla Home.
- **Accesibilidad**: El botón tiene `accessibilityLabel` descriptivo ("Cerrar sesión") y `accessibilityRole="button"`.
- **UX**: El botón muestra un estado visual claro (color destructivo o similar) para diferenciarse de acciones primarias. La confirmación evita cerrar sesión accidentalmente.
- **Tipeado**: `npm run typecheck` debe pasar sin errores.
- **Lint**: `npm run lint:fix` debe pasar sin warnings.

## Datos / API

### Store existente (`auth-store`)

```ts
// Ya implementado en src/stores/auth-store.ts
logout: () => set({ token: null, user: null, isAuthenticated: false });
```

### TanStack Query

- Se usa `queryClient.invalidateQueries()` o `queryClient.clear()` para limpiar el caché al hacer logout.
- `queryClient` está disponible vía `useQueryClient()` de `@tanstack/react-query`.

## UI / Navegación

### Ubicación del botón

El botón se agrega en `src/app/(tabs)/index.tsx` (pantalla Home). Opciones de posición:

1. **Header area** — Un botón en la parte superior de la pantalla, junto al título "Welcome to Expo". Es el lugar más visible y accesible.
2. **Footer** — Un botón al fondo de la pantalla. Menos visible.

**Decisión**: Opción 1 — Header area. Se agrega un botón en la zona superior de la pantalla Home, alineado a la derecha o como parte del hero section.

### Flujo de usuario

1. Usuario está en Home, ve el botón "Cerrar sesión".
2. Toca el botón → aparece `Alert.alert` con confirmación.
3. Toca "Cerrar sesión" en el alert → `auth-store.logout()` + `queryClient.clear()`.
4. `_layout.tsx` detecta `isAuthenticated === false` → redirige a `(auth)/login`.
5. Usuario ve la pantalla de login.

## Manejo de errores y edge cases

| Caso | Comportamiento |
| --- | --- |
| Usuario toca "Cancelar" en el alert | No pasa nada, se queda en Home. |
| Usuario toca fuera del alert | Se cierra el alert, no se hace logout. |
| Logout con queries activas en vuelo | `queryClient.clear()` las descarta. Las queries que retornen 401 se manejan por el interceptor existente. |
| Múltiples taps rápidos en el botón | `Alert.alert` es nativo y bloquea interacción hasta que se resuelve, así que no hay problema. |

## Estrategia de testing

- **Typecheck**: `npm run typecheck` debe pasar sin errores.
- **Lint**: `npm run lint:fix` debe pasar sin warnings.
- **Pruebas manuales**:
  1. Abrir Home → ver botón de cerrar sesión visible.
  2. Tocar el botón → aparece alerta de confirmación.
  3. Tocar "Cancelar" → se queda en Home, no hace logout.
  4. Tocar "Cerrar sesión" → redirige a la pantalla de login.
  5. Volver a loguearse → funciona correctamente (el caché se limpió).
  6. Verificar que Home y Explore siguen funcionando normalmente después del login.

## Preguntas abiertas

- **Posición exacta del botón**: ¿En la header bar (arriba a la derecha), como botón flotante, o integrado en el contenido de Home? La spec asume un botón visible en la zona superior de la pantalla Home.
- **Estilo del botón**: ¿Solo texto "Cerrar sesión", o un ícono de logout (ej. `🚪` o un SymbolView)? La spec asume un botón de texto simple por simplicidad, pero se puede adaptar.
- **Invalidación de caché**: ¿Usar `queryClient.clear()` (más agresivo) o `queryClient.invalidateQueries()` (más selectivo)? La spec asume `clear()` para un clean state completo.

## Criterios de aceptación

- [ ] El botón de cerrar sesión es visible en la pantalla Home.
- [ ] Al tocar el botón se muestra un `Alert.alert` de confirmación.
- [ ] Confirmar el logout ejecuta `auth-store.logout()` y limpia el caché de TanStack Query.
- [ ] Después del logout, el usuario es redirigido a la pantalla de login.
- [ ] Cancelar el alert no ejecuta ninguna acción.
- [ ] El botón tiene `accessibilityLabel` y `accessibilityRole="button"`.
- [ ] El botón usa estilos NativeWind (className, no StyleSheet).
- [ ] La pantalla Home sigue funcionando correctamente después del login (navegación a Explore, etc.).
- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm run lint:fix` pasa sin warnings.
