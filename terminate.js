import 'dotenv/config'
import pg from 'pg'
import { execSync } from 'child_process'

function checkDevServers() {
  const ports = [3000, 5173]
  const activeProcesses = []
  for (const port of ports) {
    // Check if something is actively listening on this port (not just a client connection)
    for (const prefix of ['host-spawn ', '']) {
      try {
        const result = execSync(`${prefix}ss -tlnp sport = :${port} 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 })
        // ss always outputs a header line; if there's a second line, something is LISTEN-ing
        const lines = result.trim().split('\n').filter(l => l && !l.startsWith('State'))
        if (lines.length > 0) {
          activeProcesses.push(`  Port ${port}: ${lines[0].trim()}`)
        }
        break // Command succeeded, don't try fallback
      } catch (e) {
        if (prefix === 'host-spawn ') continue
        // ss not available or no match — safe to proceed
      }
    }
  }
  if (activeProcesses.length > 0) {
    console.error('\x1b[31m[ERROR] Cannot run database reset/seed: active dev servers detected!\x1b[0m')
    console.error('\x1b[31mPlease terminate all dev servers (Next.js, Vite) before running this script.\x1b[0m')
    console.error('\x1b[33mActive processes:\x1b[0m')
    console.error(activeProcesses.join('\n'))
    process.exit(1)
  }
}

checkDevServers()

async function terminateOtherSessions() {
  if (!process.env.POSTGRES_URL) {
    console.log('No POSTGRES_URL environment variable found. Skipping session termination.')
    return
  }

  console.log('Terminating other active database sessions to prevent locks...')
  const client = new pg.Client({
    connectionString: process.env.POSTGRES_URL,
  })

  try {
    await client.connect()
    const result = await client.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = current_database() AND pid <> pg_backend_pid();
    `)
    console.log(`Successfully terminated ${result.rowCount} other database session(s) and cleared locks.`)
  } catch (err) {
    console.error('Warning: Failed to terminate other sessions:', err.message)
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore
    }
  }
}

terminateOtherSessions()
