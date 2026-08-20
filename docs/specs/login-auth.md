# Login y Autenticación

## Contexto / Problema

La app actualmente no tiene ningún mecanismo de autenticación. El usuario accede directamente a las pantallas principales (Home, Explore) sin verificar identidad. Se necesita un flujo de login previo al contenido principal, y un mecanismo global que detecte respuestas 401 del backend para redirigir al usuario al login y limpiar la sesión.

## Objetivos

- Agregar una pantalla de login con formulario (email + password) estilizada con NativeWind.
- Persistir el token de autenticación (y datos básicos del usuario) en Zustand + AsyncStorage.
- Proteger las rutas principales: si no hay token válido → redirigir a login; si hay token → redirigir a Home.
- Interceptores que detecten 401 en cualquier request de TanStack Query y redirijan al login limpiando la sesión.

## No-objetivos

- OAuth / social login (Google, Apple, etc.).
- Registro de usuario nuevo (sign-up).
- Recuperación de contraseña (forgot password).
- MFA / autenticación de dos factores.
- Refresh token automático (se puede agregar como fase futura).
- Persistencia del token en SecureStore (por ahora se usa AsyncStorage vía Zustand persist).

## Supuestos

- Existe un backend con endpoint `POST /auth/login` que recibe `{ email, password }` y devuelve `{ token: string, user: { id, name, email } }`.
- El token es un JWT válido por un tiempo razonable (no se implementa refresh en esta fase).
- El backend devuelve HTTP 401 cuando el token es inválido o expirado.
- Se usa la estructura de carpetas existente: pantallas en `src/app/`, stores en `src/stores/`, lib en `src/lib/`.
- El layout raíz (`src/app/_layout.tsx`) se extiende para agregar un grupo de rutas protegidas vs. rutas públicas (login).

## Requerimientos funcionales

- [ ] **RF-1: Store de autenticación** — Crear `src/stores/auth-store.ts` con Zustand + persist (AsyncStorage) que almacene `{ token, user, isAuthenticated }` y exponga acciones `login(token, user)`, `logout()`.
- [ ] **RF-2: Pantalla de Login** — Crear `src/app/(auth)/login.tsx` con formulario de email + password usando NativeWind. El formulario valida campos vacíos y formato de email antes de enviar.
- [ ] **RF-3: Mutación de login** — Usar `useMutation` de TanStack Query para llamar `POST /auth/login`. En éxito: guardar token/user en auth-store y redirigir a `(tabs)`. En error: mostrar mensaje inline.
- [ ] **RF-4: Layout de autenticación** — Crear `src/app/(auth)/_layout.tsx` que sea un Stack simple sin tabs, para el grupo de rutas públicas.
- [ ] **RF-5: Layout de tabs protegido** — Mover el layout actual a `src/app/(tabs)/_layout.tsx` y mover `index.tsx` y `explore.tsx` dentro de `src/app/(tabs)/`.
- [ ] **RF-6: Layout raíz con redirect** — Modificar `src/app/_layout.tsx` para que, al montar, verifique si hay token en auth-store. Si hay token → redirect a `(tabs)`. Si no hay → redirect a `(auth)/login`.
- [ ] **RF-7: Interceptor 401** — Configurar un `onError` global en `queryClient` (o un custom fetchFn) que detecte respuestas 401, ejecute `auth-store.logout()`, invalide queries de TanStack Query, y redirija a `(auth)/login`.
- [ ] **RF-8: Pantalla de carga inicial** — Durante la verificación inicial del token (splash screen o estado loading), mostrar un indicador de carga consistente con la UX de la app.

## Requerimientos no funcionales

- **Estilos**: Todas las pantallas de login usan clases NativeWind (`className`). No se usa `StyleSheet.create` para nuevos estilos.
- **Seguridad**: El token se guarda en AsyncStorage (zustand persist). No se almacena en memoria cruda sin persist. Se recomienda migrar a SecureStore en fase futura.
- **UX**: El botón de login muestra estado de carga durante la mutación. Los campos tienen feedback de error inline. Se deshabilita el botón mientras se envía.
- **Performance**: La verificación del token al inicio debe ser síncrona (lee de AsyncStorage ya hidratado por Zustand persist) para evitar flicker.
- **Accesibilidad**: Campos de login con `accessibilityLabel`, botón con `accessibilityRole="button"`.
- **Tipeado**: Todo el código debe pasar `npm run typecheck` sin errores.

## Datos / API

### Endpoint

```
POST /auth/login
Body: { email: string, password: string }
Response 200: { token: string, user: { id: string, name: string, email: string } }
Response 401: { error: string }  // credenciales inválidas
Response 422: { errors: Record<string, string> }  // validación
```

### Store de auth (`auth-store`)

```ts
interface AuthState {
  token: string | null;
  user: { id: string; name: string; email: string } | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}
```

Persistido en AsyncStorage con key `'auth'`.

### TanStack Query

- Mutación `useLoginMutation` en `src/lib/api/auth.ts`.
- `queryClient` se extiende con un `onError` callback o se agrega un wrapper de fetch que intercepte 401.

## UI / Navegación

### Estructura de rutas (expo-router)

```
src/app/
  _layout.tsx              ← Layout raíz (redirect logic)
  (auth)/
    _layout.tsx            ← Stack público (sin tabs)
    login.tsx              ← Pantalla de login
  (tabs)/
    _layout.tsx            ← NativeTabs (movido desde _layout.tsx actual)
    index.tsx              ← Home (movido desde src/app/index.tsx)
    explore.tsx            ← Explore (movido desde src/app/explore.tsx)
```

### Pantalla de login

- Logo / branding de la app arriba.
- Campo `TextInput` email (tipo email, autoCapitalize="none", keyboardType="email-address").
- Campo `TextInput` password (secureTextEntry).
- Botón "Iniciar sesión" con estado de loading (ActivityIndicator).
- Mensaje de error inline si falla el login.
- Estilos: Tailwind v4 vía NativeWind (`className`). Ejemplo: `className="bg-background p-6 gap-4"`.

### Flujos de usuario

1. **App cold start con token** → `_layout.tsx` lee auth-store → `(tabs)` se carga → Home.
2. **App cold start sin token** → `_layout.tsx` lee auth-store → `(auth)/login` se carga.
3. **Login exitoso** → `login mutation onSuccess` → `router.replace('(tabs)')`.
4. **Request falla con 401** → interceptor → `auth-store.logout()` → `queryClient.clear()` → `router.replace('(auth)/login')`.
5. **Logout manual** (futura implementación, no en alcance de esta spec) → `auth-store.logout()` → redirect a login.

## Manejo de errores y edge cases

| Caso | Comportamiento |
| --- | --- |
| Credenciales incorrectas (401 en login) | Mensaje inline: "Email o contraseña incorrectos". Botón se re-habilita. |
| Error de red (sin conexión) | Mensaje inline: "No se pudo conectar. Verificá tu conexión." con opción de reintentar. |
| Token expirado (401 en request protegido) | Interceptor global: logout + redirect a login + invalidar queries. |
| Campos vacíos | Validación inline antes de enviar: "El email es requerido", "La contraseña es requerida". |
| Email con formato inválido | Validación inline: "Ingresá un email válido". |
| Múltiples 401 simultáneos | Solo se ejecuta logout una vez (guard con flag o debounce en el interceptor). |
| Zustand hydration delay | SplashScreen se mantiene visible hasta que Zustand hidrate (ya existe `AnimatedSplashOverlay`). |

## Estrategia de testing

- **Typecheck**: `npm run typecheck` debe pasar sin errores tras los cambios.
- **Lint**: `npm run lint:fix` debe pasar sin warnings.
- **Pruebas manuales**:
  1. Abrir app sin token → debe mostrar login.
  2. Login con credenciales correctas → redirige a Home.
  3. Login con credenciales incorrectas → muestra error inline.
  4. Cerrar y reabrir app con token guardado → va directo a Home.
  5. Simular 401 (mock backend) → redirige a login y limpia estado.
  6. Verificar que los tabs (Home, Explore) funcionan igual que antes.
- **Pruebas unitarias** (futuro): Test del auth-store (login, logout, persist).

## Preguntas abiertas

- **URL del backend**: ¿Cuál es la URL base del API? Se asume una constante `API_BASE_URL` configurable.
- **Refresh token**: No está en alcance, pero se debe diseñar el store para que sea extensible (agregar `refreshToken` en el futuro).
- **Logout manual**: No está en alcance, pero se debe agregar un botón de logout en algún menú de settings como paso siguiente.
- **Biometría**: No está en alcance. Podría agregarse después como alternativa al login por contraseña.

## Criterios de aceptación

- [ ] La pantalla de login se muestra cuando no hay token guardado.
- [ ] La pantalla de login está estilizada con NativeWind (className, no StyleSheet).
- [ ] El formulario valida campos vacíos y formato de email antes de enviar.
- [ ] Login exitoso guarda token y user en Zustand persist y redirige a Home.
- [ ] Login fallido muestra mensaje de error inline y re-habilita el botón.
- [ ] Al abrir la app con token válido se redirige directamente a Home (sin pasar por login).
- [ ] Un 401 en cualquier request de TanStack Query ejecuta logout y redirige a login.
- [ ] El interceptor 401 invalida el caché de TanStack Query (`queryClient.clear()`).
- [ ] El layout de tabs `(tabs)` funciona igual que antes (Home + Explore con NativeTabs).
- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm run lint:fix` pasa sin warnings.
- [ ] La SplashScreen se mantiene visible durante la hidratación de Zustand (sin flicker).
