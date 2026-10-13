import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'
import { cn } from '@/shared/lib/cn'

/** shadcn/ui Button, re-skinned with the Kurio tokens (Figma radius, mono type). */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-mono font-bold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-text-accent',
        destructive: 'bg-destructive text-ink hover:bg-destructive/90',
        outline: 'border border-border-soft bg-transparent text-text-primary hover:bg-accent',
        secondary: 'bg-surface-card text-text-primary hover:bg-surface-dark',
        ghost: 'text-text-primary hover:bg-accent',
        link: 'text-text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 text-body',
        sm: 'h-8 px-4 text-caption',
        lg: 'h-12 px-8 text-body-lg',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
