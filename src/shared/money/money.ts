import Decimal from 'decimal.js'

/**
 * ETH travels across the app as a decimal string (e.g. "1.19").
 * All arithmetic goes through decimal.js — never `number` — so prices,
 * discounts and totals are exact to the wei (18 decimals).
 * See docs/adr/0002-money-as-decimal-strings.md.
 */
export type EthAmount = string

export const ETH_DECIMALS = 18
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

const D = Decimal.clone({ precision: 64, rounding: Decimal.ROUND_DOWN })

export function isEthAmount(value: string): value is EthAmount {
  return ETH_PATTERN.test(value)
}

export function parseEth(value: EthAmount): Decimal {
  if (!isEthAmount(value)) throw new Error(`Invalid ETH amount: "${String(value)}"`)
  return new D(value)
}

export function toEthString(value: Decimal): EthAmount {
  if (value.isNegative()) throw new Error('ETH amounts cannot be negative')
  return value.toDecimalPlaces(ETH_DECIMALS, D.ROUND_DOWN).toFixed()
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Quantity must be a non-negative integer, got ${quantity}`)
  }
}

export function addEth(a: EthAmount, b: EthAmount): EthAmount {
  return toEthString(parseEth(a).plus(parseEth(b)))
}

export function subtractEth(a: EthAmount, b: EthAmount): EthAmount {
  return toEthString(parseEth(a).minus(parseEth(b)))
}

export function multiplyEth(amount: EthAmount, quantity: number): EthAmount {
  assertQuantity(quantity)
  return toEthString(parseEth(amount).times(quantity))
}

export function sumEth(amounts: readonly EthAmount[]): EthAmount {
  return toEthString(amounts.reduce((total, amount) => total.plus(parseEth(amount)), new D(0)))
}

/** `percent` is an integer or decimal percentage (10 → 10%). Rounds down to the wei. */
export function percentOfEth(amount: EthAmount, percent: number): EthAmount {
  return toEthString(parseEth(amount).times(percent).dividedBy(100))
}

export function minEth(a: EthAmount, b: EthAmount): EthAmount {
  return compareEth(a, b) <= 0 ? a : b
}

export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  const result = parseEth(a).comparedTo(parseEth(b))
  return result < 0 ? -1 : result > 0 ? 1 : 0
}

export function isZeroEth(amount: EthAmount): boolean {
  return parseEth(amount).isZero()
}

interface FormatOptions {
  /** Append the " ETH" suffix (default true). */
  symbol?: boolean
}

/** Display format: at least 2 decimals, never drops meaningful digits. */
export function formatEth(amount: EthAmount, { symbol = true }: FormatOptions = {}): string {
  const value = parseEth(amount)
  const decimals = Math.max(2, value.decimalPlaces())
  const text = value.toFixed(decimals)
  return symbol ? `${text} ETH` : text
}
