import { getClient } from './auth'

export interface FileResult {
  id: number
  messageId: number
  name: string
  size: number
  mimeType: string
  date: Date
  groupId: number
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
        const lastSize = sizes[sizes.length - 1]
        size = lastSize?.size || 0
      }

      return { id: m.id, messageId: m.id, name, size, mimeType, date: new Date(m.date * 1000), groupId }
    })
}

export async function uploadFile(groupId: number, filePath: string): Promise<{ messageId: number }> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const result = await client.sendFile(groupId, { file: filePath })
  return { messageId: result.id }
}

export async function downloadFile(groupId: number, messageId: number, destPath: string): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { ids: messageId })
  if (messages.length === 0) throw new Error('Message not found')

  const media = messages[0].media
  if (!media) throw new Error('No media in message')

  await client.downloadMedia(media, { outputFile: destPath })
}

export async function deleteFile(groupId: number, messageId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  await client.deleteMessages(groupId, [messageId], { revoke: true })
}

export async function forwardFile(fromGroupId: number, toGroupId: number, messageId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  await client.forwardMessages(toGroupId, { messages: [messageId], fromPeer: fromGroupId })
}
