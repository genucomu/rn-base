# Plan: Cerrar sesión

## Referencia

- Spec: `docs/specs/cerrar-sesion.md`

## Análisis del codebase existente

- **`src/stores/auth-store.ts`** — Ya tiene `logout()` que setea `token: null, user: null, isAuthenticated: false`. Persiste con AsyncStorage.
- **`src/app/_layout.tsx`** — Ya redirige a `/(auth)/login` cuando `isAuthenticated === false` (líneas 36-43). El `queryClient` se pasa vía `QueryClientProvider`.
- **`src/lib/query-client.ts`** — El `queryClient` ya llama `queryClient.clear()` en el handler de 401 (línea 55). Para accederlo en componentes se usa `useQueryClient()` de `@tanstack/react-query`.
- **`src/app/(tabs)/index.tsx`** — Pantalla Home actual. Usa `StyleSheet.create()` + `ThemedView`/`ThemedText`. No usa NativeWind.
- **`src/components/stack-demo.tsx`** — Ejemplo de NativeWind en el proyecto: JSX estándar con `className` en `View`, `Text`, `Pressable` de React Native.
- **`src/app/(auth)/login.tsx`** — Otro ejemplo de NativeWind: `className` con tokens de tema (`bg-primary`, `text-primary-foreground`, `bg-destructive`, `text-destructive`).

## Convención NativeWind del proyecto

- Usar `View`, `Text`, `Pressable` de `react-native` con `className` (no `createElement`).
- Tokens de tema de Tailwind CSS v4 disponibles: `bg-primary`, `text-primary-foreground`, `bg-destructive`, `text-destructive-foreground`, `bg-background`, `text-foreground`, `border-border`, etc.
- Referencia: `src/components/stack-demo.tsx` (patrón limpio) y `src/app/(auth)/login.tsx`.

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/app/(tabs)/index.tsx` | modificar | Agregar botón de cerrar sesión con NativeWind + confirmación + limpieza de caché |

## Descomposición en tareas

### T1 — Agregar botón de cerrar sesión en Home con NativeWind

**Archivos que toca:** `src/app/(tabs)/index.tsx`

**Qué hacer:**

#### 1. Actualizar imports

Agregar estos imports (al inicio del archivo):

```tsx
import { Alert, Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
```

**No eliminar** los imports existentes de `ThemedView`, `ThemedText`, `AnimatedIcon`, `HintRow`, `WebBadge`, etc. — se mantienen para el contenido actual de la pantalla. Solo se agregan los nuevos.

#### 2. Agregar hooks dentro de `HomeScreen`

Antes del `return`, agregar:

```tsx
const logout = useAuthStore((s) => s.logout);
const queryClient = useQueryClient();
```

#### 3. Crear función `handleLogout`

Dentro del componente, crear la función:

```tsx
function handleLogout() {
  Alert.alert(
    'Cerrar sesión',
    '¿Estás seguro de que querés cerrar sesión?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          queryClient.clear();
          logout();
        },
      },
    ],
  );
}
```

**Nota:** `queryClient.clear()` se ejecuta ANTES de `logout()` para limpiar el caché antes de que `_layout.tsx` detecte `isAuthenticated === false` y redirija.

#### 4. Agregar el botón en la UI

Insertar el botón **dentro del `<SafeAreaView>`**, antes del `<ThemedView style={styles.heroSection}>`. Envolver en un `<View>` con `className` para alinearlo a la derecha:

```tsx
<View className="w-full flex-row justify-end">
  <Pressable
    onPress={handleLogout}
    className="bg-destructive rounded-lg px-4 py-2"
    accessibilityRole="button"
    accessibilityLabel="Cerrar sesión"
  >
    <Text className="text-destructive-foreground font-semibold text-sm">
      Cerrar sesión
    </Text>
  </Pressable>
</View>
```

**Clases NativeWind usadas:**
- Contenedor: `w-full flex-row justify-end` — ancho completo, alineado a la derecha.
- Botón: `bg-destructive rounded-lg px-4 py-2` — fondo rojo destructivo, bordes redondeados, padding.
- Texto: `text-destructive-foreground font-semibold text-sm` — texto blanco sobre rojo, semibold, tamaño pequeño.

**Props de accesibilidad:**
- `accessibilityRole="button"`
- `accessibilityLabel="Cerrar sesión"`

#### 5. Eliminar `StyleSheet.create()` y el bloque `styles`

Una vez que el botón usa NativeWind y el resto del archivo ya no depende de `styles` (ver punto 6), eliminar:
- El import `StyleSheet` de `react-native` (si no se usa en otro lado del archivo).
- Todo el bloque `const styles = StyleSheet.create({ ... })` al final del archivo.

#### 6. Migrar los estilos existentes del archivo a NativeWind

Reemplazar los `style={styles.xxx}` de los elementos existentes por `className`:

| Elemento actual | Reemplazo NativeWind |
| --- | --- |
| `<ThemedView style={styles.container}>` | `<ThemedView className="flex-1 justify-center flex-row">` |
| `<SafeAreaView style={styles.safeArea}>` | `<SafeAreaView className="flex-1 px-4 items-center gap-3 pb-12 max-w-[600px]">` |
| `<ThemedView style={styles.heroSection}>` | `<ThemedView className="items-center justify-center flex-1 px-4 gap-4">` |
| `<ThemedText type="title" style={styles.title}>` | `<ThemedText type="title" className="text-center">` |
| `<ThemedText type="code" style={styles.code}>` | `<ThemedText type="code" className="uppercase">` |
| `<ThemedView type="backgroundElement" style={styles.stepContainer}>` | `<ThemedView type="backgroundElement" className="gap-3 self-stretch px-3 py-4 rounded-xl">` |

**Nota:** `ThemedView` y `ThemedText` aceptan `className` porque son wrappers que extienden `View`/`Text` de React Native. Se verificó que existen en el proyecto (`src/components/themed-view.tsx`, `src/components/themed-text.tsx`).

**Constantes de tema que se pierden al migrar:**
- `Spacing.four` → `px-4`, `py-4`, `gap-4` (4 = 16px en el theme)
- `Spacing.three` → `gap-3`, `px-3` (3 = 12px)
- `Spacing.five` → `rounded-xl` (5 = 20px, approx)
- `BottomTabInset` → `pb-12` (aproximado, o mantener como valor dinámico si es necesario)
- `MaxContentWidth` → `max-w-[600px]` (o la constante exacta)

**Decisión sobre constantes dinámicas:** Si `BottomTabInset` o `MaxContentWidth` son valores que pueden cambiar, se puede envolver en un `<View style={{ paddingBottom: BottomTabInset + Spacing.three }}>` manteniendo solo ese estilo inline. El resto se migra a NativeWind.

#### Estructura JSX resultante del return

```tsx
return (
  <ThemedView className="flex-1 justify-center flex-row">
    <SafeAreaView className="flex-1 px-4 items-center gap-3 pb-[BottomTabInset+12] max-w-[600px]">
      {/* Botón de cerrar sesión — nueva adición */}
      <View className="w-full flex-row justify-end">
        <Pressable
          onPress={handleLogout}
          className="bg-destructive rounded-lg px-4 py-2"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text className="text-destructive-foreground font-semibold text-sm">
            Cerrar sesión
          </Text>
        </Pressable>
      </View>

      <ThemedView className="items-center justify-center flex-1 px-4 gap-4">
        <AnimatedIcon />
        <ThemedText type="title" className="text-center">
          Welcome to&nbsp;Expo
        </ThemedText>
      </ThemedView>

      <ThemedText type="code" className="uppercase">
        get started
      </ThemedText>

      <ThemedView type="backgroundElement" className="gap-3 self-stretch px-3 py-4 rounded-xl">
        <HintRow
          title="Try editing"
          hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
        />
        <HintRow title="Dev tools" hint={getDevMenuHint()} />
        <HintRow
          title="Fresh start"
          hint={<ThemedText type="code">npm run reset-project</ThemedText>}
        />
      </ThemedView>

      {Platform.OS === 'web' && <WebBadge />}
    </SafeAreaView>
  </ThemedView>
);
```

**Conflictos de archivos:** Ninguna otra tarea toca este archivo.

## Librerías / dependencias

- No se necesitan nuevas dependencias. Todos los imports (`Alert`, `Pressable`, `Text`, `View`, `useQueryClient`, `useAuthStore`) ya están disponibles.

## Riesgos / dependencias

- **Riesgo bajo:** El `queryClient.clear()` ya se usa en el handler de 401 en `query-client.ts` (línea 55). Mismo patrón.
- **Riesgo bajo:** La redirección post-logout ya funciona en `_layout.tsx`. No hay que agregar lógica de navegación.
- **Riesgo medio (migración):** Al eliminar `StyleSheet.create()`, las constantes de tema (`Spacing.xxx`, `BottomTabInset`, `MaxContentWidth`) se reemplazan por clases estáticas de Tailwind. Si `BottomTabInset` es dinámico (cambia por plataforma), se puede mantener como `style` inline en el `<SafeAreaView>`.
- **Riesgo bajo:** `ThemedView` y `ThemedText` aceptan `className` porque extienden `View`/`Text`. Verificar que no haya conflictos entre `style` y `className` (NativeWind maneja ambos, pero es limpio usar solo `className`).

## Verificación

1. `npm run typecheck` — debe pasar sin errores
2. `npm run lint:fix` — debe pasar sin warnings
3. **Prueba manual:**
   - Abrir Home → ver botón "Cerrar sesión" alineado a la derecha arriba del hero
   - Botón con estilo rojo destructivo, visible y diferenciado
   - Tocar botón → aparece alerta de confirmación
   - Tocar "Cancelar" → se queda en Home
   - Tocar "Cerrar sesión" → redirige a login
   - Login nuevamente → funciona correctamente
   - Verificar que Home y Explore siguen funcionando normalmente
