import type { Quote } from '@/shared/contracts'
import { compareEth, formatEth } from '@/shared/money'

/** A reviewed quote is stale when the server's current fingerprint differs. */
export function isQuoteStale(reviewed: Quote | null, current: Quote): boolean {
  return reviewed === null || reviewed.fingerprint !== current.fingerprint
}

/** Human-readable list of what changed between two quotes (for the re-confirmation prompt). */
export function describeQuoteChanges(previous: Quote, next: Quote, names: Record<string, string>): string[] {
  const changes: string[] = []
  for (const line of next.lines) {
    const before = previous.lines.find(
      (candidate) => candidate.nftId === line.nftId && candidate.editionId === line.editionId,
    )
    const name = names[line.nftId] ?? line.nftId
    if (before && compareEth(before.unitPrice, line.unitPrice) !== 0) {
      changes.push(`${name}: preço de ${formatEth(before.unitPrice)} para ${formatEth(line.unitPrice)}`)
    }
    if (before && before.quantity !== line.quantity)
      changes.push(`${name}: quantidade de ${before.quantity} para ${line.quantity}`)
  }
  for (const issue of next.issues) {
    if (
      !previous.issues.some((candidate) => candidate.nftId === issue.nftId && candidate.kind === issue.kind)
    )
      changes.push(issue.message)
  }
  if (compareEth(previous.networkFee, next.networkFee) !== 0) {
    changes.push(`Taxa de rede: de ${formatEth(previous.networkFee)} para ${formatEth(next.networkFee)}`)
  }
  if (compareEth(previous.discount, next.discount) !== 0) {
    changes.push(`Desconto: de ${formatEth(previous.discount)} para ${formatEth(next.discount)}`)
  }
  if (compareEth(previous.total, next.total) !== 0) {
    changes.push(`Total: de ${formatEth(previous.total)} para ${formatEth(next.total)}`)
  }
  return changes
}

/** The order can only be confirmed on a clean quote. */
export function canConfirm(quote: Quote): boolean {
  return (
    quote.lines.length > 0 &&
    quote.issues.length === 0 &&
    (quote.coupon === null || quote.coupon.status === 'applied')
  )
}
