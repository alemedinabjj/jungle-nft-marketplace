import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { NftImage } from './nft-image'
import { Unavailable } from './unavailable'

const art = (key: string, alt: string) => ({
  src: `/images/nfts/${key}-800.webp`,
  alt,
  width: 800,
  height: 800,
})

/** Two promo cards (Figma "Promos"); they deep-link into real catalog filters. */
export function PromoSection() {
  const promos = [
    {
      title: 'Lançamentos gênesis de edição limitada',
      body: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
      image: art('emerald-ape', ''),
      search: { tab: 'new' as const },
    },
    {
      title: 'Arte digital selecionada e muito mais',
      body: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
      image: art('ivory-baron', ''),
      search: { categories: ['digital-art' as const] },
    },
  ]
  return (
    <section aria-label="Coleções em destaque" className="grid gap-6 md:grid-cols-2 md:gap-7">
      {promos.map((promo) => (
        <article
          key={promo.title}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden rounded-3xl bg-surface-card md:h-[250px]"
        >
          <div className="h-full min-h-[180px] overflow-hidden rounded-3xl">
            <NftImage
              image={promo.image}
              sizes="(min-width: 768px) 290px, 50vw"
              className="h-full object-cover"
              alt=""
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <h2 className="text-body font-bold text-text-primary">{promo.title}</h2>
            <p className="text-caption leading-5 text-text-secondary">{promo.body}</p>
            <Link
              to="/"
              search={promo.search}
              hash="catalogo"
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-body font-bold text-ink hover:bg-text-accent"
            >
              Explorar <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}

const POSTS = [
  {
    date: '12 de setembro',
    read: '6 min',
    title: 'Como funciona a propriedade de NFTs',
    body: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    key: 'ivory-baron',
  },
  {
    date: '15 de setembro',
    read: '2 min',
    title: '10 artistas digitais para acompanhar',
    body: 'Conheça criadores que moldam a cultura digital.',
    key: 'emerald-ape',
  },
  {
    date: '15 de setembro',
    read: '3 min',
    title: 'Raridade, atributos e procedência',
    body: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    key: 'sage-nomad',
  },
  {
    date: '15 de setembro',
    read: '2 min',
    title: 'Como proteger sua carteira',
    body: 'Proteja sua carteira, seus ativos e sua identidade.',
    key: 'golden-beat',
  },
]

/** "Diário da Cunhagem" editorial teaser. Articles are out of scope (no fake pages). */
export function BlogSection() {
  return (
    <section aria-labelledby="blog-title" className="flex flex-col gap-8">
      <div className="text-center">
        <h2 id="blog-title" className="text-heading font-bold text-text-primary">
          Diário da Cunhagem
        </h2>
        <p className="mt-3 text-body text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title} className="overflow-hidden rounded-lg bg-surface-card">
            <div className="aspect-[268/195] overflow-hidden">
              <NftImage
                image={art(post.key, '')}
                sizes="(min-width: 1024px) 268px, 50vw"
                className="h-full object-cover"
                alt=""
              />
            </div>
            <div className="flex flex-col gap-2 p-4">
              <p className="text-tiny text-text-secondary">
                {post.date} | Leitura de {post.read}
              </p>
              <h3 className="text-body font-bold text-text-primary">{post.title}</h3>
              <p className="text-caption text-text-secondary">{post.body}</p>
              <Unavailable className="inline-flex items-center gap-1 text-caption font-bold text-text-accent">
                Ler mais <ArrowRight aria-hidden="true" className="size-3.5" />
              </Unavailable>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
