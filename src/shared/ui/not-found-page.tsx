import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-24 text-center">
      <p className="text-caption font-bold tracking-widest text-text-accent uppercase">Erro 404</p>
      <h1 className="text-heading font-bold">Página não encontrada</h1>
      <p className="max-w-md text-body leading-6 text-text-secondary">
        O endereço que você acessou não existe ou foi removido.
      </p>
      <Link
        to="/"
        className="rounded-full bg-primary px-6 py-3 text-body font-bold text-ink transition-colors hover:bg-text-accent"
      >
        Voltar para o início
      </Link>
    </main>
  )
}
