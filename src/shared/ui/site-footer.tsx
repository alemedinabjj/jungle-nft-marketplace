import { useState } from 'react'
import { Container } from './container'
import { Unavailable } from './unavailable'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    body: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    body: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    body: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const COLUMNS = [
  {
    title: 'Meu perfil',
    links: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    links: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  { title: 'Coleções', links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
]

function Newsletter() {
  const [notice, setNotice] = useState<string | null>(null)
  const onSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    // Out of scope: say so honestly instead of pretending to subscribe.
    setNotice('A newsletter não está disponível nesta demonstração. Nenhum e-mail foi cadastrado.')
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" aria-describedby="newsletter-hint">
      <p className="text-body-lg font-bold text-text-primary">Antecipe-se ao próximo lançamento</p>
      <div className="flex">
        <label htmlFor="newsletter-email" className="sr-only">
          E-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="digite seu e-mail..."
          className="h-10 min-w-0 flex-1 rounded-l-md bg-surface-dark px-3 text-body text-text-primary placeholder:text-secondary"
        />
        <button
          type="submit"
          className="h-10 rounded-r-md bg-primary px-4 text-body font-bold text-ink hover:bg-text-accent"
        >
          Enviar
        </button>
      </div>
      <p id="newsletter-hint" className="text-caption leading-5 text-text-secondary" role="status">
        {notice ?? 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
      </p>
    </form>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-24 pb-24 lg:pb-6">
      <Container>
        <div className="overflow-hidden rounded-lg bg-surface-card">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.letter}
                className="flex flex-col gap-3 lg:border-r lg:border-primary/60 lg:pr-6"
              >
                <span
                  aria-hidden="true"
                  className="flex size-[50px] items-center justify-center rounded-full bg-primary text-body-lg font-bold text-ink"
                >
                  {feature.letter}
                </span>
                <p className="text-body font-bold text-text-primary">{feature.title}</p>
                <p className="text-body leading-5 text-text-secondary">{feature.body}</p>
              </div>
            ))}
            <Newsletter />
          </div>
          <div className="grid gap-4 bg-surface-dark px-6 py-6 text-body text-text-primary md:grid-cols-4 lg:px-8">
            <p className="font-bold">KURIO</p>
            <p>Feito para colecionadores, criadores e cultura</p>
            <p>contato@email.com</p>
            <p>+55 11 4002 8922</p>
          </div>
          <div className="grid gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="mb-3 text-body-lg font-bold text-text-primary">{column.title}</p>
                <ul className="flex flex-col gap-2 text-body text-text-primary">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Unavailable>{link}</Unavailable>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <div>
              <p className="mb-3 text-body-lg font-bold text-text-primary">Redes sociais</p>
              <ul className="flex gap-2" aria-label="Redes sociais (indisponíveis nesta demonstração)">
                {['f', 'ig', 'x', 'in', 'yt'].map((label) => (
                  <li
                    key={label}
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center rounded border border-primary text-caption font-bold text-text-accent"
                  >
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-5 mb-2 text-body-lg font-bold text-text-primary">Carteiras compatíveis</p>
              <p className="inline-block rounded border border-border-soft bg-surface-dark px-2 py-1 text-tiny font-bold tracking-wide text-text-accent">
                METAMASK · WALLETCONNECT · COINBASE
              </p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-caption text-text-primary">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </Container>
    </footer>
  )
}
