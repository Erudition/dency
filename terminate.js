import 'dotenv/config'
import pg from 'pg'

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
