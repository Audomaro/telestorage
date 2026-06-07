import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FileList from '../../../src/components/FileList'
import { TelegramFile } from '../../../src/types'

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date() as any, groupId: 123 },
  { id: 2, messageId: 2, name: 'doc.pdf', size: 1048576, mimeType: 'application/pdf', date: new Date() as any, groupId: 123 }
]

describe('FileList', () => {
  it('should render all files', () => {
    render(<FileList files={mockFiles} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
    expect(screen.getByText('doc.pdf')).toBeDefined()
  })

  it('should show empty state', () => {
    render(<FileList files={[]} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText(/sin archivos/i)).toBeDefined()
  })
})
