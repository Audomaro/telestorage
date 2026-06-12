import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DownloadProvider, useDownload } from '../../../src/theme/DownloadContext'

function TestConsumer() {
  const { downloads, addDownload } = useDownload()
  return (
    <div>
      <button onClick={() => addDownload('1', 'test.txt')}>Add</button>
      <span data-testid="count">{downloads.length}</span>
      {downloads.map(d => <div key={d.id} data-testid="name">{d.fileName}</div>)}
    </div>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DownloadProvider>{children}</DownloadProvider>
}

describe('DownloadContext', () => {
  it('should add download', () => {
    render(<TestConsumer />, { wrapper: Wrapper })
    expect(screen.getByTestId('count').textContent).toBe('0')
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('name').textContent).toBe('test.txt')
  })
})
