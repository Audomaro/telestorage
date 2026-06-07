const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
const VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mkv', 'video/webm', 'video/quicktime']
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
]

export function isMedia(mimeType: string): boolean {
  return IMAGE_TYPES.includes(mimeType) || VIDEO_TYPES.includes(mimeType)
}

export function isDocument(mimeType: string): boolean {
  return DOCUMENT_TYPES.includes(mimeType)
}

export function fileTypeLabel(mimeType: string): string {
  if (IMAGE_TYPES.includes(mimeType)) return '🖼️'
  if (VIDEO_TYPES.includes(mimeType)) return '🎬'
  if (DOCUMENT_TYPES.includes(mimeType)) return '📄'
  return '📦'
}
