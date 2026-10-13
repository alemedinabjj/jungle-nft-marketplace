import { X } from 'lucide-react'
import { useId, useState } from 'react'
import { isAppError } from '@/shared/http'
import { useAnnounce } from '@/shared/ui/live-region'
import { useApplyCoupon, useCart, useRemoveCoupon } from '../queries/cart-queries'

/** "Código promocional" field. Invalid / expired codes come back as API field errors. */
export function CouponForm() {
  const cart = useCart()
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const announce = useAnnounce()
  const [code, setCode] = useState('')
  const id = useId()
  const errorId = `${id}-error`
  const applied = cart.data?.couponCode
  const error =
    apply.error && isAppError(apply.error)
      ? (apply.error.fieldErrors?.code ?? apply.error.message)
      : apply.error
        ? 'Não foi possível aplicar o cupom.'
        : null

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md border border-primary/60 bg-surface-card px-3 py-2 text-body">
        <span>
          Cupom <strong className="text-text-accent">{applied}</strong> aplicado
        </span>
        <button
          type="button"
          onClick={() =>
            remove.mutate(undefined, { onSuccess: () => announce(`Cupom ${applied} removido.`) })
          }
          disabled={remove.isPending}
          aria-label={`Remover cupom ${applied}`}
          className="flex size-7 items-center justify-center rounded-full text-text-secondary hover:bg-surface-dark hover:text-text-primary"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!code.trim()) return
        apply.mutate(code.trim(), {
          onSuccess: (next) => {
            setCode('')
            announce(`Cupom ${next.couponCode ?? ''} aplicado.`)
          },
        })
      }}
    >
      <label htmlFor={id} className="text-body font-bold text-text-primary">
        Código promocional
      </label>
      <div className="flex">
        <input
          id={id}
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            if (apply.isError) apply.reset()
          }}
          placeholder="Digite o código promocional..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-l-md border border-r-0 border-primary bg-transparent px-3 text-caption text-text-primary uppercase placeholder:text-secondary placeholder:normal-case aria-invalid:border-danger"
        />
        <button
          type="submit"
          disabled={apply.isPending}
          aria-busy={apply.isPending}
          className="h-10 rounded-r-md bg-primary px-4 text-body font-bold text-ink hover:bg-text-accent disabled:opacity-60"
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </form>
  )
}
