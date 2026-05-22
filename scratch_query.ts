import { getPayload } from 'payload'
import configPromise from './src/payload.config'
import 'dotenv/config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  const residents = await payload.find({
    collection: 'residents',
    limit: 200,
    depth: 1,
  })
  console.log("Total Residents:", residents.totalDocs)
  residents.docs.forEach(r => {
    console.log(`- ${r.displayName} (Start: ${(r.startYear as any)?.startingYear}, PGY3: ${(r.pgy3Year as any)?.startingYear}, Leave: ${r.leaveDate || 'active'})`)
  })
  process.exit(0)
}
run()
