import { getClient } from './auth'
import { mkdir } from 'fs/promises'
import { dirname } from 'path'

const JPEG_HEADER = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
  0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
  0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32
])

function reconstructStrippedThumb(bytes: Buffer): Buffer | null {
  try {
    if (bytes.length === 0) return null
    const headerLen = Math.min(bytes[0], JPEG_HEADER.length)
    const prefix = JPEG_HEADER.subarray(0, headerLen)
    const rest = bytes.subarray(1)
    return Buffer.concat([prefix, rest])
  } catch {
    return null
  }
}

function isStrippedSize(s: any): boolean {
  const name = s?.className || s?._
  return name === 'PhotoStrippedSize' || name === 'photoStrippedSize'
}

const IMAGE_MAGIC: [number[], string][] = [
  [[0xFF, 0xD8, 0xFF], 'image/jpeg'],
  [[0x89, 0x50, 0x4E, 0x47], 'image/png'],
  [[0x47, 0x49, 0x46], 'image/gif'],
  [[0x52, 0x49, 0x46, 0x46], 'image/webp'],
]

function detectImageFormat(buf: Buffer): string | null {
  for (const [magic, mime] of IMAGE_MAGIC) {
    if (buf.length >= magic.length && magic.every((b, i) => buf[i] === b)) return mime
  }
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] >= 0xE0 && buf[1] <= 0xEF) return 'image/jpeg'
  return null
}

function bufferToDataUrl(buf: Buffer): string | null {
  const mime = detectImageFormat(buf)
  if (!mime) return null
  return `data:${mime};base64,${buf.toString('base64')}`
}

function toBuffer(data: any): Buffer | null {
  if (!data) return null
  return data instanceof Buffer ? data : Buffer.from(data)
}

export interface FileResult {
  id: number
  messageId: number
  name: string
  size: number
  mimeType: string
  date: Date
  groupId: number
  thumbnail: string | null
}

export function extractThumbnail(media: any): string | null {
  try {
    if (!media) return null

    if (media.photo?.sizes) {
      const sizes = Array.isArray(media.photo.sizes) ? media.photo.sizes : []

      for (const s of sizes) {
        if (!s?.bytes) continue
        const buf = toBuffer(s.bytes)
        if (!buf) continue

        if (isStrippedSize(s)) {
          const reconstructed = reconstructStrippedThumb(buf)
          if (reconstructed) {
            const url = bufferToDataUrl(reconstructed)
            if (url) return url
          }
        } else {
          const url = bufferToDataUrl(buf)
          if (url) return url
        }
      }
    }

    if (media.document?.thumbs) {
      const thumbs = Array.isArray(media.document.thumbs) ? media.document.thumbs : []

      for (const t of thumbs) {
        if (!t?.bytes) continue
        const buf = toBuffer(t.bytes)
        if (!buf) continue

        if (isStrippedSize(t)) {
          const reconstructed = reconstructStrippedThumb(buf)
          if (reconstructed) {
            const url = bufferToDataUrl(reconstructed)
            if (url) return url
          }
        }
      }
    }

    return null
  } catch {
    return null
  }
}

export async function listFiles(groupId: number): Promise<FileResult[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { limit: 200 })

  return messages
    .filter(m => m.media)
    .map(m => {
      let name = 'unknown'
      let size = 0
      let mimeType = 'application/octet-stream'

      const media = m.media as any
      if (media?.document) {
        const attrs = media.document.attributes || []
        const fileNameAttr = attrs.find((a: any) => a.className === 'DocumentAttributeFilename')
        name = fileNameAttr?.fileName || `file_${m.id}`
        size = Number(media.document.size) || 0
        mimeType = media.document.mimeType || 'application/octet-stream'
      } else if (media?.photo) {
        name = `photo_${m.id}.jpg`
        mimeType = 'image/jpeg'
        const sizes = media.photo.sizes || []
        size = sizes.reduce((max: number, s: any) => {
          const sSize = typeof s.size === 'number' ? s.size : 0
          return sSize > max ? sSize : max
        }, 0)
      }

      return {
        id: m.id, messageId: m.id, name, size, mimeType,
        date: new Date(m.date * 1000), groupId,
        thumbnail: extractThumbnail(media)
      }
    })
}

export async function uploadFile(groupId: number, filePath: string): Promise<{ messageId: number }> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  if (!filePath) throw new Error('No file path specified')

  const result = await client.sendFile(groupId, { file: filePath, forceDocument: true })
  return { messageId: result.id }
}

export async function uploadMultipleFiles(groupId: number, filePaths: string[]): Promise<{ messageId: number; name: string; error?: string }[]> {
  const results: { messageId: number; name: string; error?: string }[] = []
  for (const fp of filePaths) {
    const name = fp.split('\\').pop()?.split('/').pop() || fp
    try {
      const r = await uploadFile(groupId, fp)
      results.push({ messageId: r.messageId, name })
    } catch (err: any) {
      results.push({ messageId: 0, name, error: err.message })
    }
  }
  return results
}

export async function downloadFile(groupId: number, messageId: number, destPath: string): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { ids: messageId })
  if (messages.length === 0) throw new Error('Message not found')

  const media = messages[0].media
  if (!media) throw new Error('No media in message')

  await mkdir(dirname(destPath), { recursive: true })
  await client.downloadMedia(media, { outputFile: destPath })
}

export async function downloadFileWithProgress(
  groupId: number, messageId: number, destPath: string,
  progressCb?: (progress: number) => void
): Promise<string> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { ids: messageId })
  if (messages.length === 0) throw new Error('Message not found')

  const media = messages[0].media
  if (!media) throw new Error('No media in message')

  await mkdir(dirname(destPath), { recursive: true })

  await client.downloadMedia(media, {
    outputFile: destPath,
    progressCallback: (downloaded: any, total: any) => {
      if (progressCb && total?.toJSNumber) {
        const totalNum = total.toJSNumber()
        if (totalNum > 0) progressCb(downloaded.toJSNumber() / totalNum)
      }
    }
  })

  return destPath
}

export async function deleteFile(groupId: number, messageId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  await client.deleteMessages(groupId, [messageId], { revoke: true })
}

export async function downloadThumbnail(groupId: number, messageId: number, destPath: string): Promise<string> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { ids: messageId })
  if (messages.length === 0) throw new Error('Message not found')

  const msg = messages[0]
  if (!msg.media) throw new Error('No media in message')

  await mkdir(dirname(destPath), { recursive: true })

  await client.downloadMedia(msg.media, {
    outputFile: destPath,
    thumb: 0
  })

  return destPath
}

export async function forwardFile(fromGroupId: number, toGroupId: number, messageId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  await client.forwardMessages(toGroupId, { messages: [messageId], fromPeer: fromGroupId })
}
