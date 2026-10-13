import { z } from 'zod'
import { ethAmountSchema, idSchema, imageSchema, isoDateSchema, networkSchema } from './common'

export const categorySchema = z.enum([
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
])
export type Category = z.infer<typeof categorySchema>

export const CATEGORY_LABELS: Record<Category, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
}

export const editionIdSchema = z.enum(['1-of-1', '1-of-10', '1-of-50', 'open'])
export type EditionId = z.infer<typeof editionIdSchema>

export const editionSchema = z.object({
  id: editionIdSchema,
  label: z.string(),
  supply: z.number().int().positive().nullable(),
  available: z.number().int().min(0),
  /** Max units one collector may hold in a single order for this edition. */
  maxPerOrder: z.number().int().positive(),
})
export type Edition = z.infer<typeof editionSchema>

export const nftSummarySchema = z.object({
  id: idSchema,
  tokenId: z.string(),
  name: z.string(),
  price: ethAmountSchema,
  compareAtPrice: ethAmountSchema.nullable(),
  image: imageSchema,
  category: categorySchema,
  network: networkSchema,
  collectionName: z.string(),
  /** Total units available across all editions. */
  available: z.number().int().min(0),
  isNew: z.boolean(),
  version: z.number().int().min(1),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftAttributeSchema = z.object({ trait: z.string(), value: z.string() })

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  longDescription: z.array(z.string()),
  gallery: z.array(imageSchema).min(1),
  editions: z.array(editionSchema).min(1),
  attributes: z.array(nftAttributeSchema),
  contractAddress: z.string(),
  contractStandard: z.string(),
  royaltyPercent: z.number(),
  creatorName: z.string(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  createdAt: isoDateSchema,
  relatedIds: z.array(idSchema),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

export const catalogTabSchema = z.enum(['all', 'new', 'trending'])
export type CatalogTab = z.infer<typeof catalogTabSchema>

export const catalogSortSchema = z.enum(['recent', 'price-asc', 'price-desc', 'popular'])
export type CatalogSort = z.infer<typeof catalogSortSchema>

export const CATALOG_PAGE_SIZE = 9

/** Normalized catalog query — exactly what is sent to the API and used as the query key. */
export const catalogQuerySchema = z.object({
  q: z.string().optional(),
  categories: z.array(categorySchema).optional(),
  networks: z.array(networkSchema).optional(),
  minPrice: ethAmountSchema.optional(),
  maxPrice: ethAmountSchema.optional(),
  tab: catalogTabSchema,
  sort: catalogSortSchema,
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(48),
})
export type CatalogQuery = z.infer<typeof catalogQuerySchema>

export const facetCountSchema = z.object({ value: z.string(), count: z.number().int().min(0) })

export const catalogPageSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int(),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  facets: z.object({
    categories: z.array(facetCountSchema),
    networks: z.array(facetCountSchema),
    priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
  }),
})
export type CatalogPage = z.infer<typeof catalogPageSchema>

export const featuredSchema = z.object({
  hero: nftSummarySchema,
  spotlight: nftSummarySchema,
})
export type Featured = z.infer<typeof featuredSchema>
