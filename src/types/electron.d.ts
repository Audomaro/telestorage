interface AppSettings {
  downloadPath: string
  createdGroupIds: number[]
  batchSize: number
  defaultTab: 'created' | 'active' | 'archived'
  excludedFromMedia: string[]
  themeMode: 'light' | 'dark'
}

interface TelegramAPI {
  init(): Promise<{ initialized: boolean; error?: string }>
  sendCode(phone: string): Promise<{ codeHash: string }>
  verifyCode(phone: string, code: string, codeHash: string): Promise<{ needs2FA: boolean }>
  check2FA(password: string): Promise<void>
  getAuthState(): Promise<AuthState>
  logout(): Promise<void>
  getGroups(): Promise<any[]>
  getArchivedGroups(): Promise<any[]>
  createGroup(title: string, isForum?: boolean): Promise<any>
  deleteGroup(groupId: number): Promise<void>
  addToCreatedGroup(groupId: number): Promise<void>
  renameGroup(groupId: number, title: string): Promise<void>
  createTopic(groupId: number, title: string): Promise<{ id: number; title: string }>
  renameTopic(groupId: number, topicId: number, title: string): Promise<void>
  deleteTopic(groupId: number, topicId: number): Promise<void>
  getForumTopics(groupId: number): Promise<ForumTopic[]>
  listFiles(groupId: number): Promise<any[]>
  listFilesByTopic(groupId: number, topicId: number, limit: number, offsetId?: number, search?: string): Promise<{ files: TelegramFile[]; hasMore: boolean; nextOffsetId?: number }>
  uploadFile(groupId: number, filePath: string, topicId?: number): Promise<any>
  uploadMultipleFiles(groupId: number, filePaths: string[], topicId?: number): Promise<{ messageId: number; name: string; error?: string }[]>
  downloadFile(groupId: number, messageId: number, filePath: string): Promise<void>
  downloadFileWithProgress(groupId: number, messageId: number, destPath: string, onProgress: (p: number) => void): Promise<string>
  downloadThumbnail(groupId: number, messageId: number): Promise<string>
  downloadPreview(groupId: number, messageId: number, ext: string, onProgress: (p: number) => void): Promise<string>
  startVideoStream(groupId: number, messageId: number, mimeType: string, fileSize: number): Promise<{ streamId: string; url: string }>
  stopVideoStream(streamId: string): Promise<void>
  loadMoreFiles(groupId: number, offsetId?: number, search?: string): Promise<{ files: FileResult[]; hasMore: boolean; nextOffsetId?: number }>
  deleteFile(groupId: number, messageId: number): Promise<void>
  getSettings(): Promise<AppSettings>
  setSettings(s: Partial<AppSettings>): Promise<AppSettings>
  selectFolder(): Promise<string | null>
  pickFiles(): Promise<string[]>
  uploadTempFile(groupId: number, fileName: string, data: number[], topicId?: number): Promise<any>
  uploadFileWithProgress(groupId: number, filePath: string, topicId: number | undefined, onProgress: (p: number) => void): Promise<any>
  uploadTempFileWithProgress(groupId: number, fileName: string, data: number[], topicId: number | undefined, onProgress: (p: number) => void): Promise<any>
  showInFolder(filePath: string): Promise<void>
  getLogPath(): Promise<string>
  openLogFolder(): Promise<void>
}

interface AuthState {
  isLoggedIn: boolean
  phone?: string
  codeHash?: string
  needs2FA: boolean
}

interface Window {
  telegramAPI: TelegramAPI
}
