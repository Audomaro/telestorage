import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions'

let client: TelegramClient | null = null
let stringSession: StringSession

const API_ID = Number(process.env.TELEGRAM_API_ID) || 0
const API_HASH = process.env.TELEGRAM_API_HASH || ''

if (!API_ID || !API_HASH) {
  console.warn('TeleStorage: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in environment')
  console.warn('Get them at https://my.telegram.org/apps')
}

export function areApiCredentialsConfigured(): boolean {
  return !!API_ID && !!API_HASH
}

let pendingPhone: string | undefined
let pendingPhoneCodeHash: string | undefined

export interface AuthState {
  isLoggedIn: boolean
  phone?: string
  codeHash?: string
  needs2FA: boolean
}

let authState: AuthState = { isLoggedIn: false, needs2FA: false }

export function getClient(): TelegramClient | null {
  return client
}

export async function initClient(session?: string): Promise<void> {
  stringSession = new StringSession(session || '')
  client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  })
}

export async function startClient(): Promise<void> {
  if (!client) throw new Error('Client not initialized')
  try {
    await client.start({
      phoneNumber: async () => { throw new Error('Use startPhoneAuth instead') },
      password: async () => { throw new Error('Use verify2FAPassword instead') },
      phoneCode: async () => { throw new Error('Use verifyPhoneCode instead') },
      onError: (err) => { throw err }
    })
  } catch (err: any) {
    if (err.errorMessage === 'AUTH_KEY_UNREGISTERED' || err.code === 401) {
      client = null
      stringSession = new StringSession('')
      return
    }
    throw err
  }
}

export async function startPhoneAuth(phone: string): Promise<{ codeHash: string }> {
  if (!client) throw new Error('Client not initialized')
  const result = await client.sendCode(
    { apiId: API_ID, apiHash: API_HASH },
    phone
  )
  pendingPhone = phone
  pendingPhoneCodeHash = result.phoneCodeHash
  authState.phone = phone
  authState.codeHash = result.phoneCodeHash
  return { codeHash: result.phoneCodeHash }
}

export async function verifyPhoneCode(code: string): Promise<{ needs2FA: boolean }> {
  if (!client) throw new Error('Client not initialized')
  if (!pendingPhone || !pendingPhoneCodeHash) throw new Error('No pending auth')

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: pendingPhone,
        phoneCodeHash: pendingPhoneCodeHash,
        phoneCode: code
      })
    )
    authState.isLoggedIn = true
    authState.needs2FA = false
    pendingPhone = undefined
    pendingPhoneCodeHash = undefined
    return { needs2FA: false }
  } catch (err: any) {
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      authState.needs2FA = true
      return { needs2FA: true }
    }
    throw err
  }
}

export async function verify2FAPassword(password: string): Promise<void> {
  if (!client) throw new Error('Client not initialized')
  if (!pendingPhone) throw new Error('No pending auth')

  try {
    await client.signInWithPassword(
      { apiId: API_ID, apiHash: API_HASH },
      {
        password: async () => password,
        onError: (err) => { throw err }
      }
    )
    authState.isLoggedIn = true
    authState.needs2FA = false
    pendingPhone = undefined
    pendingPhoneCodeHash = undefined
  } catch (err: any) {
    throw err
  }
}

export function setLoggedIn(value: boolean): void {
  authState.isLoggedIn = value
}

export function getAuthState(): AuthState {
  return { ...authState }
}

export function getSession(): string {
  return stringSession.save() as string
}

export async function logout(): Promise<void> {
  if (!client) return
  try {
    await client.invoke(new Api.auth.LogOut())
  } catch (_) {}
  client = null
  authState = { isLoggedIn: false, needs2FA: false }
}
