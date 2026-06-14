import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { UploadProvider, useUpload } from '../UploadContext'

function renderCtx() {
  return renderHook(() => useUpload(), {
    wrapper: ({ children }: { children: ReactNode }) => <UploadProvider>{children}</UploadProvider>,
  })
}

describe('UploadContext', () => {
  it('starts with empty uploads', () => {
    const { result } = renderCtx()
    expect(result.current.uploads).toEqual([])
  })

  it('adds an upload', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    expect(result.current.uploads).toHaveLength(1)
    expect(result.current.uploads[0]).toMatchObject({ id: 'u1', fileName: 'test.pdf', progress: 0, status: 'uploading' })
  })

  it('updates progress', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    act(() => result.current.updateProgress('u1', 0.5))
    expect(result.current.uploads[0].progress).toBe(0.5)
  })

  it('completes an upload', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    act(() => result.current.completeUpload('u1'))
    expect(result.current.uploads[0].status).toBe('completed')
    expect(result.current.uploads[0].progress).toBe(1)
  })

  it('fails an upload', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    act(() => result.current.failUpload('u1', 'Network error'))
    expect(result.current.uploads[0].status).toBe('error')
    expect(result.current.uploads[0].error).toBe('Network error')
  })

  it('removes an upload', () => {
    const { result } = renderCtx()
    act(() => result.current.addUpload('u1', 'test.pdf'))
    act(() => result.current.removeUpload('u1'))
    expect(result.current.uploads).toHaveLength(0)
  })
})
