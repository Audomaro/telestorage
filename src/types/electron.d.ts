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
  createGroup(title: string): Promise<any>
  deleteGroup(groupId: number): Promise<void>
  addToCreatedGroup(groupId: number): Promise<void>
  listFiles(groupId: number): Promise<any[]>
  uploadFile(groupId: number, filePath: string): Promise<any>
  uploadMultipleFiles(groupId: number, filePaths: string[]): Promise<{ messageId: number; name: string; error?: string }[]>
  downloadFile(groupId: number, messageId: number, filePath: string): Promise<void>
  downloadFileWithProgress(groupId: number, messageId: number, destPath: string, onProgress: (p: number) => void): Promise<string>
  downloadThumbnail(groupId: number, messageId: number): Promise<string>
  downloadPreview(groupId: number, messageId: number, ext: string, onProgress: (p: number) => void): Promise<string>
  loadMoreFiles(groupId: number, offsetId?: number, search?: string): Promise<{ files: FileResult[]; hasMore: boolean; nextOffsetId?: number }>
  deleteFile(groupId: number, messageId: number): Promise<void>
  forwardFile(fromGroupId: number, toGroupId: number, messageId: number): Promise<void>
  getSettings(): Promise<AppSettings>
  setSettings(s: Partial<AppSettings>): Promise<AppSettings>
  selectFolder(): Promise<string | null>
  pickFiles(): Promise<string[]>
  uploadTempFile(groupId: number, fileName: string, data: number[]): Promise<any>
  showInFolder(filePath: string): Promise<void>
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
