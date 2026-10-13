import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Same handlers, used by Vitest integration tests. */
export const server = setupServer(...handlers)
