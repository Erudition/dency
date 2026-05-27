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
        "schedules_cycle_config_cohorts",
        "schedules_rels",
        "_schedules_v",
        "_schedules_v_version_cycle_config_cohorts",
        "_schedules_v_rels",
        "schedule_assignments",
        "candidates",
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

