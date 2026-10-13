import { z } from 'zod'
import { idSchema } from './common'

export const favoritesSchema = z.object({ nftIds: z.array(idSchema) })
export type Favorites = z.infer<typeof favoritesSchema>
