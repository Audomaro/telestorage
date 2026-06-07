import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions'

let client: TelegramClient | null = null
let stringSession: StringSession

const API_ID = Number(process.env.TELEGRAM_API_ID) || 0
const API_HASH = process.env.TELEGRAM_API_HASH || ''

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
      phoneNumber: async () => { throw new Error('Use sendPhoneCode instead') },
      password: async () => { throw new Error('Use check2FA instead') },
      phoneCode: async () => { throw new Error('Use verifyCode instead') },
      onError: (err) => { throw err }
    })
  } catch (err: any) {
    if (err.errorMessage === 'AUTH_KEY_UNREGISTERED' || err.message?.includes('phone')) {
      // This is fine, we'll auth manually
    } else {
      throw err
    }
  }
}

export async function sendPhoneCode(phone: string): Promise<{ codeHash: string }> {
  if (!client) throw new Error('Client not initialized')
  const result = await client.sendCode(
    { apiId: API_ID, apiHash: API_HASH },
    phone
  )
  authState.phone = phone
  authState.codeHash = result.phoneCodeHash
  return { codeHash: result.phoneCodeHash }
}

export async function verifyCode(phone: string, code: string, codeHash: string): Promise<{ needs2FA: boolean }> {
  if (!client) throw new Error('Client not initialized')
  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash: codeHash,
        phoneCode: code
      })
    )
    authState.isLoggedIn = true
    authState.needs2FA = false
    return { needs2FA: false }
  } catch (err: any) {
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      authState.needs2FA = true
      return { needs2FA: true }
    }
    throw err
  }
}

export async function check2FA(password: string): Promise<void> {
  if (!client) throw new Error('Client not initialized')
  await client.signInWithPassword(
    { apiId: API_ID, apiHash: API_HASH },
    {
      password: async () => password,
      onError: (err) => { throw err }
    }
  )
  authState.isLoggedIn = true
  authState.needs2FA = false
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
