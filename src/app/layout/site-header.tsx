import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart, LogIn, LogOut, Search, ShoppingCart, User, Wallet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLogout, useSession } from '@/features/auth'
import { cn } from '@/shared/lib/cn'
import { Container } from '@/shared/ui/container'
import { Unavailable } from '@/shared/ui/unavailable'
import type { ReactNode } from 'react'

function SearchForm({ onDone, focusOnMount }: { onDone?: () => void; focusOnMount?: boolean }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus()
  }, [focusOnMount])
  const onSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    const q = inputRef.current?.value.trim()
    void navigate({ to: '/', search: q ? { q } : {}, hash: 'catalogo' })
    onDone?.()
  }
  return (
    <form role="search" onSubmit={onSubmit} className="flex w-full items-center gap-2">
      <label htmlFor="site-search" className="sr-only">
        Buscar NFTs
      </label>
      <input
        ref={inputRef}
        id="site-search"
        type="search"
        placeholder="Buscar NFTs, coleções…"
        className="h-10 w-full rounded-md border border-border bg-surface-card px-4 text-body text-text-primary placeholder:text-secondary"
        onKeyDown={(event) => event.key === 'Escape' && onDone?.()}
      />
    </form>
  )
}

/** Desktop + tablet header (Figma "Header With Divider"). */
export function SiteHeader({ cartSlot, statusSlot }: { cartSlot: ReactNode; statusSlot?: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const session = useSession()
  const logout = useLogout()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const user = session.data?.user

  const navItem = (active: boolean) =>
    cn(
      'relative py-3 text-body transition-colors',
      active
        ? 'font-bold text-text-accent after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary'
        : 'text-text-primary hover:text-text-accent',
    )

  return (
    <header className="hidden pt-6 md:block">
      <Container>
        <div className="flex items-center justify-between gap-4 border-b border-border">
          <Link to="/" className="py-3 text-body font-bold tracking-widest text-text-primary">
            KURIO
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-8">
              <li>
                <Link
                  to="/"
                  className={navItem(pathname === '/')}
                  aria-current={pathname === '/' ? 'page' : undefined}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  hash="catalogo"
                  className={navItem(
                    pathname.startsWith('/nft') || pathname === '/cart' || pathname === '/checkout',
                  )}
                >
                  Mercado
                </Link>
              </li>
              <li className="py-3 text-body text-text-primary">
                <Unavailable>Criadores</Unavailable>
              </li>
              <li className="py-3 text-body text-text-primary">
                <Unavailable>Aprenda</Unavailable>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {statusSlot}
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-expanded={searchOpen}
              aria-controls="header-search"
              aria-label="Buscar"
              className="hidden size-9 items-center justify-center rounded-full text-text-primary hover:bg-surface-card md:flex"
            >
              <Search aria-hidden="true" className="size-5" />
            </button>
            {cartSlot}
            {user ? (
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-primary px-3 py-1.5 text-body text-text-accent [&::-webkit-details-marker]:hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 rounded-full object-cover"
                    />
                  ) : (
                    <User aria-hidden="true" className="size-4" />
                  )}
                  <span className="max-w-[10ch] truncate">{user.displayName.split(' ')[0]}</span>
                  <span className="sr-only">: menu da conta</span>
                </summary>
                <ul className="absolute right-0 z-40 mt-2 w-52 rounded-lg border border-border-soft bg-surface-card p-1 shadow-xl">
                  {(
                    [
                      { to: '/profile', label: 'Meu perfil', icon: User },
                      { to: '/wallets', label: 'Carteiras', icon: Wallet },
                      { to: '/favorites', label: 'Favoritos', icon: Heart },
                    ] as const
                  ).map(({ to, label, icon: Icon }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-body text-text-primary hover:bg-surface-dark"
                      >
                        <Icon aria-hidden="true" className="size-4" />
                        {label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })
                      }
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-body text-text-primary hover:bg-surface-dark"
                    >
                      <LogOut aria-hidden="true" className="size-4" />
                      Sair
                    </button>
                  </li>
                </ul>
              </details>
            ) : (
              <Link
                to="/login"
                search={pathname === '/' || pathname === '/login' ? {} : { redirect: pathname }}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-body font-medium text-ink hover:bg-text-accent"
              >
                <LogIn aria-hidden="true" className="size-4" />
                Entrar
              </Link>
            )}
          </div>
        </div>
        {searchOpen && (
          <div id="header-search" className="mt-4 hidden md:block">
            <SearchForm focusOnMount onDone={() => setSearchOpen(false)} />
          </div>
        )}
      </Container>
    </header>
  )
}

/** Mobile bottom tab bar (Figma "Tab Bar"). */
export function MobileTabBar({ cartCount }: { cartCount: number }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const session = useSession()
  const items = [
    { to: '/', label: 'Início', icon: Search, active: pathname === '/' },
    { to: '/favorites', label: 'Favoritos', icon: Heart, active: pathname === '/favorites' },
    { to: '/cart', label: 'Carrinho', icon: ShoppingCart, active: pathname === '/cart', badge: cartCount },
    {
      to: session.data ? '/profile' : '/login',
      label: session.data ? 'Perfil' : 'Entrar',
      icon: User,
      active: pathname === '/profile' || pathname === '/login',
    },
  ] as const
  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-3 text-caption',
                item.active ? 'font-bold text-text-accent' : 'text-text-secondary',
              )}
            >
              <span className="relative">
                <item.icon aria-hidden="true" className="size-5" />
                {'badge' in item && item.badge > 0 && (
                  <span className="absolute -top-2 -right-3 flex size-4 items-center justify-center rounded-full bg-primary text-tiny font-bold text-ink">
                    {item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
