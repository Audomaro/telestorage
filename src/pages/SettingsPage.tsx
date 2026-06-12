import { useState, useEffect } from 'react'
import styles from './SettingsPage.module.css'

interface SettingsPageProps {
  onBack: () => void
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [downloadPath, setDownloadPath] = useState('')
  const [batchSize, setBatchSize] = useState(50)
  const [defaultTab, setDefaultTab] = useState<'created' | 'active' | 'archived'>('created')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.telegramAPI.getSettings().then(s => {
      setDownloadPath(s.downloadPath)
      setBatchSize(s.batchSize ?? 50)
      setDefaultTab(s.defaultTab ?? 'created')
    })
  }, [])

  const handleSelectFolder = async () => {
    const path = await window.telegramAPI.selectFolder()
    if (path) setDownloadPath(path)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.telegramAPI.setSettings({ downloadPath, batchSize, defaultTab })
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

        <div className={styles.field}>
          <label className={styles.label}>Archivos por carga (batch size)</label>
          <input
            type="number"
            min={1}
            value={batchSize}
            onChange={e => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
            className={styles.numInput}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Pestaña por defecto al iniciar</label>
          <select
            value={defaultTab}
            onChange={e => setDefaultTab(e.target.value as 'created' | 'active' | 'archived')}
            className={styles.selectInput}
          >
            <option value="created">TeleStorage</option>
            <option value="active">Activos</option>
            <option value="archived">Archivados</option>
          </select>
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
