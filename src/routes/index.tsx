import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'Kurio — Marketplace de NFTs' }],
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto max-w-content px-6 py-24">
      <h1 className="text-display leading-[70px] font-bold">Kurio</h1>
      <p className="mt-4 text-body-lg text-text-secondary">Marketplace de NFTs — em construção.</p>
    </main>
  )
}
