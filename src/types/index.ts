export interface TelegramUser {
  id: number
  phone: string
  username?: string
  firstName?: string
  lastName?: string
}

export interface TelegramGroup {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  isAppCreated?: boolean
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
export type AuthStep = 'phone' | 'code' | '2fa' | 'done'
