import 'dotenv/config'
import pg from 'pg'
import { execSync } from 'child_process'

function checkDevServers() {
  try {
    const processes = execSync('pgrep -fl "next dev|vite"', { encoding: 'utf-8' })
    if (processes.trim()) {
      console.error('\x1b[31m[ERROR] Cannot run database reset/seed: active dev servers detected!\x1b[0m')
      console.error('\x1b[31mPlease terminate all dev servers (Next.js, Vite) before running this script.\x1b[0m')
      console.error('\x1b[33mActive processes:\x1b[0m')
      console.error(processes)
      process.exit(1)
    }
  } catch (e) {
    // pgrep exits with 1 if no process matches, which is the expected/success case
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
