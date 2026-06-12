import { createServer, IncomingMessage, ServerResponse } from 'http'
import { getClient } from './telegram/auth'
import { Api } from 'telegram'
import bigInt from 'big-integer'

interface StreamInfo {
  groupId: number
  messageId: number
  mimeType: string
  fileSize: number
  location?: any
}

const streams = new Map<string, StreamInfo>()
let serverPort = 0

export async function startStreamServer(): Promise<number> {
  if (serverPort) return serverPort

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url || ''
    const match = url.match(/^\/stream\/(.+)$/)
    if (!match) {
      res.writeHead(404).end()
      return
    }

    const streamId = match[1]
    const stream = streams.get(streamId)
    if (!stream) {
      res.writeHead(404).end()
      return
    }

    const client = getClient()
    if (!client) {
      res.writeHead(500).end()
      return
    }

    try {
      // Cache file location to avoid fetching message on every range request
      if (!stream.location) {
        const messages = await client.getMessages(stream.groupId, { ids: stream.messageId })
        if (!messages.length || !messages[0].media) {
          res.writeHead(404).end()
          return
        }
        const location = getFileLocation(messages[0].media)
        if (!location) {
          res.writeHead(404).end()
          return
        }
        stream.location = location
      }

      const range = req.headers.range
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : stream.fileSize - 1
        const chunksize = Math.min(end - start + 1, stream.fileSize - start)

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${start + chunksize - 1}/${stream.fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': stream.mimeType,
        })

        // Stream chunks directly to response as they arrive from Telegram
        let totalWritten = 0
        for await (const chunk of client.iterDownload({
          file: stream.location,
          offset: bigInt(start),
          requestSize: 64 * 1024,
        })) {
          const toWrite = Math.min(chunk.length, chunksize - totalWritten)
          if (toWrite > 0) {
            res.write(chunk.subarray(0, toWrite))
            totalWritten += toWrite
          }
          if (totalWritten >= chunksize) break
        }
        res.end()
      } else {
        res.writeHead(200, {
          'Content-Length': stream.fileSize,
          'Content-Type': stream.mimeType,
        })

        // Stream entire file directly
        let totalWritten = 0
        for await (const chunk of client.iterDownload({
          file: stream.location,
          offset: bigInt(0),
          requestSize: 64 * 1024,
        })) {
          res.write(chunk)
          totalWritten += chunk.length
          if (totalWritten >= stream.fileSize) break
        }
        res.end()
      }
    } catch (err: any) {
      console.error('Stream error:', err.message)
      if (!res.headersSent) {
        res.writeHead(500).end()
      } else {
        res.end()
      }
    }
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      serverPort = typeof address === 'object' && address ? address.port : 0
      console.log('Video stream server started on port', serverPort)
      resolve(serverPort)
    })
  })
}

function getFileLocation(media: any): any {
  if (media.document) {
    return new Api.InputDocumentFileLocation({
      id: media.document.id,
      accessHash: media.document.accessHash,
      fileReference: media.document.fileReference,
      thumbSize: '',
    })
  }
  if (media.photo) {
    const sizes = media.photo.sizes || []
    const size = sizes[sizes.length - 1]
    return new Api.InputPhotoFileLocation({
      id: media.photo.id,
      accessHash: media.photo.accessHash,
      fileReference: media.photo.fileReference,
      thumbSize: size?.type || 'w',
    })
  }
  return null
}

export function registerStream(streamId: string, info: StreamInfo) {
  streams.set(streamId, info)
}

export function unregisterStream(streamId: string) {
  streams.delete(streamId)
}

export function getStreamServerPort(): number {
  return serverPort
}
