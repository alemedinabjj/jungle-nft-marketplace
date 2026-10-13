import { ArrowRightIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { NftImage } from '@/shared/ui/nft-image'

/**
 * Hero is fully static (copy + image are build-time assets) so the LCP never
 * waits for the mock worker or the API. The artwork is preloaded in index.html.
 */
const SLIDES = [
  {
    eyebrow: 'Bem-vindo à Kurio',
    title: 'Seja dono do futuro da arte digital',
    body: 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    image: {
      src: '/images/nfts/emerald-ape-800.webp',
      alt: 'Macaco ilustrado de óculos redondos e jaqueta college verde',
      width: 800,
      height: 800,
    },
  },
  {
    eyebrow: 'Coleção Nomad Society',
    title: 'Edições raras para colecionadores',
    body: 'Edições 1/1, 1/10 e 1/50 com procedência registrada na rede e direitos autorais para quem cria.',
    image: {
      src: '/images/nfts/sage-nomad-800.webp',
      alt: 'Gorila ilustrado de chapéu bucket verde e moletom lilás',
      width: 800,
      height: 800,
    },
  },
  {
    eyebrow: 'Golden Frequencies',
    title: 'Música e arte em um só token',
    body: 'Colecione retratos sonoros on-chain e desbloqueie faixas exclusivas dos artistas.',
    image: {
      src: '/images/nfts/golden-beat-800.webp',
      alt: 'Orangotango ilustrado com fones de ouvido verdes',
      width: 800,
      height: 800,
    },
  },
] as const

export function Hero() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index] ?? SLIDES[0]

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      className="relative overflow-hidden rounded-2xl bg-surface-card md:min-h-[450px] md:rounded-3xl"
    >
      <div className="grid grid-cols-1 items-center gap-4 p-4 pb-8 md:grid-cols-[1fr_minmax(0,450px)] md:gap-10 md:py-0 md:pr-0 md:pl-10">
        <div className="flex flex-col gap-2 md:max-w-[600px] md:gap-6 md:py-11" aria-live="polite">
          <div className="flex flex-col gap-1.5 md:gap-2">
            <p className="text-caption font-medium text-text-primary md:text-body">{slide.eyebrow}</p>
            <h1 className="text-body-lg leading-6 font-bold text-text-primary uppercase md:text-display md:leading-[70px]">
              {slide.title}
            </h1>
            <p className="line-clamp-3 max-w-[557px] text-caption leading-[18px] text-text-secondary md:line-clamp-none md:text-body md:leading-6">
              {slide.body}
            </p>
          </div>
          <Link
            to="/"
            hash="catalogo"
            className="inline-flex w-fit items-center gap-1 text-caption font-bold text-text-accent uppercase md:h-10 md:w-[140px] md:justify-center md:rounded-md md:bg-primary md:text-body md:text-ink md:hover:bg-text-accent"
          >
            Explorar <ArrowRightIcon aria-hidden="true" className="size-3.5 md:hidden" />
          </Link>
        </div>
        <div className="order-first md:order-2">
          {/* Mobile: wide crop on top (the LCP element); desktop: square art as in Figma. */}
          <NftImage
            image={slide.image}
            sizes="(min-width: 768px) 450px, 92vw"
            priority
            className="aspect-[16/10] rounded-2xl object-[50%_35%] md:aspect-square md:rounded-3xl"
          />
        </div>
      </div>
      <div
        role="group"
        aria-label="Escolher destaque"
        className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 md:bottom-12 md:left-[560px] md:translate-x-0 md:gap-2"
      >
        {SLIDES.map((item, i) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Destaque ${i + 1} de ${SLIDES.length}`}
            aria-current={i === index}
            className={cn(
              'size-2 rounded-full transition-colors',
              i === index ? 'bg-primary' : 'bg-secondary/50 hover:bg-secondary',
            )}
          />
        ))}
      </div>
    </section>
  )
}
