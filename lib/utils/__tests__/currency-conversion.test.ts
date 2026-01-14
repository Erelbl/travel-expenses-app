/**
 * Unit tests for currency conversion
 */

import { convertToBase, formatAmountForDisplay, getInverseRate } from '../currency-conversion'

describe('currency conversion', () => {
  test('convertToBase: USD(base) + EUR with rateToBase=1.1 => 10 EUR -> 11 USD', () => {
    const result = convertToBase(10, 1.1)
    expect(result).toBeCloseTo(11, 2)
  })

  test('inversion check: reciprocal rate produces different result', () => {
    const rateToBase = 1.1 // EUR to USD: 1 EUR = 1.1 USD
    const wrongRate = getInverseRate(rateToBase) // 1/1.1 ≈ 0.909
    
    const correct = convertToBase(10, rateToBase) // 10 EUR * 1.1 = 11 USD
    const incorrect = convertToBase(10, wrongRate) // 10 EUR * 0.909 ≈ 9.09 USD
    
    expect(correct).toBeCloseTo(11, 2)
    expect(incorrect).toBeCloseTo(9.09, 2)
    expect(correct).not.toBeCloseTo(incorrect, 0)
  })

  test('formatAmountForDisplay: 2 decimals for USD/EUR, 0 for JPY', () => {
    expect(formatAmountForDisplay(10.567, 'USD')).toBe('10.57')
    expect(formatAmountForDisplay(10.567, 'EUR')).toBe('10.57')
    expect(formatAmountForDisplay(1000.7, 'JPY')).toBe('1001')
    expect(formatAmountForDisplay(50000.9, 'KRW')).toBe('50001')
  })

  test('round/truncation: raw calculations keep full precision, display rounds', () => {
    const raw = convertToBase(10.123, 1.234567)
    expect(raw).toBeCloseTo(12.499, 4) // full precision
    
    const display = formatAmountForDisplay(raw, 'USD')
    expect(display).toBe('12.50') // rounded to 2 decimals
  })
})

