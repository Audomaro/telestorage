import { getClient } from './auth'
import { getSettings, addCreatedGroupId } from './settings'

export interface GroupResult {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  totalSize: number
  isAppCreated: boolean
}

export function isGroupAppCreated(groupId: number, createdIds: number[]): boolean {
  return createdIds.includes(groupId)
}

function dialogToGroupResult(d: any, createdIds: number[]): GroupResult {
  const isArchived = (d as any).folderId === 1
  return {
    id: Number(d.id),
    title: d.title || 'Unnamed',
    isArchived,
    isOwner: d.entity && 'creator' in d.entity ? Boolean((d.entity as any).creator) : false,
    totalSize: 0,
    isAppCreated: isGroupAppCreated(Number(d.id), createdIds)
  }
}

export async function getGroups(): Promise<GroupResult[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const dialogs = await client.getDialogs({ archived: false, limit: 200 })
  const createdIds = getSettings().createdGroupIds

  return dialogs
    .filter(d => d.isGroup || d.isChannel)
    .map(d => dialogToGroupResult(d, createdIds))
}

export async function getArchivedGroups(): Promise<GroupResult[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const dialogs = await client.getDialogs({ archived: true, limit: 200 })
  const createdIds = getSettings().createdGroupIds

  return dialogs
    .filter(d => d.isGroup || d.isChannel)
    .map(d => dialogToGroupResult(d, createdIds))
}

export async function createGroup(title: string): Promise<GroupResult> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const result = await client.invoke(
    new (await import('telegram')).Api.channels.CreateChannel({
      title,
      about: 'TeleStorage storage group',
      megagroup: true
    })
  )

  const updates = result as any
  const channel = updates.chats?.[0] || result
  const dialogId = Number(`-${100}${BigInt(channel.id)}`)
  addCreatedGroupId(dialogId)
  return { id: dialogId, title, isArchived: false, isOwner: true, totalSize: 0, isAppCreated: true }
}

export async function deleteGroup(groupId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  await client.invoke(
    new (await import('telegram')).Api.channels.DeleteChannel({ channel: channelId })
  )
}
