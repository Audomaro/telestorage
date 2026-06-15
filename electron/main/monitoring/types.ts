export type TelemetryCategory = 'lifecycle' | 'feature' | 'error'

export interface TelemetryEvent {
  id: string
  timestamp: string
  category: TelemetryCategory
  name: string
  payload?: Record<string, unknown>
}

export interface TelemetryStoreConfig {
  retentionDays: number
  filePath: string
}
