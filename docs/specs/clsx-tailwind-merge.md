# Implementar clsx y tailwind-merge

## Contexto / Problema

Actualmente, el manejo de clases condicionales en componentes React Native con NativeWind se realiza mediante concatenación de strings o template literals. Este enfoque tiene varios problemas:

1. **Fragilidad**: La concatenación directa de strings puede generar errores de espacios dobles, clases duplicadas o conflictos de Tailwind (ej: `px-4 px-8`).
2. **Legibilidad**: Los condicionales anidados con template literals son difíciles de leer y mantener.
3. **Conflictos de Tailwind**: Sin `tailwind-merge`, las clases en conflicto se resuelven en orden de aparición, lo que puede causar estilos inesperados.
4. **Repetición**: Cada componente necesita implementar su propia lógica para manejar clases condicionales.

La implementación de `clsx` y `tailwind-merge` resuelve estos problemas proporcionando una forma declarativa, segura y consistente de manejar clases en React Native.

## Objetivos

- Crear un helper `cn()` que combine `clsx` y `tailwind-merge` en una única función utilitaria.
- Establecer un estándar para el manejo de clases en todos los componentes del proyecto.
- Mejorar la legibilidad y mantenibilidad del código de estilos.
- Prevenir conflictos de clases de Tailwind de forma automática.
- Facilitar la composición de componentes con estilos condicionales.

## No-objetivos

- Migrar todos los componentes existentes en esta spec (será un trabajo incremental).
- Cambiar la configuración de NativeWind o Tailwind.
- Implementar temas o diseños específicos.
- Modificar la estructura de directorios del proyecto.

## Supuestos

- El proyecto no tiene actualmente `clsx` ni `tailwind-merge` instalados.
- Los desarrolladores están familiarizados con las clases de Tailwind CSS.
- La instalación de paquetes se realizará con `npm install` (no son módulos nativos).
- El helper `cn()` será lo suficientemente flexible para manejar casos comunes de React Native.
- Se mantendrá la compatibilidad con NativeWind v5 y Tailwind CSS v4.

## Requerimientos funcionales

- [ ] RF-1: Instalar las dependencias `clsx` y `tailwind-merge` en el proyecto.
- [ ] RF-2: Crear el archivo `src/lib/cn.ts` con la función helper `cn()`.
- [ ] RF-3: La función `cn()` debe aceptar múltiples argumentos (tipos flexibles).
- [ ] RF-4: La función `cn()` debe manejar:
  - Strings de clases
  - Objetos con valores booleanos `{ 'clase-activa': condition }`
  - Arrays de clases
  - Anidamiento de estructuras
- [ ] RF-5: La función `cn()` debe usar `tailwind-merge` para resolver conflictos de clases.
- [ ] RF-6: La función `cn()` debe ser exportada y disponible para importación en cualquier componente.
- [ ] RF-7: Crear un archivo de tipos `src/lib/cn.d.ts` para soporte de TypeScript.
- [ ] RF-8: Agregar documentación básica en el archivo `src/lib/cn.ts` con ejemplos de uso.

## Requerimientos no funcionales

- **Rendimiento**: La función `cn()` debe ser eficiente y no causar re-renders innecesarios.
- **Bundle size**: Los paquetes agregados deben ser mínimos (clsx ~2kB, tailwind-merge ~8kB gzipped).
- **Compatibilidad**: Debe funcionar en iOS, Android y Web.
- **TypeScript**: Tipado completo y estricto para mejor experiencia de desarrollo.
- **Documentación**: Ejemplos claros de uso en el archivo del helper.

## Datos / API

- **Dependencias a instalar**:
  - `clsx`: v2.1.1 (o última estable)
  - `tailwind-merge`: v2.5.2 (o última estable)

- **Función `cn()`**:
  ```typescript
  import { type ClassValue, clsx } from 'clsx';
  import { twMerge } from 'tailwind-merge';
  
  export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
  }
  ```

- **Tipos de `clsx`**:
  - `ClassValue`: `string | number | boolean | undefined | null | ClassValue[]`
  - Permite strings, números, booleanos, arrays anidados y objetos.

- **Uso típico**:
  ```typescript
  // Clases simples
  cn('p-4 bg-white')
  
  // Condiciones
  cn('p-4', isActive && 'bg-blue-500')
  
  // Objetos
  cn({ 'text-red-500': hasError, 'text-green-500': isSuccess })
  
  // Combinación compleja
  cn(
    'base-class',
    condition1 && ['class-a', 'class-b'],
    { 'conditional-class': condition2 },
    overrideClass
  )
  ```

## UI / Navegación

Esta spec no afecta la navegación ni la estructura de pantallas. Se crea un módulo utilitario en `src/lib/` que será consumido por componentes existentes y futuros.

- **Ubicación del helper**: `src/lib/cn.ts`
- **Tipos**: `src/lib/cn.d.ts` (opcional, para documentación de tipos)
- **Ejemplo de componente que lo usaría**:
  ```typescript
  // src/components/Button.tsx
  import { cn } from '@/lib/cn';
  
  interface ButtonProps {
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
  }
  
  export function Button({ variant = 'primary', size = 'md', disabled, className }: ButtonProps) {
    return (
      <TouchableOpacity
        className={cn(
          'rounded-lg items-center justify-center',
          {
            'bg-blue-500': variant === 'primary',
            'bg-gray-200': variant === 'secondary',
          },
          {
            'px-2 py-1': size === 'sm',
            'px-4 py-2': size === 'md',
            'px-6 py-3': size === 'lg',
          },
          disabled && 'opacity-50',
          className
        )}
      >
        {/* contenido */}
      </TouchableOpacity>
    );
  }
  ```

## Manejo de errores y edge cases

- **Clases vacías**: `cn()` debe manejar `undefined`, `null`, `false` y strings vacíos sin problemas.
- **Clases duplicadas**: `tailwind-merge` se encarga automáticamente de resolver conflictos (ej: `px-4 px-8` → `px-8`).
- **Clases no válidas**: NativeWind/Tailwind las ignorará silenciosamente.
- **Performance**: No hay casos edge significativos; la función es síncrona y ligera.
- **TypeScript**: El tipado de `clsx` maneja la mayoría de casos edge de tipos.

## Estrategia de testing

- **Typecheck**: Ejecutar `npm run typecheck` para verificar que los tipos son correctos.
- **Lint**: Ejecutar `npm run lint:fix` para asegurar consistencia con Biome.
- **Pruebas manuales**:
  1. Crear un componente de prueba que use `cn()` con diferentes combinaciones.
  2. Verificar que las clases se aplican correctamente en iOS, Android y Web.
  3. Probar conflictos de clases (ej: `p-4 p-8` → debe quedar `p-8`).
  4. Verificar que el bundle no crece significativamente.
- **Documentación**: Agregar ejemplos en el archivo del helper para referencia rápida.

## Preguntas abiertas

- ¿Se debe crear un archivo de tipos dedicado `cn.d.ts` o solo documentar en el archivo `.ts`?
- ¿Es necesario crear un alias en `tsconfig.json` para facilitar los imports (ej: `@/utils/cn`)?
- ¿Se debe agregar una regla de Biome para preferir el uso de `cn()` sobre concatenación de strings?
- ¿Qué nivel de documentación se necesita en el archivo del helper?

## Criterios de aceptación

- [ ] Las dependencias `clsx` y `tailwind-merge` están instaladas y son versiones estables.
- [ ] El archivo `src/lib/cn.ts` existe y exporta la función `cn()`.
- [ ] La función `cn()` maneja correctamente: strings, objetos, arrays, anidamiento y condicionales.
- [ ] `tailwind-merge` resuelve automáticamente conflictos de clases de Tailwind.
- [ ] El helper está tipado correctamente con TypeScript.
- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm run lint:fix` pasa sin errores.
- [ ] El bundle size se incrementa menos de 15kB gzipped.
- [ ] La función funciona en iOS, Android y Web.
- [ ] Hay al menos un ejemplo documentado de uso en el archivo del helper.
