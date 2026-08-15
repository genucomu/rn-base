---
name: new-screen
description: Workflow for adding a new screen/route in the rn-base expo-router project, including registering it as a tab. Use when the user asks to add a new screen, page, route, or tab to the app.
---

# New Screen Workflow

En este proyecto las rutas son archivos en `src/app/` (expo-router, file-based).

## Pasos

1. **Crear el archivo de ruta** en `src/app/<name>.tsx`:

   ```tsx
   import { ThemedText } from '@/components/themed-text';
   import { ThemedView } from '@/components/themed-view';
   import { SafeAreaView } from 'react-native-safe-area-context';

   export default function Screen() {
     return (
       <ThemedView style={{ flex: 1 }}>
         <SafeAreaView>
           <ThemedText type="title">Nueva pantalla</ThemedText>
         </SafeAreaView>
       </ThemedView>
     );
   }
   ```

   - Nombres en camelCase o kebab-case según la URL deseada (ej. `profile.tsx` → `/profile`).
   - Respetar las convenciones del template: `ThemedText`/`ThemedView`, estilos con StyleSheet o `className`.

2. **Registrar el tab** (si aplica) en `src/components/app-tabs.tsx`:

   ```tsx
   <NativeTabs.Trigger name="profile">
     <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
     <NativeTabs.Trigger.Icon
       src={require('@/assets/images/tabIcons/<name>.png')}
       renderingMode="template"
     />
   </NativeTabs.Trigger>
   ```

   - El `name` debe coincidir con el archivo en `src/app/`.
   - El icono es un PNG en `assets/images/tabIcons/` (o usar `expo-symbols` `SymbolView` si aplica).

3. **Datos de servidor** → crear hook con TanStack Query:

   ```tsx
   // src/hooks/use-foo.ts
   import { useQuery } from '@tanstack/react-query';

   export function useFoo() {
     return useQuery({
       queryKey: ['foo'],
       queryFn: async () => {
         const res = await fetch('https://api.example.com/foo');
         if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
         return res.json();
       },
     });
   }
   ```

4. **Estado global** → store en `src/stores/` con zustand (persist si debe sobrevivir al reinicio).

5. **Verificar**: `npm run typecheck` y `npm run lint:fix` antes de commitear.
