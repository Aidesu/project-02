import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, formatPercent, formatUptime } from './format'

describe('formatBytes', () => {
  it('formats sizes across units', () => {
    expect(formatBytes(0)).toBe('0 o')
    expect(formatBytes(512)).toBe('512 o')
    expect(formatBytes(1023)).toBe('1023 o')
    expect(formatBytes(1024)).toBe('1 Ko')
    expect(formatBytes(1_610_612_736)).toBe('1.5 Go')
  })
  it('returns a dash for invalid input', () => {
    expect(formatBytes(undefined)).toBe('—')
    expect(formatBytes(Number.NaN)).toBe('—')
  })
})

describe('formatDate', () => {
  it('returns the raw input for an invalid date', () => {
    expect(formatDate('pas-une-date')).toBe('pas-une-date')
  })
  it('formats a valid ISO date in French', () => {
    expect(formatDate('2026-03-01')).toMatch(/2026/)
  })
})

describe('formatUptime', () => {
  it('handles minutes, hours and days', () => {
    expect(formatUptime(0)).toBe('—')
    expect(formatUptime(undefined)).toBe('—')
    expect(formatUptime(90)).toBe('1 min')
    expect(formatUptime(3661)).toBe('1 h 1 min')
    expect(formatUptime(90_000)).toBe('1 j 1 h')
  })
})

describe('formatPercent', () => {
  it('rounds a fraction to a percent', () => {
    expect(formatPercent(0.5)).toBe('50 %')
    expect(formatPercent(1)).toBe('100 %')
    expect(formatPercent(undefined)).toBe('—')
  })
})
