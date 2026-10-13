import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface AuthCardProps {
  mode: 'login' | 'register'
  description: string
  redirect: string | undefined
  notice?: ReactNode
  children: ReactNode
}

/** Shell of the Sign In / Sign Up modal from Figma (500px card, centered tabs). */
export function AuthCard({ mode, description, redirect, notice, children }: AuthCardProps) {
  const search = redirect ? { redirect } : {}
  return (
    <section
      aria-labelledby="auth-title"
      className="mx-auto w-full max-w-[500px] rounded-3xl border border-border bg-surface-card px-6 pt-12 pb-10 sm:px-20"
    >
      <h1 id="auth-title" className="sr-only">
        {mode === 'login' ? 'Entrar na Kurio' : 'Criar conta na Kurio'}
      </h1>
      <nav aria-label="Acesso" className="flex items-center justify-center gap-2 text-body-lg font-bold">
        <Link
          to="/login"
          search={search}
          aria-current={mode === 'login' ? 'page' : undefined}
          className={cn(
            'px-1',
            mode === 'login' ? 'text-text-accent' : 'text-text-primary hover:text-text-accent',
          )}
        >
          Entrar
        </Link>
        <span aria-hidden="true" className="h-5 w-px bg-border-soft" />
        <Link
          to="/register"
          search={search}
          aria-current={mode === 'register' ? 'page' : undefined}
          className={cn(
            'px-1',
            mode === 'register' ? 'text-text-accent' : 'text-text-primary hover:text-text-accent',
          )}
        >
          Criar conta
        </Link>
      </nav>
      <p className="mt-6 text-center text-body leading-4 text-text-secondary">{description}</p>
      {notice && <div className="mt-6">{notice}</div>}
      <div className="mt-6">{children}</div>
    </section>
  )
}
