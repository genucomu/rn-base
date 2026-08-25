# Contratos de API — rn-base

Referencia canónica de los shapes JSON que devuelve el backend NestJS.
El cliente HTTP (`src/services/http.ts`) retorna `res.json()` sin ningún unwrapping —
`T` en `http.get<T>()` debe coincidir exactamente con el JSON que llega por red.

## Respuestas paginadas

Endpoints que aceptan `page` / `limit`. Type: `PaginatedResponse<T>` de `src/types/pagination.ts`.

```json
{
  "items": [ { "...": "..." } ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

Usage: `http.get<PaginatedResponse<MyType>>(...)`

## Arrays sin paginación

Colecciones completas sin metadata (ej. `GET /tasks/groups/:id/members`).
Llega un array directo, sin objeto wrapper.

```json
[
  { "userId": "abc", "userEmail": "user@example.com" }
]
```

Usage: `http.get<MyType[]>(...)`

## Objeto único

GET por ID, POST y PATCH retornan el objeto completo sin envelope.

```json
{ "id": "...", "name": "...", "createdAt": "...", "updatedAt": "..." }
```

Usage: `http.get<MyType>(...)`, `http.post<MyType>(...)`, `http.patch<MyType>(...)`

## DELETE

Retorna `204 No Content`. El cliente retorna `undefined`.

Usage: `http.delete<void>(...)`

## Errores

El cliente lanza `HttpError(status, body)` para cualquier respuesta con `!res.ok`.
El body suele tener la forma estándar de NestJS:

```json
{ "statusCode": 400, "message": "...", "error": "Bad Request" }
```

## ⚠️ Formato anterior (removido)

Las respuestas **ya no** usan el envelope `{ data: <payload> }`.
El formato `{ data: { items: [...], metadata: {...} } }` fue eliminado del backend.
Si ves código que accede a `.data.items` o `.data.*`, debe actualizarse.
