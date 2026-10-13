/**
 * Deterministic scenarios. Select with `?scenario=<id>` (persisted in
 * localStorage), from the dev panel, or `window.__kurioMocks.setScenario(id)`.
 */
export type EndpointGroup =
  'catalog' | 'detail' | 'auth' | 'favorites' | 'cart' | 'quote' | 'orders' | 'profile' | 'wallets'

export type FailureKind = 'network' | 'server' | 'flaky' | 'forbidden'

export interface ScenarioDefinition {
  id: string
  label: string
  description: string
  /** Fixed latency (ms) or a deterministic sequence cycled per request. */
  latency: number | readonly number[]
  /** Catalog requests resolve in reverse order (later request = faster). */
  outOfOrder?: boolean
  failures?: Partial<Record<EndpointGroup, FailureKind>>
  emptyCatalog?: boolean
  sessionTtlMs?: number
  checkout?: 'price-change' | 'sold-out' | 'timeout-after-create' | 'payment-rejected'
  forceValidationError?: boolean
  walletConnection?: 'rejected'
}

export const DEFAULT_SESSION_TTL_MS = 7 * 24 * 3_600_000

export const SCENARIOS = [
  {
    id: 'default',
    label: 'Sucesso (padrão)',
    description: 'Latência baixa e tudo funcionando; pagamento confirmado.',
    latency: 120,
  },
  {
    id: 'empty-catalog',
    label: 'Catálogo vazio',
    description: 'Nenhum NFT cadastrado.',
    latency: 120,
    emptyCatalog: true,
  },
  {
    id: 'slow',
    label: 'Latência alta',
    description: 'Respostas entre 1,5 s e 2,5 s (skeletons visíveis).',
    latency: [1500, 2500, 1800, 2200],
  },
  {
    id: 'out-of-order',
    label: 'Respostas fora de ordem',
    description: 'Buscas antigas respondem depois das novas.',
    latency: 120,
    outOfOrder: true,
  },
  {
    id: 'network-error',
    label: 'Falha de conexão',
    description: 'Catálogo e detalhe sem rede.',
    latency: 120,
    failures: { catalog: 'network', detail: 'network' },
  },
  {
    id: 'server-error',
    label: 'Erro 5xx',
    description: 'Catálogo, detalhe e carrinho respondem 500.',
    latency: 120,
    failures: { catalog: 'server', detail: 'server', cart: 'server' },
  },
  {
    id: 'flaky',
    label: 'Instável (falha e recupera)',
    description: 'A primeira chamada de cada endpoint falha com 503; a nova tentativa funciona.',
    latency: [900, 900],
    failures: { catalog: 'flaky', detail: 'flaky', cart: 'flaky' },
  },
  {
    id: 'session-expired',
    label: 'Sessão expira',
    description: 'Sessões duram 60 s.',
    latency: 120,
    sessionTtlMs: 60_000,
  },
  {
    id: 'forbidden',
    label: 'Acesso não autorizado',
    description: 'Perfil e carteiras respondem 403.',
    latency: 120,
    failures: { profile: 'forbidden', wallets: 'forbidden' },
  },
  {
    id: 'validation-error',
    label: 'Erro de validação (servidor)',
    description: 'Cadastro e perfil respondem 422 com erros por campo.',
    latency: 120,
    forceValidationError: true,
  },
  {
    id: 'favorites-failure',
    label: 'Favoritos falham',
    description: 'Inclusão e remoção de favoritos respondem 500 após 1 s (rollback visível).',
    latency: 1000,
    failures: { favorites: 'server' },
  },
  {
    id: 'price-change',
    label: 'Preço muda na compra',
    description: 'Ao confirmar, o preço de um item sobe e a cotação fica obsoleta.',
    latency: 120,
    checkout: 'price-change',
  },
  {
    id: 'sold-out',
    label: 'Edição esgota na compra',
    description: 'Ao confirmar, uma edição do carrinho esgota.',
    latency: 120,
    checkout: 'sold-out',
  },
  {
    id: 'order-timeout',
    label: 'Timeout após criar pedido',
    description: 'O pedido é criado, mas a resposta demora mais que o timeout do cliente.',
    latency: 120,
    checkout: 'timeout-after-create',
  },
  {
    id: 'payment-rejected',
    label: 'Pagamento recusado',
    description: 'O pedido termina recusado.',
    latency: 120,
    checkout: 'payment-rejected',
  },
  {
    id: 'wallet-rejected',
    label: 'Carteira recusa conexão',
    description: 'A conexão simulada da carteira é recusada.',
    latency: 120,
    walletConnection: 'rejected',
  },
] as const satisfies readonly ScenarioDefinition[]

export type ScenarioId = (typeof SCENARIOS)[number]['id']

export function findScenario(id: string | null | undefined): ScenarioDefinition | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id)
}
