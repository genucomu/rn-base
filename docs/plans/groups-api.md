# Plan: API de grupos

## Referencia

- Spec: `docs/specs/groups-api.md`

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/features/groups/types.ts` | crear | Definición del tipo `Group`, payloads y validaciones de negocio. |
| `src/features/groups/api.ts` | crear | Endpoints del dominio de grupos y helper de transformaciones. |
| `src/features/groups/queries.ts` | crear | Hooks de TanStack Query para listado, detalle y mutaciones. |
| `src/features/groups/index.ts` | crear | Export de tipos y hooks del módulo. |
| `src/app/(tabs)/groups.tsx` | crear | Pantalla de listado de grupos. |
| `src/app/(tabs)/groups/[id].tsx` | crear | Pantalla de detalle de grupo. |
| `src/components/app-tabs.tsx` | modificar | Registrar el tab de grupos si se integra como pantalla principal. |
| `src/lib/query-client.ts` | revisar | Mantener estructura de query keys y defaults compartidos. |

## Descomposición en tareas

1. **T1 — Definir el modelo de dominio**: archivos que toca: `src/features/groups/types.ts`; establecer `Group`, `GroupMember`, payloads de create/update y estados `archived`/activo. Requiere consenso del contrato del backend.
2. **T2 — Crear la capa de API**: archivos que toca: `src/features/groups/api.ts`; definir `listGroups`, `getGroupById`, `createGroup`, `updateGroup`, `archiveGroup` y `listGroupMembers` usando el cliente HTTP centralizado.
3. **T3 — Alinear TanStack Query**: archivos que toca: `src/features/groups/queries.ts`; crear `useGroups`, `useGroup`, `useCreateGroup`, `useUpdateGroup` y `useArchiveGroup` con invalidación de cache y claves por dominio.
4. **T4 — Pintar pantallas del dominio**: archivos que toca: `src/app/(tabs)/groups.tsx`, `src/app/(tabs)/groups/[id].tsx`; construir empty state, loading, detalle con miembros y acciones de edición/archivo.
5. **T5 — Registrar navegación**: archivos que toca: `src/components/app-tabs.tsx`; agregar un trigger para el listado de grupos y dejar visible la estructura de tabs del app.
6. **T6 — Validación del flujo completo**: archivos que toca: `src/features/groups/*`, `src/app/(tabs)/groups*.tsx`; verificar permisos, errores de validación, vacíos relevantes y no-regresión de la navegación global.

## Librerías / dependencias

- No requiere librerías nuevas en esta etapa.
- Se usan las convenciones actuales de Expo Router, NativeWind y TanStack Query.

## Riesgos / dependencias

- La entidad `Group` puede necesitar `ownerId`/`memberIds` y estas relaciones pueden no estar completamente definidas por el backend; la implementación debe mantener campos opcionales y un adaptador de mapeo.
- El detalle de permisos (`owner` vs member) debe resolverse con una política simple para no bloquear la feature.
- La decisión entre `delete` real o `archive` afecta la API y el comportamiento del listado; debe dejarse explícita en la capa de dominio.

## Verificación

- `npm run typecheck`
- `npm run lint:fix`
- Validación manual:
  - listado vacío
  - detalle de grupo con miembros
  - crear grupo válido
  - error por nombre vacío
  - archivar grupo
