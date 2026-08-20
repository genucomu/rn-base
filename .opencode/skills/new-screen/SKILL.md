---
name: new-screen
description: Workflow for adding a new screen/route in the rn-base expo-router project, including registering it as a tab. Use when the user asks to add a new screen, page, route, or tab to the app.
---

# New Screen Workflow

En este proyecto las rutas son archivos en `src/app/` (expo-router, file-based).

## Arquitectura de capas

```
src/app/<route>.tsx    →  importa hooks + componentes, orquesta la pantalla
src/hooks/use-*.ts     →  useQuery / useMutation, llaman a services
src/services/*.ts      →  fetch a la API, retornan Promise<T>
src/components/*.tsx   →  UI pura, reciben data por props
src/types/api.ts       →  DTOs tipados de la API
```

**Regla**: las pages/layouts usan hooks. Los componentes solo renderizan. Los services solo hacen fetch.

## Pasos

1. **Crear el archivo de ruta** en `src/app/<name>.tsx`:

   ```tsx
   import { useXxx } from '@/hooks/use-xxx';
   import { XxxList } from '@/components/xxx-list';

   export default function XxxScreen() {
     const { data, isLoading, error } = useXxx();

     if (isLoading) return <LoadingState />;
     if (error) return <ErrorState />;

     return <XxxList items={data?.items ?? []} />;
   }
   ```

   - Nombres en camelCase o kebab-case según la URL deseada (ej. `profile.tsx` → `/profile`).

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
   - El icono es un PNG en `assets/images/tabIcons/`.

3. **Service** (si el endpoint no tiene service aún) en `src/services/<module>.service.ts`:

   ```ts
   import { http } from './http';

   export const xxxService = {
     list(params?: XxxListParams) {
       return http.get<XxxListResponse>('/endpoint', params);
     },
   };
   ```

4. **Hook** en `src/hooks/use-xxx.ts`:

   ```ts
   import { useQuery } from '@tanstack/react-query';
   import { queryKeys } from '@/lib/query-keys';
   import { xxxService } from '@/services/xxx.service';

   export function useXxx(params?: XxxListParams) {
     return useQuery({
       queryKey: queryKeys.xxx.list(params),
       queryFn: () => xxxService.list(params),
     });
   }
   ```

5. **Componente** (si necesita UI reutilizable) en `src/components/xxx-list.tsx`:

   ```tsx
   import type { Xxx } from '@/types/api';

   export function XxxList({ items }: { items: Xxx[] }) {
     return <View>...</View>;
   }
   ```

6. **Query keys** → agregar en `src/lib/query-keys.ts` si es un módulo nuevo.

7. **Types** → agregar DTOs en `src/types/api.ts` si es un módulo nuevo.

8. **Verificar**: `npm run typecheck` y `npm run lint:fix` antes de commitear.
