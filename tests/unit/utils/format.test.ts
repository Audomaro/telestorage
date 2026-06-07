import { describe, it, expect } from 'vitest'
import { formatFileSize, formatDate } from '../../../src/utils/format'

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('should format kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
  })

  it('should format gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB')
  })
})

describe('formatDate', () => {
  it('should format date as DD/MM/YYYY', () => {
    const date = new Date(2026, 5, 7)
    expect(formatDate(date)).toBe('07/06/2026')
  })
})
