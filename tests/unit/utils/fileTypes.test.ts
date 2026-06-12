import { describe, it, expect } from 'vitest'
import { isMedia, isDocument, isExcludedFromMedia, fileTypeLabel } from '../../../src/utils/fileTypes'

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

describe('isExcludedFromMedia', () => {
  it('should return false when excluded list is empty', () => {
    expect(isExcludedFromMedia('file.svg', [])).toBe(false)
  })

  it('should return false when fileName is undefined', () => {
    expect(isExcludedFromMedia(undefined, ['svg'])).toBe(false)
  })

  it('should return true when extension is in excluded list', () => {
    expect(isExcludedFromMedia('file.svg', ['svg'])).toBe(true)
  })

  it('should match case-insensitively', () => {
    expect(isExcludedFromMedia('file.SVG', ['svg'])).toBe(true)
  })

  it('should return false when extension is not in excluded list', () => {
    expect(isExcludedFromMedia('file.png', ['svg'])).toBe(false)
  })
})

describe('fileTypeLabel', () => {
  it('should return "image" for images', () => {
    expect(fileTypeLabel('image/jpeg')).toBe('image')
  })

  it('should return "video" for videos', () => {
    expect(fileTypeLabel('video/mp4')).toBe('video')
  })

  it('should return "document" for documents', () => {
    expect(fileTypeLabel('application/pdf')).toBe('document')
  })

  it('should return "archive" for unknown', () => {
    expect(fileTypeLabel('application/octet-stream')).toBe('archive')
  })
})
