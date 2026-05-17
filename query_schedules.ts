import { getPayload } from 'payload'
import configPromise from './src/payload.config'
import 'dotenv/config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  const scheds = await payload.find({ collection: 'schedules', depth: 1 })
  const ays = await payload.find({ collection: 'academic-years', depth: 0 })
  console.log("AYs:", ays.docs.map(a => a.title))
  console.log("Schedules:")
  scheds.docs.forEach(s => {
    console.log(`- ${(s.academicYear as any)?.title}`)
  })
  process.exit(0)
}
run()
