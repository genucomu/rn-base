# Plan: clsx + tailwind-merge

## Referencia

- Spec: `docs/specs/clsx-tailwind-merge.md`

## Contexto del codebase

- `src/lib/` ya existe: tiene `query-client.ts` y `api/auth.ts`. `cn.ts` va ahí.
- Alias `@/*` → `src/*` ya configurado en `tsconfig.json` → import será `@/lib/cn`.
- Componentes con `className` estático (sin condicionales): `login.tsx`, `index.tsx`, `stack-demo.tsx`, etc. Ninguno usa concatenación condicional todavía — la migración será incremental en features futuras.
- `ThemedText` / `ThemedView` usan `style={[]}` (StyleSheet), no `className`. No se migran en esta spec.

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `package.json` | modificar | Agregar `clsx` y `tailwind-merge` a `dependencies` |
| `src/lib/cn.ts` | crear | Helper `cn()` que combina `clsx` + `twMerge` |

## Descomposición en tareas

### T1 — Instalar dependencias

- **Archivos**: `package.json`, `package-lock.json`
- **Qué hacer**: Ejecutar `npm install clsx tailwind-merge` (no `npx expo install` — no son módulos nativos). Verificar que las versiones instaladas son las últimas estables (clsx ~2.1.x, tailwind-merge ~2.x).
- **Resultado**: Dependencias listas en `package.json`.

### T2 — Crear `src/lib/cn.ts`

- **Archivos**: `src/lib/cn.ts`
- **Qué hacer**: Crear el archivo con la función `cn()`:
  - Importar `ClassValue` y `clsx` de `clsx`.
  - Importar `twMerge` de `tailwind-merge`.
  - Exportar `cn(...inputs: ClassValue[]): string` que retorne `twMerge(clsx(inputs))`.
  - Agregar JSDoc con descripción y ejemplos de uso (strings, objetos, arrays, condicionales, anidamiento).
- **Resultado**: Helper listo para importar como `@/lib/cn`.

### T3 — Verificación

- **Archivos**: ninguno (comandos sobre el proyecto completo)
- **Qué hacer**:
  1. Ejecutar `npm run typecheck` → debe pasar sin errores.
  2. Ejecutar `npm run lint:fix` → debe pasar sin errores (Biome formatea el archivo nuevo).
- **Resultado**: Proyecto limpio, sin errores de tipo ni de lint.

## Dependencias entre tareas

```
T1 → T2 → T3
```

Todas las tareas son secuenciales (T2 depende de T1; T3 depende de T2).

## Conflictos de archivos

- No hay conflictos posibles (una sola tarea escribe código).

## Librerías / dependencias

| Paquete | Versión esperada | Comando | Notas |
| --- | --- | --- | --- |
| `clsx` | ^2.1.x | `npm install clsx` | JS puro, ~2kB gzipped |
| `tailwind-merge` | ^2.x | `npm install tailwind-merge` | JS puro, ~8kB gzipped |

No hay módulos nativos → `npm install` directo, sin `npx expo install`.

## Riesgos / dependencias

- **Riesgo bajo**: Ambos paquetes son JS puro, sin dependencias nativas. No afectan el bundler de Expo ni Metro.
- **Riesgo bajo**: `tailwind-merge` trae su propio set de reglas de Tailwind. Debe ser compatible con las clases que NativeWind v5 genera. Si NativeWind usa clases no estándar, `tailwind-merge` las ignorará silenciosamente (comportamiento esperado).
- **Dependencia**: Ninguna de las tareas existentes bloquea este plan.

## Verificación

1. `npm run typecheck` — sin errores de tipos.
2. `npm run lint:fix` — sin errores de Biome.
3. Verificar que el archivo `src/lib/cn.ts` puede importarse: crear temporalmente un import en un componente existente (ej: agregar `import { cn } from '@/lib/cn';` en `login.tsx`, verificar que typecheck pasa, y luego revertir si se desea mantener la spec como no-migratoria).

## Nota sobre migración de componentes

La spec dice explícitamente que **no** se migran componentes existentes en esta iteración. El helper queda disponible para uso inmediato en nuevos componentes y en futuras migraciones incrementales.
