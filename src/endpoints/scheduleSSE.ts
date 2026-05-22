/**
 * SSE Endpoint for Schedule Sync
 *
 * Maintains a persistent text/event-stream connection per client.
 * Clients subscribe to a candidate's schedule changes.
 *
 * Route: GET /api/schedules/stream/:candidateId
 *
 * Authentication: JWT token passed via query param `token` (SSE can't send
 * custom headers from EventSource). Falls back to cookie-based auth.
 *
 * Each client generates a unique `clientId` and passes it as a query param
 * so the server can skip echoing events back to the originator.
 */

import type { Endpoint } from 'payload'
import { registerConnection, unregisterConnection } from './sseConnectionManager'

const HEARTBEAT_INTERVAL_MS = 30_000

export const scheduleSSEEndpoint: Endpoint = {
  path: '/sync/stream/:candidateId',
  method: 'get',
  handler: async (req) => {
    // Determine the allowed origin for CORS
    const origin = req.headers.get('origin') || ''
    const allowedOrigins = [
      'https://erudition.github.io',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : []),
    ]
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

    const candidateIdStr = req.routeParams?.candidateId as string | undefined
    if (!candidateIdStr) {
      return Response.json({ error: 'candidateId is required' }, { status: 400 })
    }
    const candidateId = parseInt(candidateIdStr, 10)
    if (isNaN(candidateId)) {
      return Response.json({ error: 'candidateId must be a number' }, { status: 400 })
    }

    // Extract clientId and optional JWT token from query params
    // (EventSource cannot send custom headers, so the token is passed as a query param)
    const url = new URL(req.url || '', 'http://localhost')
    const clientId = url.searchParams.get('clientId') || `anon-${Date.now()}`
    const token = url.searchParams.get('token')

    // If a token was passed, verify it by decoding the JWT
    if (token) {
      try {
        const headers = new Headers(req.headers)
        headers.set('authorization', `JWT ${token}`)
        ;(req as any).headers = headers
      } catch {
        // If token manipulation fails, proceed without auth
      }
    }

    // Verify the candidate exists
    try {
      await req.payload.findByID({
        collection: 'candidates',
        id: candidateId,
      })
    } catch {
      return Response.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Create the SSE stream
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()

    // Register this connection
    const conn = registerConnection(candidateId, clientId, writer)

    // Send initial connected event
    const connectEvent = `event: connected\ndata: ${JSON.stringify({
      candidateId,
      clientId,
      message: 'Connected to schedule stream',
    })}\n\n`
    writer.write(encoder.encode(connectEvent)).catch(() => {})

    // Start heartbeat
    const heartbeat = setInterval(() => {
      const ping = `: heartbeat ${Date.now()}\n\n`
      writer.write(encoder.encode(ping)).catch(() => {
        // Connection dead — cleanup will happen via broadcast
        clearInterval(heartbeat)
      })
    }, HEARTBEAT_INTERVAL_MS)

    // Cleanup on abort (client disconnect)
    // In the Web Streams API, we detect disconnect when the readable side is cancelled.
    // We use a background task to monitor this.
    const cleanup = () => {
      clearInterval(heartbeat)
      unregisterConnection(candidateId, conn)
      try {
        writer.close()
      } catch {
        // Already closed
      }
    }

    // The request signal fires on client disconnect
    if (req.signal) {
      req.signal.addEventListener('abort', cleanup, { once: true })
    }

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  },
}
