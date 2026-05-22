import 'dotenv/config'
// Disable automatic seeding on Payload initialization to allow clean truncation first
process.env.SEED_DB = ''

import { getPayload } from 'payload'
import configPromise from './src/payload.config'
import { seed } from './src/seed'
import { sql } from 'drizzle-orm'

async function resetAndSeed() {
  console.log('Connecting to Payload...')
  const payload = await getPayload({ config: configPromise })

  console.log('Truncating all tables cascadingly...')
  try {
    // Truncate all tables cascadingly to perfectly clear all data without triggering delete hooks or Drizzle bugs
    await (payload.db as any).drizzle.execute(sql`
      TRUNCATE TABLE 
        "users",
        "tenants",
        "academic_years",
        "tags",
        "rotations",
        "annual_requirements",
        "grad_requirements",
        "residents",
        "transfer_credits",
        "avoidance_rules",
        "schedules",
        "_schedules_v",
        "schedule_assignments",
        "clinic_cycles",
        "payload_preferences",
        "payload_locked_documents"
      CASCADE;
    `)
    console.log('Successfully cleared all tables.')
  } catch (e: any) {
    console.error('Failed to truncate tables:', e.message)
    process.exit(1)
  }

  console.log('Running the seed function...')
  try {
    await seed(payload)
    console.log('Seeding completed successfully!')
  } catch (e) {
    console.error('Seeding failed:', e)
    process.exit(1)
  }

  process.exit(0)
}

resetAndSeed().catch(err => {
  console.error('Fatal error during reset and seed:', err)
  process.exit(1)
})

