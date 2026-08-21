# Refactorización del cliente HTTP

## Contexto / Problema

Actualmente, `src/lib/api/auth.ts` contiene un patrón de `fetch` repetitivo que incluye:
- Configuración de base URL desde `EXPO_PUBLIC_API_URL`
- Manejo de errores de red
- Parseo de JSON
- Validación de response.ok
- Lanzamiento de `ApiError` con mensajes específicos

Este patrón se repetirá en cada nuevo endpoint de la API, violando el principio DRY. Además, no hay
ningún mecanismo para inyectar el token de autenticación en los headers de las requests autenticadas.

## Objetivos

- Extraer un cliente HTTP genérico y reutilizable en `src/lib/api/client.ts`
- Configurar la base URL centralizadamente
- Inyectar automáticamente el token de autenticación desde auth-store cuando esté disponible
- Reutilizar la clase `ApiError` existente para el manejo de errores
- Refactorizar `auth.ts` para usar el nuevo cliente

## No-objetivos

- Implementar endpoints de negocio específicos (esta spec es solo infraestructura)
- Crear el auth-store (se asume que ya existe o se creará en otra spec)
- Implementar interceptores o middleware complejos
- Manejo de refresh token (futuro)

## Supuestos

- Existe o existirá un auth-store en `src/stores/auth-store.ts` con un método `getToken()`
- El token se debe inyectar en el header `Authorization: Bearer <token>`
- Cuando no hay token disponible, el cliente debe funcionar sin el header (para endpoints públicos)
- La clase `ApiError` existente en `auth.ts` es adecuada y se reutilizará
- `EXPO_PUBLIC_API_URL` sigue siendo la fuente de verdad para la base URL

## Requerimientos funcionales

- [ ] RF-1: Crear `src/lib/api/client.ts` con un cliente HTTP genérico
- [ ] RF-2: El cliente debe configurar la base URL desde `EXPO_PUBLIC_API_URL`
- [ ] RF-3: El cliente debe inyectar el token de auth-store en el header `Authorization`
- [ ] RF-4: El cliente debe manejar errores de red con un mensaje genérico
- [ ] RF-5: El cliente debe parsear JSON y lanzar `ApiError` si falla
- [ ] RF-6: El cliente debe validar `response.ok` y lanzar `ApiError` con el status
- [ ] RF-7: Mover la clase `ApiError` de `auth.ts` a `client.ts` (o exportarla desde client.ts)
- [ ] RF-8: Refactorizar `auth.ts` para usar el nuevo cliente en `loginRequest`
- [ ] RF-9: El cliente debe soportar métodos HTTP comunes (GET, POST, PUT, DELETE, PATCH)

## Requerimientos no funcionales

- El cliente debe ser TypeScript-friendly con tipos genéricos para request/response
- El cliente debe mantener la misma experiencia de error que el código actual (mensajes en español)
- El cliente debe ser testeable (permitir inyección de dependencias si es necesario)
- El cliente no debe introducir dependencias adicionales (usar fetch nativo)

## Datos / API

- **Base URL**: `EXPO_PUBLIC_API_URL` env var
- **Token**: Obtenido dinámicamente desde auth-store (por definir)
- **Error format**: `ApiError` con `status: number`, `message: string`, `body: unknown`

## UI / Navegación

N/A (esta spec es solo infraestructura de backend/cliente HTTP)

## Manejo de errores y edge cases

- **Error de red**: Lanzar `Error` con mensaje 'No se pudo conectar. Verificá tu conexión.'
- **JSON inválido**: Lanzar `ApiError` con status del response y mensaje 'Respuesta inválida del servidor'
- **Response no ok**: Lanzar `ApiError` con status y mensaje apropiado (401 → credenciales inválidas, otros → error genérico)
- **Base URL no configurada**: Lanzar `Error` con mensaje 'EXPO_PUBLIC_API_URL is not configured'
- **Token no disponible**: No inyectar header Authorization (endpoint público)

## Estrategia de testing

- Verificar que `npm run typecheck` no falle
- Verificar que `npm run lint:fix` no introduzca cambios
- Prueba manual: el login debe funcionar igual que antes
- Verificar que el token se inyecta correctamente cuando auth-store tiene token
- Verificar que el cliente funciona sin token (endpoints públicos)

## Preguntas abiertas

- ¿El auth-store ya existe o se debe crear en esta misma spec? (Asumo que ya existe)
- ¿El cliente debe exponer una instancia singleton o una función factory? (Asumo factory para testing)
- ¿Debería el cliente manejar automáticamente el 401 para redirigir a login? (Dejo fuera de esta spec)

## Criterios de aceptación

- [ ] Existe `src/lib/api/client.ts` con un cliente HTTP genérico
- [ ] `ApiError` está disponible desde `client.ts` (exportada)
- [ ] `auth.ts` usa el nuevo cliente en lugar de fetch directo
- [ ] El login funciona igual que antes (misma experiencia de usuario)
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run lint:fix` no introduce cambios
- [ ] El cliente inyecta el token de auth-store cuando está disponible
- [ ] El cliente funciona sin token para endpoints públicos
