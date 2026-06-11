import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', loading, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className={styles.dialog}>
        <div className={styles.title}>{title}</div>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelBtn} disabled={loading}>Cancelar</button>
          <button onClick={onConfirm} className={styles.confirmBtn} disabled={loading}>
            {loading ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
