# Plan: Asignar y reasignar una task

## Referencia

- Spec: `docs/specs/asignar-task.md`

## Contexto verificado

- La pantalla existente es `src/app/groups/[id]/tasks/[taskId].tsx`; ya obtiene `groupId` y `taskId`, usa `useTask`, y conserva navegación a subtasks, marcar como hecha y eliminar.
- La pantalla todavía no obtiene el grupo ni sus miembros. `useGroup(groupId)` está implementado en `src/features/groups/queries.ts` y `getGroupById` mapea `userId` remoto a `GroupMember.id` y `userEmail` a `GroupMember.name`.
- Las operaciones de tasks viven en `src/features/tasks/api.ts` y las mutaciones en `src/features/tasks/queries.ts`. El detalle y listado usan `queryKeys.tasks.detail(groupId, taskId)` y `queryKeys.tasks.list(groupId)`.
- `src/services/http.ts` ya implementa `http.post`, inyección de token, refresh ante `401` y `HttpError`; no necesita cambios para esta feature.
- `src/types/api-contracts.md` documenta que los POST exitosos retornan el objeto completo sin envelope. La forma exacta de este endpoint todavía debe confirmarse contra OpenAPI antes de fijar el tipo de respuesta.

## Decisiones de arquitectura

- Mantener la separación service/query/UI: `assignTask` solo hará HTTP, `useAssignTask` validará parámetros y coordinará invalidaciones, y la pantalla manejará selección, estados y mensajes.
- Definir `AssignTaskInput` con `assigneeId: string`; no reutilizar `UpdateTaskInput` y no ofrecer desasignación hasta confirmar que el backend acepta `null` o un mecanismo explícito.
- Mantener `useAssignTask(groupId?: string)` para que `groupId` sea obligatorio antes del request y para invalidar exactamente el listado y el detalle del grupo afectado.
- Usar `group.members` como única fuente de opciones y resolución de nombres. El cliente debe verificar que la selección exista en esa colección antes de llamar al hook.
- Conservar la query del detalle como fuente de verdad: después del éxito, invalidar `queryKeys.tasks.detail(groupId, task.id)` y `queryKeys.tasks.list(groupId)` y dejar que `useTask` recupere el responsable desde el backend.
- Mantener la pantalla actual y su layout con `ThemedView`, `ThemedText`, `Spacing`, `useTheme`, `ScrollView` y `Pressable`; no crear una ruta ni un componente nuevo salvo que la implementación necesite extraer una pieza presentacional sin duplicar lógica.
- En toda la implementación de UI usar NativeWind (`className`) en lugar de `style` inline. Si una propiedad no puede expresarse con NativeWind y fuera imprescindible usar o agregar algo en un archivo, justificar la excepción en el código y en la revisión; no introducir excepciones preventivas.

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/features/tasks/types.ts` | modificar | Añadir `AssignTaskInput` con `assigneeId: string`; conservar `Task`, `TaskDetail` y `UpdateTaskInput` sin ampliar el alcance a edición o desasignación. Si OpenAPI confirma un response distinto, añadir solo el tipo mínimo necesario para representarlo. |
| `src/features/tasks/api.ts` | modificar | Añadir `assignTask(id, input)` o la firma equivalente acordada, que invoque `http.post` contra `/tasks/tasks/${id}/assign` con el body exacto validado. Propagar `HttpError` sin convertir errores HTTP en éxito; no migrar los mocks preexistentes de create/update/delete. |
| `src/features/tasks/queries.ts` | modificar | Importar `assignTask` y `AssignTaskInput`; añadir `useAssignTask(groupId?)`, rechazar `groupId` faltante antes del service y, en éxito, invalidar `queryKeys.tasks.list(groupId)` y `queryKeys.tasks.detail(groupId, task.id)`. Mantener intactas las firmas y callbacks de las mutaciones existentes. |
| `src/app/groups/[id]/tasks/[taskId].tsx` | modificar | Obtener `group` con `useGroup(groupId)`, resolver el nombre del assignee actual desde `group.members`, añadir selección de miembros y confirmación explícita junto a `Assignee`, y coordinar estados de carga, validación, éxito y error. Deshabilitar selección/submit durante la mutación, conservar la selección al fallar y preservar todas las rutas y acciones existentes. Aplicar NativeWind mediante `className` para la UI; cualquier uso o agregado imprescindible fuera de NativeWind debe quedar justificado en la implementación y revisión. |
| `src/features/groups/queries.ts` | revisar, sin cambio esperado | Reutilizar `useGroup(groupId)` y su contrato de miembros; no duplicar una query ni modificar la key de grupos. Solo cambiar si la implementación revela que hace falta exponer un estado requerido por la pantalla. |
| `src/lib/query-keys.ts` | revisar, sin cambio esperado | Confirmar que las keys canónicas existentes aceptan el `groupId` y `taskId` requeridos; no crear keys inline ni una key basada solo en `taskId`. |
| `src/services/http.ts` | revisar, sin cambio esperado | Confirmar que `http.post` serializa `{ assigneeId }` y conserva refresh `401`/`HttpError`; no alterar la política global de autenticación. |

## Descomposición en tareas

1. **T1 — Confirmar contrato del endpoint**: revisar OpenAPI o la documentación disponible para confirmar método, ruta, body (`assigneeId` frente a `userId`), respuesta (`Task`, `TaskDetail`, `void` o envelope) y soporte de `null`. Registrar la decisión en la implementación; si la respuesta no es una task completa, usar el tipo de respuesta real y depender de la invalidación para el detalle. No implementar desasignación sin soporte explícito. Archivos de referencia: `docs/specs/asignar-task.md`, `src/types/api-contracts.md`.
2. **T2 — Añadir tipos de asignación**: modificar `src/features/tasks/types.ts` con `AssignTaskInput` y el tipo de respuesta mínimo que resulte de T1. Mantener `assigneeId` del modelo de task como `string | null` y no reutilizar `UpdateTaskInput`. Requiere T1.
3. **T3 — Implementar el service HTTP**: modificar `src/features/tasks/api.ts` para añadir `assignTask` usando `http.post` y la ruta `/tasks/tasks/{id}/assign`; validar localmente solo entradas imposibles de enviar si ese patrón es consistente con el archivo y dejar que el cliente propague `HttpError`. No tocar los caminos mock de otras operaciones. Requiere T2. Conflicto: T4 importa el nuevo símbolo desde el mismo módulo; serializar T3 antes de T4.
4. **T4 — Añadir la mutación y la invalidación**: modificar `src/features/tasks/queries.ts` para exponer `useAssignTask(groupId?)`. La función de mutación debe rechazar `groupId` o identificadores requeridos ausentes antes de `assignTask`; `onSuccess` debe invalidar listado y detalle con el `groupId` del hook y el `id` de la task devuelta o del contexto de variables según el response confirmado. No actualizar optimistamente el cache como fuente única. Requiere T2 y T3. Conflicto: comparte archivo con create/update/delete; conservar sus contratos y serializar esta edición respecto de otra mutación.
5. **T5 — Integrar la query del grupo en el detalle**: modificar `src/app/groups/[id]/tasks/[taskId].tsx` para llamar `useGroup(groupId)`, esperar a tener task y miembros antes de habilitar la acción, y manejar loading/error de grupo sin romper el estado actual de la task ni `router.back()`. Requiere conocer el shape `GroupMember` verificado en `src/features/groups/types.ts` y `useGroup`.
6. **T6 — Implementar selección y submit accesibles**: en `src/app/groups/[id]/tasks/[taskId].tsx`, mantener estado local de `selectedAssigneeId`, mostrar cada `group.members` como control seleccionable con `accessibilityRole="radio"`, `accessibilityState.checked` y label con el nombre, reflejar el responsable actual, bloquear IDs no pertenecientes al grupo, y agregar un botón explícito con role/label de button. Deshabilitar opciones y botón mientras `useAssignTask` esté pendiente; mostrar estado sin miembros y no agregar una opción de desasignación. Expresar los estilos con NativeWind (`className`); justificar cualquier excepción imprescindible que NativeWind no pueda cubrir. Requiere T4 y T5. Conflicto: comparte toda la pantalla con las acciones existentes; no modificar sus pathnames, contratos ni condiciones salvo el bloqueo común durante la asignación.
7. **T7 — Resolver feedback de la mutación**: en la misma pantalla, mostrar éxito solo después de una respuesta exitosa y permitir que la invalidación actualice el detalle; mostrar errores de `403`, `404`, `400/422`, red y `5xx` sin tratar la operación como exitosa, conservar la selección para reintento y evitar doble tap. Reutilizar `HttpError` para status cuando sea posible y no implementar autenticación paralela. Mantener NativeWind para los estados visuales; si una excepción de estilo fuera imprescindible, documentar por qué no puede resolverse con `className`. Requiere T6.
8. **T8 — Verificación de integración**: ejecutar typecheck y lint; revisar request real/mockeado (método, URL, body), invalidaciones y navegación existente. Probar manualmente task asignada, sin asignar, varios miembros, grupo sin miembros, loading, doble tap, éxito, `403`, `404`, `422`, red/`5xx`, reintento, subtasks, marcar como hecha y eliminar. Requiere T7.

## Librerías / dependencias

- No agregar dependencias.
- Usar `npx expo install` solo si una dependencia nativa fuera exigida por una decisión futura; no aplica al alcance actual.
- No modificar `package.json`, `overrides.lightningcss`, `src/services/http.ts` ni la configuración global de TanStack Query salvo que la verificación encuentre un bloqueo concreto.

## Riesgos / dependencias / conflictos

- **Contrato backend pendiente**: la spec asume `{ assigneeId: string }` y una task como respuesta, pero T1 debe confirmar ambos puntos. Si hay envelope o `void`, adaptar el tipo y usar el `taskId` de las variables para invalidar el detalle; no inventar campos.
- **Carga de miembros**: `getGroupById` captura fallos al cargar miembros y puede devolver un grupo con `members: []`; la pantalla debe distinguir grupo cargado sin miembros de un error de grupo y evitar presentar opciones ficticias.
- **Nombre del responsable**: `GroupMember.name` puede ser el email o el ID cuando falta `userEmail`; mostrar ese valor y conservar el ID de `task.assigneeId` como fallback. No llamar otro endpoint.
- **Caché compartida**: `queries.ts` es compartido por todas las mutaciones de tasks. La nueva mutación no debe alterar invalidaciones ni tipos de create/update/delete, y el detalle debe seguir usando la key con grupo + task.
- **Estado local contra refetch**: la selección local sirve para la interacción y los errores; después del éxito, el detalle invalidado debe prevalecer. Evitar un estado optimista permanente que pueda contradecir al backend.
- **Interacción durante mutación**: la acción de asignación debe participar en el bloqueo de controles de la pantalla para evitar duplicados, pero no cambiar las rutas existentes. Coordinarlo con `updateTask.isPending` y `deleteTask.isPending` sin permitir que la navegación de subtasks quede accidentalmente alterada.
- **Estilos de UI**: la implementación debe usar NativeWind y no `style` inline. Si NativeWind no soporta una propiedad concreta requerida por la plataforma, la excepción debe limitarse a esa propiedad, quedar justificada en el archivo afectado y verificarse en la revisión; no ampliar el alcance para introducir otro sistema de estilos.
- **Paralelización**: T2 debe preceder T3; T3 debe preceder T4; T5 puede prepararse en paralelo con T3/T4 solo si no se edita todavía la misma sección de la pantalla. T6 y T7 son seriales y T8 es final. T4 y T6 tienen conflicto de archivo con cualquier otra tarea que toque `queries.ts` o la pantalla.

## Verificación

- `npm run typecheck`
- `npm run lint`
- Confirmar que el request sea `POST /tasks/tasks/{id}/assign` con el body exacto definido en T1 y que los errores HTTP sigan llegando como errores de mutación.
- Confirmar que `useAssignTask` rechace `groupId`/IDs faltantes o inválidos antes del request, que el éxito invalide `queryKeys.tasks.detail(groupId, task.id)` y `queryKeys.tasks.list(groupId)`, y que un error no invalide como éxito.
- Verificar manualmente que el detalle resuelva el nombre desde `group.members`, que una selección esté marcada como radio, que el botón tenga label/role accesibles, que loading deshabilite controles y que un grupo sin miembros no permita submit.
- Verificar que la UI nueva y sus estados visuales usen NativeWind (`className`) sin `style` inline; si existe una excepción imprescindible, confirmar que está limitada, justificada en el archivo afectado y registrada en la revisión.
- Verificar éxito: el responsable actualizado aparece después de la invalidación, la pantalla permanece en detalle y no se usa una actualización optimista como verdad final.
- Verificar errores `403`, `404`, `400/422`, red y `5xx`: mensaje claro, selección conservada y reintento posible cuando corresponda.
- Verificar regresión: `router.back()`, acceso a subtasks, `Mark done`, `Delete task` y sus rutas/contratos continúan funcionando sin cambios.

## Lista de tareas para el orquestador

- T1 — Confirmar contrato del endpoint (`docs/specs/asignar-task.md`, `src/types/api-contracts.md`).
- T2 — Añadir `AssignTaskInput` y respuesta de asignación (`src/features/tasks/types.ts`).
- T3 — Implementar `assignTask` (`src/features/tasks/api.ts`).
- T4 — Implementar `useAssignTask` e invalidaciones (`src/features/tasks/queries.ts`).
- T5 — Cargar grupo y miembros en detalle (`src/app/groups/[id]/tasks/[taskId].tsx`).
- T6 — Implementar selección y confirmación accesibles (`src/app/groups/[id]/tasks/[taskId].tsx`).
- T7 — Implementar estados de éxito, error, retry y bloqueo (`src/app/groups/[id]/tasks/[taskId].tsx`).
- T8 — Ejecutar typecheck, lint y pruebas manuales de regresión (archivos de la feature).
