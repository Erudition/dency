/**
 * SSE Connection Manager
 *
 * Maintains an in-memory registry of active SSE connections, grouped by candidate ID.
 * Used by:
 *  - The SSE endpoint to register/unregister client connections
 *  - Collection afterChange/afterDelete hooks to broadcast events
 *
 * This is a singleton module — all imports share the same state.
 */

export interface SSEEvent {
  event: string
  data: Record<string, unknown>
}

interface SSEConnection {
  clientId: string
  writer: WritableStreamDefaultWriter<Uint8Array>
  encoder: TextEncoder
}

// candidateId → Set of active connections
// Use globalThis so the registry survives Next.js HMR re-evaluations in dev mode.
const GLOBAL_KEY = '__sse_connections__' as const

function getConnections(): Map<number, Set<SSEConnection>> {
  if (!(globalThis as any)[GLOBAL_KEY]) {
    ;(globalThis as any)[GLOBAL_KEY] = new Map<number, Set<SSEConnection>>()
  }
  return (globalThis as any)[GLOBAL_KEY]
}

const encoder = new TextEncoder()

/**
 * Register a new SSE connection for a candidate.
 */
export function registerConnection(
  candidateId: number,
  clientId: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
): SSEConnection {
  const conn: SSEConnection = { clientId, writer, encoder }
  const connections = getConnections()
  if (!connections.has(candidateId)) {
    connections.set(candidateId, new Set())
  }
  connections.get(candidateId)!.add(conn)
  return conn
}

/**
 * Remove a connection from the registry.
 */
export function unregisterConnection(candidateId: number, conn: SSEConnection): void {
  const connections = getConnections()
  const set = connections.get(candidateId)
  if (set) {
    set.delete(conn)
    if (set.size === 0) {
      connections.delete(candidateId)
    }
  }
}

/**
 * Broadcast an SSE event to all connections for a given candidate.
 * Optionally skip a specific client (the originator).
 */
export async function broadcast(
  candidateId: number,
  event: SSEEvent,
  skipClientId?: string,
): Promise<void> {
  const connections = getConnections()
  const set = connections.get(candidateId)
  if (!set || set.size === 0) return

  const payload = formatSSE(event)
  const encoded = encoder.encode(payload)

  const deadConnections: SSEConnection[] = []

  for (const conn of set) {
    if (skipClientId && conn.clientId === skipClientId) continue
    try {
      await conn.writer.write(encoded)
    } catch {
      // Connection is dead — mark for cleanup
      deadConnections.push(conn)
    }
  }

  // Clean up dead connections
  for (const dead of deadConnections) {
    set.delete(dead)
    try {
      dead.writer.close()
    } catch {
      // Already closed
    }
  }
  if (set.size === 0) {
    connections.delete(candidateId)
  }
}

/**
 * Get the count of active connections for a candidate (useful for debugging).
 */
export function getConnectionCount(candidateId: number): number {
  return getConnections().get(candidateId)?.size ?? 0
}

/**
 * Format an SSE event into the wire protocol.
 */
function formatSSE(event: SSEEvent): string {
  const dataStr = JSON.stringify(event.data)
  return `event: ${event.event}\ndata: ${dataStr}\n\n`
}
