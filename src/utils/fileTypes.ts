export function isMedia(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType.startsWith('video/')
}

export function isDocument(mimeType: string): boolean {
  return /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument|application\/vnd\.ms-excel|text\/plain|application\/zip|application\/x-rar|application\/x-7z-compressed)/.test(mimeType)
}

export function isExcludedFromMedia(fileName: string | undefined, excludedExtensions: string[]): boolean {
  if (!fileName || excludedExtensions.length === 0) return false
  const dot = fileName.lastIndexOf('.')
  if (dot === -1) return false
  return excludedExtensions.includes(fileName.slice(dot + 1).toLowerCase())
}

export function fileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
  return 'archive'
}
