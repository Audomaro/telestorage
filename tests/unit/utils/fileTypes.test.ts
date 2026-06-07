import { describe, it, expect } from 'vitest'
import { isMedia, isDocument, fileTypeLabel } from '../../../src/utils/fileTypes'

describe('isMedia', () => {
  it('should return true for image/jpeg', () => {
    expect(isMedia('image/jpeg')).toBe(true)
  })

  it('should return true for video/mp4', () => {
    expect(isMedia('video/mp4')).toBe(true)
  })

  it('should return false for application/pdf', () => {
    expect(isMedia('application/pdf')).toBe(false)
  })
})

describe('isDocument', () => {
  it('should return true for application/pdf', () => {
    expect(isDocument('application/pdf')).toBe(true)
  })

  it('should return false for image/jpeg', () => {
    expect(isDocument('image/jpeg')).toBe(false)
  })
})

describe('fileTypeLabel', () => {
  it('should return 🖼️ for images', () => {
    expect(fileTypeLabel('image/jpeg')).toBe('🖼️')
  })

  it('should return 🎬 for videos', () => {
    expect(fileTypeLabel('video/mp4')).toBe('🎬')
  })

  it('should return 📄 for documents', () => {
    expect(fileTypeLabel('application/pdf')).toBe('📄')
  })

  it('should return 📦 for unknown', () => {
    expect(fileTypeLabel('application/octet-stream')).toBe('📦')
  })
})
