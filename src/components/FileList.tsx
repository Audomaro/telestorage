import { TelegramFile } from '../types'
import FileListItem from './FileListItem'
import styles from './FileList.module.css'

interface FileListProps {
  files: TelegramFile[]
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  readonly?: boolean
}

export default function FileList({ files, onDownload, onDelete, readonly }: FileListProps) {
  if (files.length === 0) {
    return <div className={styles.container}>Sin archivos</div>
  }

  return (
    <div>
      {files.map(f => (
        <FileListItem
          key={f.id}
          file={f}
          onDownload={onDownload}
          onDelete={onDelete}
          readonly={readonly}
        />
      ))}
    </div>
  )
}
