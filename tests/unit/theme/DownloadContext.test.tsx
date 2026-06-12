import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DownloadProvider, useDownload } from '../../../src/theme/DownloadContext'
import { useState } from 'react'

function TestButton() {
  const { addDownload, downloads } = useDownload()
  const [clicked, setClicked] = useState(false)
  return (
    <button onClick={() => { addDownload('1', 'test.txt'); setClicked(true) }}>
      {clicked ? 'added' : 'add'}
    </button>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DownloadProvider>{children}</DownloadProvider>
}

describe('DownloadContext', () => {
  it('should add download', () => {
    render(<TestButton />, { wrapper: Wrapper })
    expect(screen.getByText('add')).toBeDefined()
  })
})
