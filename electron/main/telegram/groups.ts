import { getClient } from './auth'

export interface GroupResult {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  fileCount: number
  totalSize: number
}

export async function getGroups(): Promise<GroupResult[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const dialogs = await client.getDialogs({ archived: false, limit: 200 })

  return dialogs
    .filter(d => d.isGroup || d.isChannel)
    .map(d => ({
      id: Number(d.id),
      title: d.title || 'Unnamed',
      isArchived: false,
      isOwner: d.entity && 'creator' in d.entity ? Boolean((d.entity as any).creator) : false,
      fileCount: 0,
      totalSize: 0
    }))
}

export async function getArchivedGroups(): Promise<GroupResult[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const dialogs = await client.getDialogs({ archived: true, limit: 200 })

  return dialogs
    .filter(d => d.isGroup || d.isChannel)
    .map(d => ({
      id: Number(d.id),
      title: d.title || 'Unnamed',
      isArchived: true,
      isOwner: d.entity && 'creator' in d.entity ? Boolean((d.entity as any).creator) : false,
      fileCount: 0,
      totalSize: 0
    }))
}

export async function createGroup(title: string): Promise<GroupResult> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const result = await client.invoke(
    new (await import('telegram')).Api.channels.CreateChannel({
      title,
      about: 'TeleDrive storage group',
      megagroup: true
    })
  )

  const updates = result as any
  const channel = updates.chats?.[0] || result
  return { id: Number(channel.id), title, isArchived: false, isOwner: true, fileCount: 0, totalSize: 0 }
}
