import { getPayload } from 'payload'
import configPromise from './src/payload.config'

async function check() {
  const payload = await getPayload({ config: configPromise })
  
  const schedules = await payload.find({ collection: 'schedules' })
  const assignments = await payload.find({ collection: 'schedule-assignments' })
  const transferCredits = await payload.find({ collection: 'transfer-credits' })
  const gradReqs = await payload.find({ collection: 'grad-requirements' })

  console.log(`Schedules: ${schedules.totalDocs}`)
  console.log(`Assignments: ${assignments.totalDocs}`)
  console.log(`Transfer Credits: ${transferCredits.totalDocs}`)
  console.log(`Grad Reqs: ${gradReqs.totalDocs}`)
  
  process.exit(0)
}

check()
