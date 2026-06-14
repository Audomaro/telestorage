import { getClient } from './auth'
import { getSettings, addCreatedGroupId } from './settings'

export interface GroupResult {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  totalSize: number
  isAppCreated: boolean
  isForum?: boolean
}

export interface ForumTopicResult {
  id: number
  title: string
  iconColor: number
  iconEmojiId?: string
  totalSize: number
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
    isAppCreated: isGroupAppCreated(Number(d.id), createdIds),
    isForum: (d as any).entity?.forum || false
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

export async function createGroup(title: string, isForum = false): Promise<GroupResult> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const result = await client.invoke(
    new (await import('telegram')).Api.channels.CreateChannel({
      title,
      about: 'TeleStorage storage group',
      megagroup: true,
      ...(isForum ? { forum: true } : {}),
    })
  )

  const updates = result as any
  const channel = updates.chats?.[0] || result
  const dialogId = Number(`-${100}${BigInt(channel.id)}`)
  addCreatedGroupId(dialogId)
  return { id: dialogId, title, isArchived: false, isOwner: true, totalSize: 0, isAppCreated: true, isForum }
}

export async function getForumTopics(groupId: number): Promise<ForumTopicResult[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  const result = await client.invoke(
    new (await import('telegram')).Api.channels.GetForumTopics({
      channel: channelId,
      limit: 100,
    })
  ) as any

  const topics = result.topics || []
  return topics.map((t: any) => ({
    id: t.id,
    groupId,
    title: t.title || 'Unnamed',
    iconColor: t.iconColor || 0,
    iconEmojiId: t.iconEmojiId?.toString(),
    totalSize: 0,
  }))
}

export async function deleteGroup(groupId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const entityId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  const entity = await client.getEntity(String(entityId)) as any
  if (entity?.className === 'Chat') {
    await client.invoke(
      new (await import('telegram')).Api.messages.DeleteChat({ chatId: entityId as any })
    )
  } else {
    await client.invoke(
      new (await import('telegram')).Api.channels.DeleteChannel({ channel: entityId })
    )
  }
}

export async function renameGroup(groupId: number, newTitle: string): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  await client.invoke(
    new (await import('telegram')).Api.channels.EditTitle({
      channel: channelId,
      title: newTitle,
    })
  )
}

export async function renameForumTopic(groupId: number, topicId: number, newTitle: string): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  await client.invoke(
    new (await import('telegram')).Api.channels.EditForumTopic({
      channel: channelId,
      topicId,
      title: newTitle,
    })
  )
}

export async function createForumTopic(groupId: number, title: string): Promise<{ id: number; title: string }> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  const result = await client.invoke(
    new (await import('telegram')).Api.channels.CreateForumTopic({
      channel: channelId,
      title,
      randomId: BigInt(Date.now()),
    })
  ) as any

  let topicId = 0
  for (const update of result.updates || []) {
    if (update.message?.id) {
      topicId = update.message.id
      break
    }
  }

  return { id: topicId, title }
}

export async function deleteForumTopic(groupId: number, topicId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const str = String(groupId)
  const channelId = str.startsWith('-100') ? BigInt(str.slice(4)) : BigInt(str.slice(1))

  await client.invoke(
    new (await import('telegram')).Api.channels.DeleteTopicHistory({
      channel: channelId,
      topMsgId: topicId,
    })
  )
}
