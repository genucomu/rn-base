# Detalle de tarea

## Contexto / Problema

La pantalla `src/app/groups/[id]/tasks/[taskId].tsx` ya existe, pero actualmente muestra un modelo local/mock obtenido por `useTask(groupId, taskId)`. Ese modelo no representa el contrato real del detalle de una task: faltan datos de tipo, importe total y relación de subtareas, y algunos campos actualmente mostrados (`priority`, `dueDate`, `completedAt`) no forman parte de la respuesta requerida.

Se necesita implementar la UI de detalle consumiendo `GET /tasks/tasks/{id}`, manteniendo la navegación existente dentro del grupo y presentando la información de la tarea y sus subtareas de forma clara.

## Objetivos

- Mostrar el detalle de una task a partir del contrato real de `GET /tasks/tasks/{id}`.
- Presentar identidad, tipo, estado, descripción, responsable, importes y timestamps de la task.
- Mostrar la colección de subtasks incluida en la respuesta, con sus datos relevantes.
- Mantener la entrada actual desde `/groups/[id]/tasks/[taskId]` y el regreso a la pantalla anterior.
- Definir estados de loading, error, respuesta vacía o inconsistente y reintento.

## No-objetivos

- No crear ni modificar endpoints de creación, edición o eliminación de tasks.
- No rediseñar el listado de tasks del grupo ni la navegación de tabs.
- No implementar en esta feature nuevas acciones sobre subtasks.
- No agregar filtros, paginación, comentarios, adjuntos o historial de cambios.
- No asumir que los campos no presentes en el contrato (`priority`, `dueDate`, `completedAt`) deben seguir mostrándose.

## Supuestos

- `id` es el identificador global de la task y el endpoint se consulta como `GET /tasks/tasks/{id}`; `groupId` se usa para el contexto de navegación y no se envía como query param salvo que el contrato final lo requiera.
- `useTask(groupId, taskId)` seguirá siendo el punto de entrada de la pantalla, pero deberá delegar en el service real y tipar la respuesta del endpoint. La query key existente `queryKeys.tasks.detail(groupId, id)` se conserva salvo que el plan técnico determine una separación explícita por contrato.
- La respuesta contiene una task con estos campos: `id`, `groupId`, `typeId`, `typeCode`, `typeName`, `parentTaskId`, `title`, `description`, `priceCents`, `amountCents`, `assigneeId`, `status`, `subtasks`, `createdAt` y `updatedAt`.
- Cada elemento de `subtasks` tiene campos similares a una task y puede incluir, como mínimo, `id`, `parentTaskId`, `title`, `description`, importes, responsable, estado y timestamps. El contrato definitivo debe confirmar si `typeCode`, `typeName` y `subtasks` son opcionales o siempre presentes.
- `priceCents` y `amountCents` están expresados en centavos y deben mostrarse como importes monetarios, sin exponer el valor crudo en centavos.
- Las fechas son timestamps ISO 8601 y se mostrarán en formato local legible, conservando una alternativa accesible o completa cuando sea necesario.
- Las acciones que ya aparecen en la pantalla (`Manage subtasks`, `Mark done`, `Delete task`) se consideran existentes y no forman parte del alcance de esta implementación visual. No deben eliminarse ni cambiar su contrato sin una decisión específica del plan; su estado de loading/error queda sujeto a las mutaciones actuales.
- La ruta de subtasks existente `/groups/[id]/tasks/[taskId]/subtasks` continúa siendo el destino para gestionar subtasks; el detalle puede mostrar la lista embebida sin reemplazar esa pantalla.
- Si `description` o `assigneeId` fueran nulos en respuestas reales, la UI debe mostrar un estado neutro (`Sin descripción` / `Sin asignar`) en lugar de romper el render.

## Requerimientos funcionales

- [ ] RF-1: Al abrir `/groups/[id]/tasks/[taskId]`, la pantalla debe solicitar el detalle de la task mediante `useTask(groupId, taskId)` y el endpoint `GET /tasks/tasks/{id}`.
- [ ] RF-2: El encabezado debe mostrar `title`, `status` y la identificación del tipo mediante `typeName`; cuando corresponda, también debe poder mostrar `typeCode` sin confundirlo con el título.
- [ ] RF-3: El detalle debe mostrar `description`, `assigneeId`, `parentTaskId` cuando exista, y los importes `priceCents` y `amountCents` con formato monetario.
- [ ] RF-4: El detalle debe mostrar `createdAt` y `updatedAt` con formato de fecha/hora consistente con la app y suficientemente claro para distinguir creación de última actualización.
- [ ] RF-5: La pantalla debe mostrar la colección `subtasks` en una sección identificable, incluyendo al menos título, estado, responsable e importe cuando estén disponibles, además de una indicación clara cuando no haya subtasks.
- [ ] RF-6: La navegación hacia atrás debe conservar el comportamiento actual (`router.back()`).
- [ ] RF-7: El acceso a gestionar subtasks debe continuar navegando a `/groups/[id]/tasks/[taskId]/subtasks` con `id` y `taskId` correctos.
- [ ] RF-8: La pantalla debe conservar las acciones existentes de marcar como hecha y eliminar, sin redefinir sus endpoints ni agregar nuevas acciones en esta feature.
- [ ] RF-9: La UI debe distinguir loading inicial, error de consulta, task inexistente y datos cargados.

## Requerimientos no funcionales

- Usar el cliente HTTP y TanStack Query existentes; la pantalla no debe ejecutar `fetch` directamente.
- Mantener la separación de capas: service para HTTP, tipos para el DTO, query para acceso/cache y pantalla/componentes para presentación.
- Reutilizar `ThemedView`, `ThemedText`, `useTheme` y las convenciones visuales actuales de la app.
- La pantalla debe poder recorrerse con scroll en dispositivos pequeños y no depender de un ancho fijo.
- Los importes y fechas deben ser legibles y consistentes entre web y plataformas nativas.
- Los estados de carga y error deben ofrecer feedback visible sin dejar acciones ambiguas habilitadas.

## Datos / API

### Endpoint

`GET /tasks/tasks/{id}`

### Task de detalle

- `id: string`
- `groupId: string`
- `typeId: string`
- `typeCode: string`
- `typeName: string`
- `parentTaskId: string | null`
- `title: string`
- `description: string | null`
- `priceCents: number`
- `amountCents: number`
- `assigneeId: string | null`
- `status: string` (los valores válidos deben alinearse con el contrato de API)
- `subtasks: Task[]` o DTO equivalente con campos similares
- `createdAt: string`
- `updatedAt: string`

### Integración existente

- Ruta: `src/app/groups/[id]/tasks/[taskId].tsx`.
- Query actual: `useTask(groupId, taskId)` en `src/features/tasks/queries.ts`.
- API actual: `getTask(groupId, id)` en `src/features/tasks/api.ts`, que hoy usa una colección local/mock y debe pasar a consumir el endpoint real.
- Cache: `queryKeys.tasks.detail(groupId, id)` en `src/lib/query-keys.ts`.
- Cliente HTTP: `src/services/http.ts`, reutilizando autenticación y manejo de errores existentes.

## UI / Navegación

### Estructura de la pantalla

- Mantener la ruta y el contenedor seguro actuales.
- Mostrar una acción de regreso al inicio del contenido.
- Encabezado: título, estado y tipo (`typeName`, con `typeCode` como dato secundario si está disponible).
- Sección de descripción: texto completo o estado neutro cuando no exista.
- Sección de información: responsable, task padre, precio y monto total.
- Sección de fechas: creación y última actualización.
- Sección de subtasks: lista embebida, estado vacío explícito y acceso a `Manage subtasks`.
- Mantener las acciones existentes al final de la pantalla y no presentarlas como disponibles durante un error o antes de tener una task válida.

### Formato de importes

- Convertir centavos a unidades monetarias dividiendo por 100.
- Usar el locale monetario definido por la aplicación o, si todavía no existe una convención global, `es-AR` y la moneda definida por producto/API.
- Mostrar `priceCents` y `amountCents` con etiqueta explícita para evitar confundir precio unitario y monto total.
- Definir el comportamiento para cero y valores ausentes: cero se muestra como importe válido; ausencia se muestra como `Sin datos`.

### Formato de fechas

- Parsear timestamps ISO 8601 y mostrar fecha y hora local en un formato consistente, por ejemplo `dd/MM/yyyy HH:mm`.
- Si el timestamp es inválido, mostrar `Sin datos` y no hacer fallar la pantalla.

## Manejo de errores y edge cases

- Loading inicial: mostrar un indicador o placeholder estable mientras se ejecuta la query.
- Error de red o servidor: mostrar un mensaje contextual y un control para reintentar la consulta si el patrón existente de la app lo permite.
- 404 o task inexistente: mostrar `Task no encontrada` y conservar la posibilidad de volver atrás; no renderizar acciones destructivas.
- `taskId` o `groupId` ausente: no ejecutar la query y mostrar un estado de parámetros inválidos o redirigir hacia atrás según el patrón de rutas existente.
- `subtasks` vacío: mostrar un estado vacío sin tratarlo como error y conservar el acceso a gestionar subtasks.
- Subtask con datos incompletos: renderizar los campos disponibles y aplicar los mismos valores neutros que para la task principal.
- Importe negativo, fecha inválida o estado desconocido: no romper el render; mostrar el valor de forma segura y dejar registrado en el plan técnico si debe normalizarse o marcarse visualmente.
- La respuesta no debe duplicar subtasks ni mezclarlas con la task padre por errores de mapeo; `parentTaskId` debe conservarse como relación, no usarse para ocultar datos.

## Estrategia de testing

- `npm run typecheck` para verificar el DTO, service, query y pantalla.
- `npm run lint` para validar formato y reglas de Biome.
- Prueba manual con respuesta completa: datos de tipo, ambos importes, fechas y varias subtasks.
- Prueba manual con subtasks vacías, descripción o responsable ausentes y valores monetarios cero.
- Prueba manual de loading, error de red, 404 y reintento.
- Verificar navegación atrás y navegación a la pantalla de gestión de subtasks.
- Verificar que las acciones existentes de marcar como hecha y eliminar sigan funcionando sin cambios de contrato.

## Preguntas abiertas

- ¿Cuál es la moneda oficial del producto para formatear `priceCents` y `amountCents`?
- ¿Los estados de task y subtask tienen exactamente los valores actuales (`todo`, `in_progress`, `done`, `blocked`) o el endpoint admite otros?
- ¿`amountCents` es un total calculado por la API, un monto editable o una suma de subtasks?
- ¿`assigneeId` debe resolverse a nombre/avatar mediante otro endpoint o se muestra únicamente el identificador en esta iteración?
- ¿El detalle debe mostrar `parentTaskId` como enlace navegable a otra task o solo como metadata?
- ¿Las acciones existentes de marcar como hecha, eliminar y gestionar subtasks se mantienen visibles en todos los estados de task?

## Criterios de aceptación

- [ ] `docs/specs/detalle-tarea.md` define la implementación de la UI de detalle sin modificar código de aplicación.
- [ ] La pantalla objetivo queda anclada a `src/app/groups/[id]/tasks/[taskId].tsx`, `src/features/tasks/api.ts` y `src/features/tasks/queries.ts`.
- [ ] La especificación exige consumir `GET /tasks/tasks/{id}` y documenta todos los campos principales de la respuesta, incluidos `typeCode`, `typeName`, `parentTaskId`, `amountCents` y `subtasks`.
- [ ] La UI define la presentación de título, tipo, estado, descripción, responsable, relación padre, importes y timestamps.
- [ ] La UI define una sección de subtasks, su estado vacío y la continuidad hacia la ruta existente de gestión.
- [ ] Se especifican loading, error, 404, parámetros faltantes, reintento y respuestas parciales sin romper el render.
- [ ] Se especifican reglas de formato para importes en centavos y fechas ISO 8601.
- [ ] La navegación de regreso y las acciones existentes quedan explicitadas como comportamiento a preservar, sin ampliar su alcance.
- [ ] La estrategia de testing incluye typecheck, lint y validación manual de estados y navegación.
- [ ] La spec queda lista para pasar a la etapa de plan técnico.
