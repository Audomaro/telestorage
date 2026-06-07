export interface TelegramUser {
  id: number
  firstName: string
  lastName?: string
  username?: string
  phone?: string
}

export interface TelegramGroup {
  id: number
  title: string
  type: string
}

export interface TelegramFile {
  id: string
  name: string
  size: number
  mimeType: string
  date: Date
  from?: TelegramUser | TelegramGroup
}

export type ViewMode = 'list' | 'grid'

export interface FileFilter {
  type?: string
  mimeType?: string
  dateFrom?: Date
  dateTo?: Date
  minSize?: number
  maxSize?: number
}

export type AuthStep = 'phone' | 'code' | 'password' | 'done'
