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
  listFiles(groupId: number, filter: string): Promise<any[]>
  uploadFile(groupId: number, filePath: string): Promise<any>
  downloadFile(groupId: number, messageId: number, filePath: string): Promise<void>
  deleteFile(groupId: number, messageId: number): Promise<void>
  forwardFile(fromGroupId: number, toGroupId: number, messageId: number): Promise<void>
}

interface AuthState {
  step: 'phone' | 'code' | '2fa' | 'done'
  phone?: string
  codeHash?: string
}

interface Window {
  telegramAPI: TelegramAPI
}
