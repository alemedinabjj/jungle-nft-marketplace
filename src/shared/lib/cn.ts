import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge must know the theme's custom font-size tokens; otherwise
 * `text-body` is mistaken for a color and silently drops `text-ink` & co.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['tiny', 'caption', 'body', 'body-lg', 'heading', 'display'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
