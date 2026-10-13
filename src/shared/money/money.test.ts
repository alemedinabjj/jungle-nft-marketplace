import { describe, expect, it } from 'vitest'
import {
  addEth,
  compareEth,
  formatEth,
  isEthAmount,
  multiplyEth,
  parseEth,
  percentOfEth,
  subtractEth,
  sumEth,
  toEthString,
} from './money'

describe('money (ETH as decimal strings)', () => {
  it('validates decimal strings and rejects numbers-as-strings that are not money', () => {
    expect(isEthAmount('1.19')).toBe(true)
    expect(isEthAmount('0')).toBe(true)
    expect(isEthAmount('0.000000000000000001')).toBe(true)
    expect(isEthAmount('-1')).toBe(false)
    expect(isEthAmount('1e3')).toBe(false)
    expect(isEthAmount('1.0000000000000000001')).toBe(false)
    expect(isEthAmount('abc')).toBe(false)
  })

  it('avoids floating point errors', () => {
    expect(addEth('0.1', '0.2')).toBe('0.3')
    expect(multiplyEth('1.19', 3)).toBe('3.57')
    expect(sumEth(['2.38', '8.34', '16.11'])).toBe('26.83')
    expect(subtractEth('26.846', '0.016')).toBe('26.83')
  })

  it('keeps 18 decimals of precision and strips trailing zeros', () => {
    expect(addEth('0.000000000000000001', '1')).toBe('1.000000000000000001')
    expect(toEthString(parseEth('1.500'))).toBe('1.5')
  })

  it('computes percentages rounded down to wei', () => {
    expect(percentOfEth('26.83', 10)).toBe('2.683')
    expect(percentOfEth('0.000000000000000003', 50)).toBe('0.000000000000000001')
  })

  it('rejects fractional or negative quantities', () => {
    expect(() => multiplyEth('1', 1.5)).toThrow()
    expect(() => multiplyEth('1', -1)).toThrow()
  })

  it('compares amounts', () => {
    expect(compareEth('1.10', '1.1')).toBe(0)
    expect(compareEth('2', '1.99')).toBe(1)
    expect(compareEth('0.5', '1')).toBe(-1)
  })

  it('formats for display without losing meaningful digits', () => {
    expect(formatEth('1.19')).toBe('1.19 ETH')
    expect(formatEth('26.846')).toBe('26.846 ETH')
    expect(formatEth('0')).toBe('0.00 ETH')
    expect(formatEth('2')).toBe('2.00 ETH')
    expect(formatEth('0.016', { symbol: false })).toBe('0.016')
  })
})

describe('slider step helpers', () => {
  it('converts between ETH strings and integer steps', async () => {
    const { ethToSteps, stepsToEth } = await import('./money')
    expect(ethToSteps('12.305')).toBe(1230)
    expect(ethToSteps('12.301', 2, 'up')).toBe(1231)
    expect(stepsToEth(1230)).toBe('12.3')
    expect(stepsToEth(2)).toBe('0.02')
  })
})
