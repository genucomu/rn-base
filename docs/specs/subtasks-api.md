# API de subtareas

## Contexto / Problema

Las tareas a menudo requieren una descomposición de trabajo en pasos más pequeños. Sin una API de subtareas bien definida, cada pantalla puede gestionar estados y ordenamientos de manera inconsistente, causando errores en la UX y dificultad para sincronizar el avance de una tarea principal con su descomposición detallada.

## Objetivos

- Definir la entidad `Subtask` y su relación con una tarea principal.
- Establecer CRUD básico para subtareas.
- Centralizar el control de estado (`todo`, `done`, `blocked`) y orden.
- Mantener la API compatible con la lógica de TanStack Query y la navegación del app.

## No-objetivos

- No incluir comentarios, archivos, recordatorios ni supervisión por usuario.
- No definir prioridades diferenciadas por subtarea, salvo estado y orden.
- No crear un sistema de dependencias entre subtareas en esta especificación.

## Supuestos

- Cada subtarea pertenece a una tarea y se renderiza como paso dentro del detalle de la tarea.
- El orden de subtareas es relevante para UX y puede venir del campo `position` o `order`.
- El estado de la tarea puede reflejar el progreso total de sus subtareas.

## Requerimientos funcionales

- [ ] RF-1: El usuario puede listar subtareas de una tarea.
- [ ] RF-2: El usuario puede crear una subtarea asociada a una tarea.
- [ ] RF-3: El usuario puede editar el título y el estado de una subtarea.
- [ ] RF-4: El usuario puede eliminar o completar una subtarea.
- [ ] RF-5: El sistema debe mantener un orden consistente para mostrar subtareas en secuencia.
- [ ] RF-6: La tarea padre debe poder computar progreso basado en subtareas completadas.

## Requerimientos no funcionales

- Rendimiento: una tarea rara vez tendrá muchas subtareas, pero la API debe responder de forma eficiente.
- Consistencia: cambios de estado y orden deben ser transacciones simples o atómicas.
- Accesibilidad: la lista debe permitir interacción por teclado o touch con estados claros.
- Seguridad: la subtarea no puede accederse fuera del alcance de la tarea asociada.

## Datos / API

### Entidad Subtask

- `id: string`
- `taskId: string`
- `title: string`
- `status: 'todo' | 'done' | 'blocked'`
- `order: number`
- `createdAt: string`
- `updatedAt: string`

### Endpoints sugeridos

- `GET /tasks/:taskId/subtasks`
- `POST /tasks/:taskId/subtasks`
- `PATCH /tasks/:taskId/subtasks/:id`
- `DELETE /tasks/:taskId/subtasks/:id`
- `PATCH /tasks/:taskId/subtasks/reorder`

### Query / mutation strategy

- `useSubtasks(taskId)`
- `useCreateSubtask(taskId)`
- `useUpdateSubtask(taskId, subtaskId)`
- `useDeleteSubtask(taskId, subtaskId)`
- invalidación y re-cálculo de progreso de la tarea principal.

## UI / Navegación

- La subtarea vive dentro del detalle de la tarea.
- Debe existir una indicación visual de completado y de estado bloqueado.
- Reordenamiento o checkboxes deben proporcionar feedback inmediato sin romper la navegación.

## Manejo de errores y edge cases

- Título vacío: validar antes de guardar.
- Subtarea no encontrada: 404.
- Reordenamiento inconsistente: normalizar orden durante la actualización.
- Completado de tarea con subtareas pendientes: evitar validación bloqueante si la regla de negocio permite trabajo incompleto.
- Mutaciones concurrentes: usar invalidación o optimista con rollback automático.

## Estrategia de testing

- Typecheck: `npm run typecheck`.
- Lint/format: `npm run lint:fix`.
- Validación manual:
  - crear subtarea con título válido
  - marcar como completada
  - reordenar subtareas
  - eliminar una subtarea y verificar actualización del progreso
  - error al intentar crear subtarea sin título

## Preguntas abiertas

- ¿Se requiere soporte para subtareas bloqueadas con motivo o solo estado booleano?
- ¿La subtarea puede re-ordenarse por drag & drop o solo por movimiento ascendente/descendente?

## Criterios de aceptación

- [ ] Existe una entidad `Subtask` y una relación clara con `Task`.
- [ ] Los endpoints básicos de listado, creación, actualización y eliminación están definidos.
- [ ] El estado y el orden de subtareas están cubiertos por la API y la UX.
- [ ] La feature integra claramente con TanStack Query y con la tarea padre.
- [ ] La spec está lista para avanzar a la fase de plan o implementación.
