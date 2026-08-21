# API de grupos

## Contexto / Problema

El proyecto necesita una API de dominio para agrupar entidades, por ejemplo equipos, proyectos o espacios de trabajo. Hasta ahora no existe una fuente única para gestionar grupos ni un modelo consistente de permisos, estado y relaciones. Esto dificulta la evolución de las pantallas de listado y detalle, y hace que cada feature repita definiciones superficiales de la misma entidad.

## Objetivos

- Definir el modelo base de un grupo y sus campos esenciales.
- Establecer endpoints CRUD para crear, listar, editar y eliminar grupos.
- Definir vinculación con miembros y tareas, sin acoplar la vista al backend.
- Preparar la API para integrarse con TanStack Query y hooks de React Native.

## No-objetivos

- No incluir invitaciones por email, roles complejos ni permisos granulares en esta especificación.
- No definir un sistema de trabajo multi-tenant ni aislamiento de dominio por empresa.
- No incorporar flujos de administración avanzada de grupos en esta etapa.

## Supuestos

- Un grupo pertenece a un usuario o equipo dueño y puede tener múltiples miembros.
- La entidad `Group` es la raíz de tareas y subtareas para varios casos de uso del negocio.
- Los endpoints usaran JSON y `snake_case` o `camelCase` según el contrato final del backend; la spec prioriza claridad de dominio por sobre convención de serialización.

## Requerimientos funcionales

- [ ] RF-1: El usuario puede listar sus grupos activos.
- [ ] RF-2: El usuario puede obtener el detalle de un grupo por id.
- [ ] RF-3: El usuario puede crear un grupo con nombre y datos opcionales.
- [ ] RF-4: El usuario puede actualizar nombre, descripción y metadata general del grupo.
- [ ] RF-5: El usuario puede archivar o eliminar lógicamente un grupo si se requiere conservar historial.
- [ ] RF-6: La API debe permitir listar miembros relacionados a un grupo.
- [ ] RF-7: Cada grupo debe poder relacionarse con tareas y subtareas dentro del mismo alcance de dominio.

## Requerimientos no funcionales

- Rendimiento: queries de listado paginadas o filtradas por actualización reciente.
- Consistencia: respuestas con timestamps de creación y modificación.
- Seguridad: sólo el dueño o miembro autorizado puede consultar/editar un grupo.
- Arquitectura: separación clara entre `group` y `task` para mantener query keys y cache por dominio.

## Datos / API

### Entidad Group

- `id: string`
- `name: string`
- `description?: string`
- `color?: string`
- `ownerId: string`
- `memberIds: string[]`
- `isArchived: boolean`
- `createdAt: string`
- `updatedAt: string`

### Endpoints sugeridos

- `GET /groups`
  - Devuelve grupos del usuario autenticado.
- `GET /groups/:id`
  - Detalle del grupo con miembros y conteos.
- `POST /groups`
  - Crea un grupo con payload mínimo.
- `PATCH /groups/:id`
  - Edita campos del grupo.
- `DELETE /groups/:id`
  - Elimina o archiva según política de negocio.
- `GET /groups/:id/members`
  - Lista miembros del grupo.

### Query / mutation strategy

- `useGroups` para listado.
- `useGroup(id)` para detalle.
- `useCreateGroup`, `useUpdateGroup`, `useArchiveGroup` con invalidación de cache.

## UI / Navegación

- Pantalla principal: lista de grupos.
- Pantalla de detalle: nombre, descripción, miembros y tareas asociadas.
- Estado visual: empty state si no hay grupos, loading skeletons y manejo de error.
- En la navegación del app, la pantalla de grupos debe quedar registrada como vista principal del dominio de trabajo.

## Manejo de errores y edge cases

- Grupo inexistente: devolver 404 con mensaje claro.
- Nombre vacío o duplicado: validar antes de persistir.
- Permisos insuficientes: 403 con contexto de acceso.
- Integridad de miembros: si se elimina un miembro, las relaciones deben manejarse con estrategia consistente.
- Estado archived: no debe aparecer en listados activos, pero sí conservarse para historiales.

## Estrategia de testing

- Typecheck: `npm run typecheck`.
- Lint/format: `npm run lint:fix`.
- Validación manual:
  - crear grupo con datos válidos
  - mostrar error con nombre vacío
  - listar grupos para un usuario sin grupos
  - archivar/unarchive
  - detalle del grupo con miembros asociados

## Preguntas abiertas

- ¿Los grupos son “espacios compartidos” o también “proyectos personales” con la misma entidad?
- ¿Se requiere soft delete o eliminación física real?

## Criterios de aceptación

- [ ] Existe un modelo de `Group` documentado y consistente con la app.
- [ ] Los endpoints principales de CRUD están definidos y cubren casos básicos.
- [ ] La API contempla permisos y edge cases de negocio relevantes.
- [ ] La feature integra con TanStack Query y una estructura de hooks clara.
- [ ] La spec cumple con los estándares del proyecto y está lista para pasar a planeación técnica.
