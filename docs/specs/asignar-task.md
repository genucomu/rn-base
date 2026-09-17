# Asignar task

## Contexto / Problema

La app muestra el responsable actual de una task en `src/app/groups/[id]/tasks/[taskId].tsx`, pero no ofrece una acción para asignarla o reasignarla a un miembro del grupo. El backend expone el endpoint `POST /tasks/tasks/{id}/assign`, por lo que hace falta conectar esa operación con las capas de API y TanStack Query y exponerla desde el detalle de la task.

## Objetivos

- Permitir asignar o reasignar una task a un miembro del grupo desde su pantalla de detalle.
- Consumir `POST /tasks/tasks/{id}/assign` mediante `src/services/http.ts`.
- Mantener actualizados el detalle y el listado de tasks después de una asignación exitosa.
- Mostrar estados claros de selección, carga, éxito y error sin romper la navegación existente.

## No-objetivos

- No cambiar la creación, edición, eliminación ni el estado de las tasks.
- No agregar una pantalla nueva ni modificar tabs o rutas existentes.
- No crear un endpoint de administración de miembros ni modificar la pertenencia al grupo.
- No implementar asignación masiva, historial de asignaciones, notificaciones o permisos nuevos.
- No resolver nombres de usuarios mediante un endpoint adicional: se reutilizan los miembros que ya entrega `useGroup`.

## Supuestos

- El identificador de la task es el `taskId` de la ruta `/groups/[id]/tasks/[taskId]` y se envía como parámetro de ruta en `/tasks/tasks/{id}/assign`.
- El body esperado por el backend es `{ assigneeId: string }`, donde `assigneeId` corresponde a `GroupMember.id` (`userId` remoto). La confirmación del DTO OpenAPI queda como pregunta abierta.
- El endpoint devuelve la task actualizada con el shape de `Task`, incluyendo `id`, `groupId` y `assigneeId`. Si devuelve `void` o un envelope, el plan técnico deberá adaptar el tipo sin cambiar el flujo de usuario.
- La operación de asignación requiere un miembro válido del grupo. La posibilidad de desasignar mediante `assigneeId: null` no se asume hasta confirmar el contrato; la UI debe mantener el texto `Sin asignar` para el estado actual.
- `useGroup(groupId)` ya carga `Group.members` desde `GET /tasks/groups/{id}/members`, y cada miembro tiene `id`, `name` y `role`.
- La autorización, pertenencia al grupo y validación de UUID son responsabilidad del backend; el cliente debe evitar enviar una selección inexistente en la lista cargada.

## Requerimientos funcionales

- [ ] **RF-1: Servicio de asignación** — Agregar en `src/features/tasks/api.ts` una operación `assignTask(id, assigneeId)` que invoque `http.post<Task>(\`/tasks/tasks/${id}/assign\`, { assigneeId })` y propague los errores del cliente HTTP.
- [ ] **RF-2: Tipo de entrada** — Definir un tipo específico para la operación, por ejemplo `AssignTaskInput` con `assigneeId: string`, sin reutilizar `UpdateTaskInput` para ocultar que usa un endpoint distinto.
- [ ] **RF-3: Mutación de TanStack Query** — Agregar `useAssignTask(groupId?)` en `src/features/tasks/queries.ts`. La mutación debe rechazar parámetros faltantes antes de llamar al service y, al tener éxito, invalidar `queryKeys.tasks.detail(groupId, task.id)` y `queryKeys.tasks.list(groupId)`.
- [ ] **RF-4: Selección de responsable** — En `src/app/groups/[id]/tasks/[taskId].tsx`, mostrar los miembros disponibles de `group.members` como opciones seleccionables y reflejar cuál coincide con `task.assigneeId`.
- [ ] **RF-5: Ejecución explícita** — La UI debe permitir elegir un miembro y confirmar la asignación mediante una acción identificable. No debe ejecutar el POST solo por renderizar o cambiar de navegación.
- [ ] **RF-6: Actualización visual** — Tras una respuesta exitosa, mostrar el nuevo responsable y dejar que la invalidación recupere el detalle actualizado desde el backend. No usar actualización optimista como fuente única de verdad.
- [ ] **RF-7: Navegación preservada** — Mantener `router.back()`, el acceso a subtasks, marcar como hecha y eliminar sin cambiar sus rutas ni contratos.

## Requerimientos no funcionales

- Mantener la separación existente: service para HTTP, hook para TanStack Query y pantalla/componentes para presentación.
- Reutilizar `src/services/http.ts` para token injection, refresh automático ante `401` y `HttpError`.
- Reutilizar `ThemedView`, `ThemedText`, `useTheme`, `Spacing` y los patrones de accesibilidad de la pantalla de detalle.
- La acción debe funcionar con scroll y en web y plataformas nativas, sin depender de un ancho fijo.
- Las opciones deben tener `accessibilityRole="radio"` o un control equivalente, `accessibilityState.checked` y labels que incluyan el nombre del miembro.
- El botón de confirmar debe tener `accessibilityRole="button"`, label descriptivo y quedar deshabilitado durante la mutación.
- Mantener compatibilidad con TypeScript estricto, alias `@/*` y Biome; no agregar dependencias.

## Datos / API

### Endpoint

```text
POST /tasks/tasks/{id}/assign
```

### Resultado de T1: verificación de contrato

- **Método y ruta:** confirmados por el plan de implementación, esta spec y la referencia de la API de tasks. El identificador `{id}` es el `taskId` de la ruta de detalle.
- **Body:** OpenAPI confirma `{ assigneeId: string }`. `assigneeId` coincide con `GroupMember.id`, que el cliente deriva de `userId` en `GET /tasks/groups/{id}/members`.
- **Respuesta:** OpenAPI confirma JSON directo `TaskResponseDto`, equivalente al `TaskDetail` completo del cliente, incluyendo tipo, importes, responsable y subtasks.
- **Desasignación:** no hay evidencia de que `assigneeId: null` sea válido ni de una operación separada; queda fuera de alcance.
- **Disponibilidad de OpenAPI:** contrato verificado en `http://localhost:3000/api/docs-json`.

Body asumido:

```json
{
  "assigneeId": "user-id"
}
```

Respuesta confirmada: `TaskResponseDto`, representada por `TaskDetail` en el cliente, sin envelope.

### Integración existente

- Task detail: `src/app/groups/[id]/tasks/[taskId].tsx`.
- Task API: `src/features/tasks/api.ts`, donde ya existen `getTask`, `createTask`, `updateTask` y `deleteTask`.
- Query hooks: `src/features/tasks/queries.ts`, con `useTask`, `useTasks` y las mutaciones existentes.
- Tipos: `src/features/tasks/types.ts`, donde `Task.assigneeId` y `TaskDetail.assigneeId` son `string | null`.
- Grupo y miembros: `src/features/groups/api.ts` y `src/features/groups/types.ts`; `useGroup(groupId)` obtiene `Group.members`.
- Cache: `src/lib/query-keys.ts`, especialmente `queryKeys.tasks.list(groupId)` y `queryKeys.tasks.detail(groupId, taskId)`.
- Cliente HTTP: `src/services/http.ts`.

## UI / Navegación

### Ubicación

La interacción se agrega a la sección `Task information` de `src/app/groups/[id]/tasks/[taskId].tsx`, junto al valor actual de `Assignee`. La pantalla ya dispone de `groupId`, `taskId`, `useTask` y `useGroup` como contexto para la operación.

### Flujo esperado

1. La pantalla carga el detalle de la task y el grupo; mientras faltan datos no permite asignar.
2. La sección muestra el responsable actual por nombre cuando existe en `group.members`; si no se puede resolver, conserva el identificador o `Sin asignar`.
3. El usuario selecciona un miembro válido del grupo.
4. El usuario presiona la acción de asignar/reasignar.
5. El botón muestra estado pendiente y bloquea opciones para evitar requests duplicados.
6. En éxito, se invalidan detalle y listado, se muestra el nuevo responsable y se conserva la pantalla de detalle.

La UI debe contemplar un estado sin miembros disponibles. La opción de seleccionar `Sin asignar` solo se implementa si el contrato confirma que el endpoint acepta `assigneeId: null` o un mecanismo explícito de desasignación.

## Manejo de errores y edge cases

- `groupId` o `taskId` ausente: no ejecutar la mutación y conservar el estado de parámetros inválidos de la pantalla.
- `assigneeId` vacío, inválido o no perteneciente a `group.members`: bloquear el submit y mostrar validación local.
- Loading del detalle o grupo: mostrar loading existente y no exponer una acción accionable con datos incompletos.
- `401`: delegar en el refresh/logout existente de `http`; no implementar autenticación paralela.
- `403`: informar que el usuario no tiene permisos para asignar la task y conservar el detalle sin asumir éxito.
- `404`: informar que la task o el miembro ya no existe; permitir volver o reintentar la carga según el estado actual.
- `400`/`422`: mostrar el mensaje del backend si es seguro y permitir corregir la selección.
- Error de red o `5xx`: mantener la selección, mostrar error y permitir reintentar sin duplicar la mutación.
- Doble tap o navegación durante la petición: deshabilitar la acción mientras `isPending` sea verdadero.
- La task se actualiza por otro cliente entre la carga y el submit: la respuesta del backend y la invalidación deben prevalecer sobre el estado local.

## Estrategia de testing

- `npm run typecheck` para validar el input, la respuesta, el hook y las query keys.
- `npm run lint` para validar formato y reglas de Biome.
- Prueba del service o mock HTTP, si existe infraestructura: verificar método, URL, body exacto y propagación de errores.
- Prueba del hook, si existe infraestructura: verificar que una asignación exitosa invalida detalle y listado del grupo, y que un error no los invalida como éxito.
- Verificación manual con grupo con varios miembros: seleccionar cada miembro, confirmar, revisar request y comprobar el responsable actualizado.
- Verificación manual de task ya asignada, task sin responsable y grupo sin miembros disponibles.
- Verificación manual de loading, doble tap, error `403`, `404`, `422`, error de red y regreso a la pantalla anterior.
- Verificar que subtasks, marcar como hecha y eliminar continúan navegando y funcionando sin cambios.

## Preguntas abiertas

- ¿El endpoint permite desasignar con `assigneeId: null` o existe una operación separada?
- ¿La asignación requiere confirmación adicional o permisos específicos además de pertenecer al grupo?
- ¿La UI debe mostrar email, nombre visible o avatar del miembro cuando el backend solo entrega `userEmail`?

## Criterios de aceptación

- [ ] Existe una operación de service para `POST /tasks/tasks/{id}/assign` que envía el identificador del miembro y usa `src/services/http.ts`.
- [ ] Existe una mutación `useAssignTask` basada en TanStack Query, con validación de parámetros e invalidación del detalle y listado afectados tras éxito.
- [ ] La pantalla `src/app/groups/[id]/tasks/[taskId].tsx` permite seleccionar un miembro de `group.members` y ejecutar explícitamente la asignación.
- [ ] La selección y el botón tienen estados de accesibilidad, loading y disabled que evitan requests duplicados.
- [ ] Una asignación exitosa muestra el responsable actualizado sin sacar al usuario del detalle de la task.
- [ ] Los errores de autenticación, permisos, validación, inexistencia, red y servidor se muestran sin tratar la operación como exitosa y permiten reintento cuando corresponde.
- [ ] La opción de desasignar no se implementa hasta confirmar el contrato backend; el estado actual sin responsable sigue siendo legible.
- [ ] Se conservan las rutas y acciones existentes de detalle, subtasks, marcar como hecha y eliminar.
- [ ] `npm run typecheck` y `npm run lint` pasan después de la implementación.
- [x] El contrato de body y respuesta fue validado contra OpenAPI: `{ assigneeId: string }` y `TaskResponseDto` completo.