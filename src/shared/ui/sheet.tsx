import { XIcon } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { useRef } from 'react'
import type * as React from 'react'
import { cn } from '@/shared/lib/cn'

/** shadcn/ui Sheet (Radix Dialog): focus trap, Esc to close, focus return. */
const Sheet = (props: React.ComponentProps<typeof SheetPrimitive.Root>) => (
  <SheetPrimitive.Root data-slot="sheet" {...props} />
)
const SheetTrigger = (props: React.ComponentProps<typeof SheetPrimitive.Trigger>) => (
  <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
)
const SheetClose = (props: React.ComponentProps<typeof SheetPrimitive.Close>) => (
  <SheetPrimitive.Close data-slot="sheet-close" {...props} />
)

function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: 'right' | 'left' | 'bottom' }) {
  // Controlled sheets may be opened from outside a <SheetTrigger>; remember who
  // had focus so it can be restored on close (Radix only restores to its trigger).
  const returnFocus = useRef<HTMLElement | null>(null)
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay data-slot="sheet-overlay" className="fixed inset-0 z-50 bg-black/60" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col gap-4 overflow-y-auto border-border bg-surface-card shadow-2xl outline-none',
          side === 'right' && 'inset-y-0 right-0 h-full w-[88%] max-w-sm border-l',
          side === 'left' && 'inset-y-0 left-0 h-full w-[88%] max-w-sm border-r',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl border-t',
          className,
        )}
        {...props}
        onOpenAutoFocus={(event) => {
          returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
          props.onOpenAutoFocus?.(event)
        }}
        onCloseAutoFocus={(event) => {
          props.onCloseAutoFocus?.(event)
          if (returnFocus.current?.isConnected) {
            event.preventDefault()
            returnFocus.current.focus()
          }
        }}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-text-secondary hover:bg-accent hover:text-text-primary">
          <XIcon aria-hidden="true" className="size-5" />
          <span className="sr-only">Fechar</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

const SheetTitle = ({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title
    data-slot="sheet-title"
    className={cn('text-body-lg font-bold text-text-primary', className)}
    {...props}
  />
)
const SheetDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) => (
  <SheetPrimitive.Description
    data-slot="sheet-description"
    className={cn('text-body text-text-secondary', className)}
    {...props}
  />
)

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger }
