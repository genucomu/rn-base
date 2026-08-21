import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clsx y tailwind-merge para manejar clases de forma declarativa y segura.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', className)
 * cn({ 'text-red-500': hasError, 'text-green-500': isSuccess })
 * cn(['base-class', conditionalClass && 'extra-class'])
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
