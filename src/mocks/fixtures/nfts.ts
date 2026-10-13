import type { Category, EditionId, Network } from '@/shared/contracts'
import type { NftRecord } from '../db/types'

/**
 * Deterministic NFT catalog (48 items). The first nine mirror the Figma home grid
 * so the default sort ("recent") renders exactly what the design shows.
 */

type ArtworkKey = 'emerald-ape' | 'sage-nomad' | 'ivory-baron' | 'golden-beat'

const ARTWORK_ALT: Record<ArtworkKey, string> = {
  'emerald-ape': 'Macaco ilustrado de óculos escuros redondos e jaqueta college verde',
  'sage-nomad': 'Gorila ilustrado de chapéu bucket verde e moletom lilás',
  'ivory-baron': 'Gorila ilustrado de terno creme e gola alta verde-escura',
  'golden-beat': 'Orangotango ilustrado com fones de ouvido verdes e jaqueta creme',
}

export function artworkImage(key: ArtworkKey, name: string) {
  return {
    src: `/images/nfts/${key}.webp`,
    alt: `${name}: ${ARTWORK_ALT[key]}`,
    width: 800,
    height: 800,
  }
}

interface Seed {
  name: string
  number: string
  artwork: ArtworkKey
  price: string
  compareAtPrice?: string
  category: Category
  network: Network
  collection: string
}

const FIGMA_GRID: Seed[] = [
  {
    name: 'Emerald Ape',
    number: '042',
    artwork: 'emerald-ape',
    price: '1.19',
    category: 'digital-art',
    network: 'ethereum',
    collection: 'Kurio Apes',
  },
  {
    name: 'Sage Nomad',
    number: '089',
    artwork: 'sage-nomad',
    price: '1.69',
    category: 'digital-art',
    network: 'ethereum',
    collection: 'Nomad Society',
  },
  {
    name: 'Neon Vessel',
    number: '552',
    artwork: 'ivory-baron',
    price: '1.99',
    compareAtPrice: '2.29',
    category: 'generative',
    network: 'polygon',
    collection: 'Vessel Club',
  },
  {
    name: 'Cosmic Bloom',
    number: '118',
    artwork: 'sage-nomad',
    price: '1.29',
    category: '3d-art',
    network: 'ethereum',
    collection: 'Nomad Society',
  },
  {
    name: 'Violet Nomad',
    number: '314',
    artwork: 'sage-nomad',
    price: '1.39',
    category: 'collectibles',
    network: 'polygon',
    collection: 'Nomad Society',
  },
  {
    name: 'Ivory Baron',
    number: '088',
    artwork: 'ivory-baron',
    price: '1.79',
    category: 'photography',
    network: 'ethereum',
    collection: 'Baron Estate',
  },
  {
    name: 'Golden Beat',
    number: '207',
    artwork: 'golden-beat',
    price: '0.99',
    category: 'music',
    network: 'solana',
    collection: 'Golden Frequencies',
  },
  {
    name: 'Golden Pulse',
    number: '233',
    artwork: 'golden-beat',
    price: '0.89',
    category: 'music',
    network: 'solana',
    collection: 'Golden Frequencies',
  },
  {
    name: 'Golden Signal',
    number: '160',
    artwork: 'golden-beat',
    price: '0.39',
    category: 'music',
    network: 'polygon',
    collection: 'Golden Frequencies',
  },
]

const ADJECTIVES = [
  'Amber',
  'Obsidian',
  'Lunar',
  'Copper',
  'Velvet',
  'Crimson',
  'Solar',
  'Midnight',
  'Jade',
  'Rustic',
  'Silent',
  'Ember',
  'Static',
]
const NOUNS = [
  'Ape',
  'Nomad',
  'Baron',
  'Beat',
  'Monk',
  'Drifter',
  'Echo',
  'Regent',
  'Pilot',
  'Sage',
  'Rider',
  'Herald',
  'Loop',
]
const CATEGORIES: Category[] = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
]
const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']
const ARTWORKS: ArtworkKey[] = ['emerald-ape', 'sage-nomad', 'ivory-baron', 'golden-beat']
const COLLECTIONS: Record<ArtworkKey, string> = {
  'emerald-ape': 'Kurio Apes',
  'sage-nomad': 'Nomad Society',
  'ivory-baron': 'Baron Estate',
  'golden-beat': 'Golden Frequencies',
}

function generatedSeeds(): Seed[] {
  const seeds: Seed[] = []
  for (let i = 0; i < 39; i++) {
    const artwork = ARTWORKS[i % ARTWORKS.length] as ArtworkKey
    // Prices between 0.05 and 12.30 ETH, deterministic and well spread for range filters.
    const cents = 5 + ((i * 317) % 1226)
    const price = (cents / 100).toFixed(2)
    const hasDiscount = i % 7 === 3
    seeds.push({
      name: `${ADJECTIVES[i % ADJECTIVES.length]} ${NOUNS[(i * 5) % NOUNS.length]}`,
      number: String(400 + ((i * 37) % 599)).padStart(3, '0'),
      artwork,
      price,
      ...(hasDiscount && { compareAtPrice: ((cents + 35) / 100).toFixed(2) }),
      category: CATEGORIES[(i * 4 + 1) % CATEGORIES.length] as Category,
      network: NETWORKS[(i * 2 + 1) % NETWORKS.length] as Network,
      collection: COLLECTIONS[artwork],
    })
  }
  return seeds
}

function editionsFor(index: number) {
  const soldOutOneOfOne = index % 5 === 4
  return [
    {
      id: '1-of-1' as EditionId,
      label: '1/1',
      supply: 1,
      available: soldOutOneOfOne ? 0 : 1,
      maxPerOrder: 1,
    },
    { id: '1-of-10' as EditionId, label: '1/10', supply: 10, available: 4 + (index % 6), maxPerOrder: 5 },
    { id: '1-of-50' as EditionId, label: '1/50', supply: 50, available: 20 + (index % 25), maxPerOrder: 10 },
    { id: 'open' as EditionId, label: 'Aberta', supply: null, available: 999, maxPerOrder: 20 },
  ]
}

/** Fixed reference date so "recent" ordering and receipts are stable across runs. */
export const CATALOG_EPOCH = Date.UTC(2026, 8, 30, 12, 0, 0)

export function buildNftFixtures(): NftRecord[] {
  const seeds = [...FIGMA_GRID, ...generatedSeeds()]
  const ids = seeds.map((_, index) => `nft-${String(index + 1).padStart(3, '0')}`)

  return seeds.map((seed, index) => {
    const name = `${seed.name} #${seed.number}`
    const image = artworkImage(seed.artwork, name)
    const editions = editionsFor(index)
    const available = editions.reduce((sum, edition) => sum + edition.available, 0)
    const related = ids.filter((id) => id !== ids[index]).slice(index % 8, (index % 8) + 5)

    return {
      id: ids[index] as string,
      tokenId: `#${seed.number.padStart(4, '0')}`,
      name,
      price: seed.price,
      compareAtPrice: seed.compareAtPrice ?? null,
      image,
      category: seed.category,
      network: seed.network,
      collectionName: seed.collection,
      available,
      isNew: index % 3 === 0,
      version: 1,
      description: `Um colecionável digital finalizado à mão da coleção ${seed.collection}, verificado na rede e com arte desbloqueável para colecionadores.`,
      longDescription: [
        `${name} é uma obra digital da coleção ${seed.collection}. Cada atributo fica armazenado nos metadados do token e é verificado on-chain. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
        'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrado na rede. O criador recebe direitos autorais nas vendas secundárias, apoiando novos trabalhos da comunidade.',
      ],
      gallery: [image, image, image, image],
      editions,
      attributes: [
        { trait: 'Fundo', value: index % 2 === 0 ? 'Creme' : 'Menta' },
        { trait: 'Raridade', value: index % 4 === 0 ? 'Raro' : 'Comum' },
      ],
      contractAddress: `0x7A42${String(index).padStart(2, '0')}c3e19E8a0b5d6F1e2C9a4B7d3E0f8A1${String(index % 10)}`,
      contractStandard: seed.network === 'solana' ? 'Metaplex' : 'ERC-721',
      royaltyPercent: 5,
      creatorName: index % 2 === 0 ? 'Nova Sato' : 'Íris Moreau',
      rating: 4 + (index % 10) / 10,
      reviewCount: 5 + ((index * 7) % 30),
      createdAt: new Date(CATALOG_EPOCH - index * 6 * 3_600_000).toISOString(),
      relatedIds: related,
      popularity: (index * 53) % 100,
    }
  })
}
