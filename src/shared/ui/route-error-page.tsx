import type { ErrorComponentProps } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { isAppError } from '@/shared/http'

export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const message = isAppError(error) ? error.message : 'Algo deu errado ao carregar esta página.'

  return (
    <section
      role="alert"
      className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-24 text-center"
    >
      <h1 className="text-heading font-bold">Não foi possível carregar</h1>
      <p className="max-w-md text-body leading-6 text-text-secondary">{message}</p>
      <button
        type="button"
        onClick={() => {
          reset()
          void router.invalidate()
        }}
        className="rounded-full bg-primary px-6 py-3 text-body font-bold text-ink transition-colors hover:bg-text-accent"
      >
        Tentar novamente
      </button>
    </section>
  )
}
