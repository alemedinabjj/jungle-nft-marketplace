import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

/** 1200px content column from the Figma grid (120px side margins at 1440). */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-content px-4 sm:px-6 xl:px-0', className)} {...props} />
}
