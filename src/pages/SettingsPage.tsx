import { useState, useEffect } from 'react'
import styles from './SettingsPage.module.css'

interface SettingsPageProps {
  onBack: () => void
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [downloadPath, setDownloadPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      setDownloadPath(s.downloadPath)
    })
  }, [])

  const handleSelectFolder = async () => {
    const path = await window.telegramAPI.selectFolder()
    if (path) setDownloadPath(path)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.telegramAPI.setSettings({ downloadPath })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>⬅️</button>
        <span className={styles.headerTitle}>Configuración</span>
      </div>

      <div className={styles.body}>
        <div className={styles.field}>
          <label className={styles.label}>Carpeta de descargas</label>
          <div className={styles.pathRow}>
            <input type="text" value={downloadPath} readOnly className={styles.pathInput} />
            <button onClick={handleSelectFolder} className={styles.changeBtn}>Cambiar</button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className={styles.saveBtn}
          style={{ background: saving ? '#999' : '#4CAF50' }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>

        {saved && <span className={styles.savedMsg}>✓ Configuración guardada</span>}
      </div>
    </div>
  )
}
