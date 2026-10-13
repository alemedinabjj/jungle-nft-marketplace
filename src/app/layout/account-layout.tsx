import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { AlertTriangle, Download, Heart, LogOut, ShoppingBag, User, Wallet, Activity } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLogout } from '@/features/auth'
import { cn } from '@/shared/lib/cn'
import { Container } from '@/shared/ui/container'
import { Unavailable } from '@/shared/ui/unavailable'

const LINKS = [
  { to: '/profile', label: 'Detalhes do perfil', icon: User },
  { to: '/wallets', label: 'Carteiras', icon: Wallet },
  { to: '/favorites', label: 'Favoritos', icon: Heart },
] as const

const UNAVAILABLE = [
  { label: 'Pedidos', icon: ShoppingBag },
  { label: 'Atividade', icon: Activity },
  { label: 'Downloads', icon: Download },
  { label: 'Denúncias', icon: AlertTriangle },
] as const

/** "Meu perfil" sidebar (310px) + content (Figma Perfil / Carteiras). */
export function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const logout = useLogout()
  const navigate = useNavigate()
  const item = 'flex h-[45px] items-center gap-3 rounded-md px-4 text-body transition-colors'

  return (
    <Container className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-8 md:pt-10 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-7">
      <nav aria-label="Minha conta" className="flex min-w-0 flex-col gap-1 self-start rounded-lg">
        <p className="px-2.5 py-2.5 text-body-lg font-bold text-text-primary">Meu perfil</p>
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {LINKS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <li key={to} className="shrink-0">
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    item,
                    active
                      ? 'bg-surface-card font-bold text-text-accent'
                      : 'text-text-primary hover:bg-surface-card',
                  )}
                >
                  <Icon aria-hidden="true" className="size-[18px]" />
                  {label}
                </Link>
              </li>
            )
          })}
          {UNAVAILABLE.map(({ label, icon: Icon }) => (
            <li key={label} className="hidden lg:block">
              <Unavailable className={cn(item, 'text-text-secondary')}>
                <Icon aria-hidden="true" className="size-[18px]" />
                {label}
              </Unavailable>
            </li>
          ))}
          <li className="shrink-0">
            <button
              type="button"
              className={cn(item, 'w-full text-text-primary hover:bg-surface-card')}
              onClick={() => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
            >
              <LogOut aria-hidden="true" className="size-5" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </Container>
  )
}
