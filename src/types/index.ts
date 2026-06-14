export interface TelegramUser {
  id: number
  phone: string
  username?: string
  firstName?: string
  lastName?: string
}

export interface ForumTopic {
  id: number
  groupId: number
  title: string
  iconColor: number
  iconEmojiId?: string
  totalSize?: number
}

export interface TelegramGroup {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  isAppCreated?: boolean
  isForum?: boolean
  totalSize?: number
}

export interface TelegramFile {
  id: number
  messageId: number
  name: string
  size: number
  mimeType: string
  date: Date
  groupId: number
  thumbnail?: string
}

export type ViewMode = 'list' | 'gallery'
export type FileFilter = 'all' | 'media' | 'documents'
export type SortField = 'name' | 'size' | 'date' | 'type'
export type SortDirection = 'asc' | 'desc'
export type AuthStep = 'phone' | 'code' | '2fa' | 'done'
