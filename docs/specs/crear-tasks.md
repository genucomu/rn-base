# Crear tasks

## Contexto / Problema

El flujo actual permite entrar al listado de tareas desde el detalle de un grupo y tiene un botón `+ Create task`, pero ese botón crea una tarea con datos hardcodeados y no ofrece un formulario para que el usuario defina sus datos. La pantalla tampoco permite informar `typeId` ni `priceCents`, que forman parte del body requerido para crear una task.

La feature debe convertir ese punto de entrada en una experiencia real de creación, mantener la task vinculada al grupo de la ruta y conectar la UI con la mutación existente. También debe alinear los contratos del dominio y la capa de service con el payload remoto cuando el contrato actual no alcance.

## Objetivos

- Permitir crear una task desde el flujo de un grupo mediante un formulario usable en Android, iOS y web.
- Enviar a la API el body `{ groupId, typeId, title, description, priceCents, assigneeId }` con UUIDs y tipos correctos.
- Reutilizar `useCreateTask(groupId)`, TanStack Query y `src/services/http.ts`.
- Actualizar los tipos de task y la implementación del service solo donde sea necesario para representar el contrato de creación y su respuesta.
- Mostrar estados de validación, envío exitoso, carga y error sin perder los datos ingresados innecesariamente.

## No-objetivos

- No implementar edición, eliminación, detalle adicional ni cambios de estado de tasks.
- No modificar el flujo de grupos, miembros, subtasks ni la navegación principal de tabs.
- No agregar prioridades, fechas de vencimiento, comentarios, adjuntos o etiquetas al formulario si no forman parte del body solicitado.
- No introducir un store global para los valores del formulario; el estado es local a la pantalla/componente.
- No agregar una nueva librería de formularios o validación sin una necesidad demostrada por el código existente.

## Supuestos

- El grupo se identifica por el parámetro `id` de `src/app/groups/[id]/tasks.tsx`; `groupId` se toma de la ruta y no se edita en el formulario.
- El endpoint de creación es `POST /tasks/tasks`, consistente con `createTask` y `listTasks` actuales.
- La API recibe un objeto JSON sin envelope y devuelve la task creada completa, como establece `src/types/api-contracts.md`.
- `title`, `description`, `typeId` y `priceCents` son campos requeridos por el body indicado; `assigneeId` admite `null` para crear una task sin responsable.
- `typeId` es un UUID válido seleccionado desde el catálogo que expone `GET /tasks/task-types`; la UI no permite ingresar un UUID manual.
- La respuesta de creación incluye al menos `id`, `groupId`, `typeId`, `title`, `description`, `priceCents`, `assigneeId`, estado y timestamps, o el contrato se ajustará con evidencia del backend.
- Los miembros del grupo disponibles en `Group.members` son la fuente natural para elegir un responsable, pero el contrato actual solo expone `id`, `name` y `role` y no existe un selector reutilizable.

## Requerimientos funcionales

- [ ] RF-1: Desde el listado de tasks de un grupo, el usuario puede abrir el formulario de creación mediante el control que hoy muestra `+ Create task`.
- [ ] RF-2: El formulario debe mostrar campos para título, descripción, tipo, precio en centavos y responsable; el grupo se muestra como contexto no editable o queda implícito por la pantalla actual.
- [ ] RF-3: El título no puede enviarse vacío después de quitar espacios. La descripción debe conservar el texto ingresado y validar la obligatoriedad definida por el contrato remoto.
- [ ] RF-4: `typeId` debe validarse como UUID antes del envío, o seleccionarse desde un catálogo de task types cuando el backend provea ese recurso. No se debe enviar un valor de presentación como nombre o label en lugar del UUID.
- [ ] RF-5: `priceCents` debe aceptar únicamente un número entero mayor o igual a cero; la UI debe evitar enviar una representación monetaria con decimales o símbolos.
- [ ] RF-6: El responsable debe incluir la opción explícita de “sin asignar” y enviarse como `assigneeId: null`; cuando se elija una persona, debe enviarse su UUID.
- [ ] RF-7: Al confirmar, la pantalla debe ejecutar `useCreateTask(groupId).mutate` con el input tipado y no construir una task localmente.
- [ ] RF-8: Mientras la mutación está pendiente, el botón de confirmación queda deshabilitado y muestra un indicador de progreso; se evita el doble envío.
- [ ] RF-9: Tras una respuesta exitosa, el listado del grupo se invalida mediante la lógica existente de `useCreateTask`, el formulario se cierra o vuelve al listado y los campos se limpian solo después del éxito.
- [ ] RF-10: Tras un error de validación o red, el formulario permanece visible, conserva los valores ingresados y muestra un mensaje comprensible junto al formulario o al campo afectado.
- [ ] RF-11: La navegación de regreso desde el formulario retorna al listado de tasks del mismo grupo sin descartar accidentalmente una mutación en curso.

## Requerimientos no funcionales

- Mantener la separación por capas: la ruta o componente coordina UI y hooks; el hook coordina TanStack Query; el service solo hace la llamada HTTP; los tipos viven en `src/features/tasks/types.ts`.
- Reutilizar `src/services/http.ts` para serialización JSON, token y refresh automático ante `401`.
- Mantener compatibilidad con TypeScript estricto, alias `@/*`, Expo SDK 57, NativeWind v5 y las convenciones de Biome.
- Usar `TextInput` y controles nativos existentes, siguiendo el patrón de estado local visible en login y subtasks; no introducir infraestructura de formularios nueva.
- Todos los campos interactivos deben tener labels o `accessibilityLabel`, roles adecuados y estados de disabled/loading perceptibles.
- La pantalla debe funcionar con teclado virtual: inputs numéricos usan teclado numérico, descripción permite varias líneas y el contenido puede desplazarse para alcanzar el botón.

## Datos / API

### Input de creación

El contrato de entrada debe representar como mínimo:

```ts
interface CreateTaskInput {
  typeId: string;
  title: string;
  description: string;
  priceCents: number;
  assigneeId: string | null;
}
```

`groupId` se recibe como argumento de `createTask(groupId, input)` y se agrega al body del request:

```json
{
  "groupId": "00000000-0000-0000-0000-000000000000",
  "typeId": "00000000-0000-0000-0000-000000000000",
  "title": "Preparar propuesta",
  "description": "Revisar alcance y enviar la propuesta al cliente",
  "priceCents": 250000,
  "assigneeId": null
}
```

### Endpoint y service

- `src/features/tasks/api.ts`: conservar la firma `createTask(groupId, input): Promise<Task>` y enviar `POST /tasks/tasks` con el body completo. La validación local no debe eliminar `assigneeId: null` ni convertir `priceCents` a string.
- `src/features/tasks/queries.ts`: conservar `useCreateTask(groupId)`, su guard para `groupId` ausente y la invalidación de `queryKeys.tasks.list(task.groupId)` tras éxito.
- `src/features/tasks/types.ts`: agregar `typeId` y `priceCents` al modelo `Task` y al input si la respuesta OpenAPI confirma esos campos. Alinear `description` y `assigneeId` con nullabilidad real; no conservar opcionalidad solo por el stub local.
- `src/lib/query-keys.ts`: reutilizar el namespace `queryKeys.tasks` ya existente; no crear keys inline nuevas.
- `src/types/api.ts`: modificarlo únicamente si el contrato canónico de API centraliza allí las tareas; actualmente la implementación de tasks usa `src/features/tasks/types.ts`.

### Datos auxiliares

- Para `assigneeId`, usar los miembros del grupo ya cargados por `useGroup` si la pantalla mantiene ese dato disponible. Si el diseño final requiere una consulta separada, debe reutilizar un service/hook existente o documentar el endpoint necesario.
- Para `typeId`, usar `GET /tasks/task-types` mediante el service y query del módulo de tasks. No inventar una lista local de UUIDs; el formulario queda bloqueado si el catálogo no carga o está vacío.

## UI / Navegación

### Flujo existente

1. `src/app/groups/[id].tsx` muestra el grupo y navega a `/groups/[id]/tasks`.
2. `src/app/groups/[id]/tasks.tsx` obtiene `groupId` desde `useLocalSearchParams`, lista con `useTasks(groupId)` y hoy dispara una creación hardcodeada.
3. La creación debe reemplazar ese disparo directo por un formulario. Se recomienda una ruta hija `src/app/groups/[id]/tasks/new.tsx` para separar el formulario del listado; alternativamente puede ser un formulario inline si conserva el mismo flujo y no duplica la lógica.
4. Después del éxito, volver a `/groups/[id]/tasks` y mostrar la task creada en el listado luego de la invalidación.

### Componentes y estados

- Reutilizar `ThemedView`, `ThemedText`, `TextInput`, `Pressable` o `Button` de `src/components/ui/button.tsx`, manteniendo el lenguaje visual existente.
- Estado inicial: formulario vacío, con `assigneeId` en `null` y precio sin valor o en cero según la decisión de negocio documentada.
- Estado de edición: cada campo refleja su valor y los errores se limpian o actualizan al modificarlo.
- Estado de envío: controles bloqueados, indicador visible y sin navegación prematura.
- Estado de éxito: regreso al listado y refetch/invalidation gestionado por el hook.
- Estado de error: mensaje de API o mensaje genérico de red, sin perder el contenido del formulario.
- Estado de grupo inválido o ausente: no renderizar un formulario enviable; mostrar error y permitir regresar.

## Manejo de errores y edge cases

- `groupId` ausente: mantener el guard del hook/service y no ejecutar el request.
- `title`, `description` o `typeId` vacíos: bloquear envío y mostrar validación de campo.
- UUID inválido en `groupId`, `typeId` o `assigneeId`: bloquearlo en cliente cuando sea verificable; nunca enviar labels o strings vacíos como UUID.
- `priceCents` negativo, decimal, vacío o fuera del rango seguro de JavaScript: bloquearlo y mostrar una validación clara.
- Responsable sin asignar: enviar `null`, no omitir la propiedad si el DTO distingue entre ausencia y valor nulo.
- `400`/`422`: mostrar el mensaje de validación del backend cuando exista y mantener el formulario editable.
- `401`: dejar que `http` aplique refresh; si la sesión no puede renovarse, mostrar el error de autenticación sin repetir automáticamente la creación.
- `5xx`, timeout o ausencia de red: mostrar error recuperable y permitir reintentar sin duplicar una creación confirmada.
- Respuesta exitosa sin `groupId` o sin los campos mínimos: tratarla como contrato inválido y no invalidar una key global ambigua.
- El listado vacío debe conservar un empty state con una acción visible para abrir el formulario.

## Estrategia de testing

- `npm run typecheck` para verificar `CreateTaskInput`, `Task`, la mutación y el payload numérico/null.
- `npm run lint` para validar las convenciones de Biome.
- Si existe infraestructura de tests, probar que el service envía exactamente `POST /tasks/tasks` con `groupId`, `typeId`, `title`, `description`, `priceCents` y `assigneeId: null` cuando corresponde.
- Probar la validación del formulario para título/descripción vacíos, UUID inválido, precio negativo o decimal y responsable sin asignar.
- Probar que el submit exitoso llama una sola vez a la mutación, deshabilita controles mientras está pendiente y vuelve al listado después de éxito.
- Probar que un error conserva los valores ingresados y no navega ni limpia el formulario.
- Verificación manual en web y al menos una plataforma nativa: abrir desde detalle de grupo, completar todos los campos, crear con y sin responsable, confirmar el listado actualizado y revisar el caso de error de API.

## Preguntas abiertas

- El shape asumido para `GET /tasks/task-types` es un array directo de `{ id, name }`; debe confirmarse contra el backend cuando esté disponible.
- ¿`description` es obligatoria en el DTO remoto o puede ser una cadena vacía?
- ¿El precio inicial vacío debe representar `0` o debe impedir el submit hasta que el usuario ingrese un valor?
- ¿El backend devuelve `description` y `assigneeId` como valores siempre presentes, `null`, u opcionales?
- ¿La API devuelve `Task` con `typeId` y `priceCents`, o esos campos pertenecen a otra entidad relacionada?
- ¿La selección de responsable debe limitarse a `Group.members` o debe consultar usuarios del tenant por separado?
- ¿Se prefiere ruta dedicada `tasks/new` o formulario inline en el listado? La spec recomienda ruta dedicada por claridad de navegación y estados.

## Criterios de aceptación

- [ ] Desde el detalle de un grupo se llega al listado y desde allí se puede abrir un formulario real de creación, sin creación hardcodeada.
- [ ] El formulario contiene título, descripción, typeId, priceCents y responsable, con opción explícita de dejar `assigneeId` en `null`.
- [ ] El envío valida campos obligatorios, UUIDs y precio entero no negativo antes de invocar la mutación.
- [ ] `CreateTaskInput` y `Task` representan los campos `typeId` y `priceCents`, y la nullabilidad de `description`/`assigneeId` queda alineada con el contrato remoto validado.
- [ ] `createTask` envía `POST /tasks/tasks` mediante `src/services/http.ts` con `groupId` y el body exacto, conservando `assigneeId: null`.
- [ ] `useCreateTask(groupId)` se reutiliza; una creación exitosa invalida el listado del grupo y una fallida no navega ni limpia el formulario.
- [ ] El botón de submit muestra carga, evita doble envío y todos los errores dejan el formulario recuperable.
- [ ] La UI funciona con teclado y tiene labels/accesibilidad para sus controles principales.
- [ ] `npm run typecheck` y `npm run lint` pasan tras la implementación.
- [ ] No se modifican tabs, autenticación ni el cliente HTTP global, y esta solicitud solo agrega/modifica la spec durante esta etapa.