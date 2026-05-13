import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Config, Payload } from 'payload'

/**
 * Maps ClinicalSetting enum values to outpatient percentage.
 */
const settingToOutpatient: Record<string, number> = {
  'Inpatient': 0,
  'Critical Care': 0,
  'Emergency': 0,
  'Outpatient': 100,
  'Non-Clinical': 0,
}

/**
 * All rotation data from the frontend constants.ts ROTATION_METADATA,
 * flattened for seeding.
 */
const ROTATION_DATA = [
  { codename: 'MICU', title: 'Medical ICU', abbr: 'ICU', category: 'ICU', intensity: 5, setting: 'Critical Care', color: '28', minInterns: 2, maxInterns: 3, minSeniors: 1, maxSeniors: 2, pgy1: 8, pgy2: 4, pgy3: 4 },
  { codename: 'RED', title: 'Wards Red', abbr: 'W-RED', category: 'Wards', intensity: 4, setting: 'Inpatient', color: '15', minInterns: 1, maxInterns: 3, minSeniors: 1, maxSeniors: 2, pgy1: 16, pgy2: 12, pgy3: 8 },
  { codename: 'BLUE', title: 'Wards Blue', abbr: 'W-BLUE', category: 'Wards', intensity: 3, setting: 'Inpatient', color: '250', minInterns: 1, maxInterns: 3, minSeniors: 1, maxSeniors: 2 },
  { codename: 'NF', title: 'Night Float', abbr: 'NF', category: 'Night Float', intensity: 4, setting: 'Inpatient', color: '282', minInterns: 1, maxInterns: 2, minSeniors: 1, maxSeniors: 2, pgy1: 4, pgy2: 4, pgy3: 4 },
  { codename: 'EM', title: 'Emergency Medicine', abbr: 'EM', category: 'Emergency', intensity: 3, setting: 'Inpatient', color: '45', minInterns: 0, maxInterns: 0, minSeniors: 1, maxSeniors: 2, pgy2: 2, pgy3: 2 },
  { codename: 'CCIM', title: 'Clinic (CCIM)', abbr: 'CCIM', category: 'Clinic', intensity: 2, setting: 'Outpatient', color: '65', minInterns: 0, maxInterns: 10, minSeniors: 0, maxSeniors: 10 },
  { codename: 'METRO', title: 'Metro Wards', abbr: 'MET', category: 'Wards', intensity: 3, setting: 'Inpatient', color: '155', minInterns: 1, maxInterns: 3, minSeniors: 1, maxSeniors: 2 },
  { codename: 'Cards', title: 'Cardiology', abbr: 'CARDS', category: 'Cardiology', intensity: 3, setting: 'Inpatient', color: '355', minInterns: 0, maxInterns: 1, minSeniors: 0, maxSeniors: 1, pgy1: 2, pgy3: 2 },
  { codename: 'ID', title: 'Infectious Disease', abbr: 'ID', category: 'Infectious Disease', intensity: 2, setting: 'Inpatient', color: '140', minInterns: 0, maxInterns: 2, minSeniors: 0, maxSeniors: 1, pgy1: 2 },
  { codename: 'Neph', title: 'Nephrology', abbr: 'NEPH', category: 'Nephrology', intensity: 1, setting: 'Inpatient', color: '50', minInterns: 0, maxInterns: 2, minSeniors: 0, maxSeniors: 1, pgy1: 2 },
  { codename: 'Pulm', title: 'Pulmonology', abbr: 'PULM', category: 'Pulmonology', intensity: 1, setting: 'Inpatient', color: '185', minInterns: 0, maxInterns: 2, minSeniors: 0, maxSeniors: 2, pgy1: 2, pgy2: 2 },
  { codename: 'Onc', title: 'Hematology-Oncology', abbr: 'ONC', category: 'Heme/Onc', intensity: 1, setting: 'Inpatient', color: '355', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 2, pgy3: 2 },
  { codename: 'Neuro', title: 'Neurology', abbr: 'NEURO', category: 'Neurology', intensity: 2, setting: 'Inpatient', color: '270', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 1, pgy2: 2 },
  { codename: 'Rheum', title: 'Rheumatology', abbr: 'RHEUM', category: 'Rheumatology', intensity: 1, setting: 'Outpatient', color: '125', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 1, pgy2: 2 },
  { codename: 'GI', title: 'Gastroenterology', abbr: 'GI', category: 'Gastroenterology', intensity: 1, setting: 'Outpatient', color: '70', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 2, pgy2: 2 },
  { codename: 'Add Med', title: 'Addiction Medicine', abbr: 'ADDM', category: 'Addiction Medicine', intensity: 1, setting: 'Inpatient', color: '110', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 2, pgy3: 2 },
  { codename: 'Endo', title: 'Endocrinology', abbr: 'ENDO', category: 'Endocrinology', intensity: 1, setting: 'Outpatient', color: '45', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 2, pgy2: 2 },
  { codename: 'Geri', title: 'Geriatrics', abbr: 'GERI', category: 'Geriatrics', intensity: 1, setting: 'Outpatient', color: '135', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 2, pgy3: 2 },
  { codename: 'HPC', title: 'Hospice & Palliative Care', abbr: 'HPC', category: 'Palliative Care', intensity: 1, setting: 'Inpatient', color: '215', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 2, pgy3: 2 },
  { codename: 'METRO_ICU', title: 'Metro ICU', abbr: 'METRO', category: 'ICU', intensity: 5, setting: 'Critical Care', color: '335', minInterns: 0, maxInterns: 3, minSeniors: 0, maxSeniors: 3 },
  { codename: 'NIMA', title: 'Primary Care (NIMA Block)', abbr: 'NIMA', category: 'Senior Track', intensity: 2, setting: 'Outpatient', color: '95', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 2, pgy3: 4 },
  { codename: 'AMCS_CONSULTS', title: 'AMCS Consults', abbr: 'AMCS', category: 'AMCS', intensity: 3, setting: 'Inpatient', color: '345', minInterns: 0, maxInterns: 2, minSeniors: 0, maxSeniors: 2 },
  { codename: 'CCMA', title: 'Critical Care Medical Assessment', abbr: 'CCMA', category: 'CCMA', intensity: 3, setting: 'Inpatient', color: '280', minInterns: 0, maxInterns: 2, minSeniors: 0, maxSeniors: 2 },
  { codename: 'Heart Failure', title: 'Heart Failure', abbr: 'HF', category: 'Heart Failure', intensity: 2, setting: 'Inpatient', color: '15', minInterns: 0, maxInterns: 2, minSeniors: 0, maxSeniors: 2 },
  { codename: 'ENT', title: 'Otolaryngology', abbr: 'ENT', category: 'ENT', intensity: 1, setting: 'Outpatient', color: '170', minInterns: 0, maxInterns: 1, minSeniors: 0, maxSeniors: 1 },
  { codename: 'PMNR', title: 'Physical Medicine & Rehab', abbr: 'PMNR', category: 'PMNR', intensity: 2, setting: 'Inpatient', color: '205', minInterns: 0, maxInterns: 1, minSeniors: 0, maxSeniors: 1 },
  { codename: 'ANAESTHESIA', title: 'Anaesthesia', abbr: 'ANES', category: 'Anaesthesia', intensity: 1, setting: 'Inpatient', color: '190', minInterns: 0, maxInterns: 1, minSeniors: 0, maxSeniors: 1 },
  { codename: 'Research', title: 'Research', abbr: 'RSCH', category: 'Research', intensity: 1, setting: 'Non-Clinical', color: '100', minInterns: 0, maxInterns: 10, minSeniors: 0, maxSeniors: 10 },
  { codename: 'ELECTIVE', title: 'Elective', abbr: 'ELEC', category: 'Elective', intensity: 1, setting: 'Inpatient', color: '150', minInterns: 0, maxInterns: 20, minSeniors: 0, maxSeniors: 20 },
  { codename: 'VAC', title: 'Vacation', abbr: 'VAC', category: 'Vacation', intensity: 0, setting: 'Non-Clinical', color: '80', minInterns: 0, maxInterns: 20, minSeniors: 0, maxSeniors: 20 },
  { codename: 'Jr Hosp', title: 'Junior Hospitalist', abbr: 'JH', category: 'Senior Track', intensity: 3, setting: 'Inpatient', color: '225', minInterns: 0, maxInterns: 0, minSeniors: 0, maxSeniors: 2, pgy3: 4 },
  { codename: 'NIMA (Clinic)', title: 'NIMA Clinic', abbr: 'NIMA', category: 'Clinic', intensity: 2, setting: 'Outpatient', color: '75', minInterns: 0, maxInterns: 10, minSeniors: 0, maxSeniors: 10 },
] as const

/**
 * Resident class rosters from constants.ts
 */
const CLASS_2024 = ['Baset, Nawsin', 'Cho, Kevin Wook Jin', 'De La Cruz, Aaron Daniel', 'Deen, Nafis M', 'Liu, Gongkai', 'Masud, Saad', 'Min, Shao-Ting', 'Mysore, Nishad Narain', 'Thanedar, Sarita', 'Yu, Tommy']
const CLASS_2025 = ['Alvarado, Ramona Davina', 'Dawood, Umar Asif', 'Delano, Victoria Remilekun', 'Echegaray, Sebastian Alexander', 'Hill, Brittany Marie', 'Jentz, Austin Lee', 'Letson, Mia Kang', 'Millan, Cassandra Marie', 'Nazeer, Usman Imran', 'Ndze, Lila Linda', 'Orden, Martin Basobas', 'Rendon, Arthur Isaac', 'Sanderson, Jacob Nakolo', 'Shah, Vidur Hemant']
const CLASS_2026 = ['Alhaddadein, Yara', 'Chen, Chang-Rong', 'DeVolder, Mitchell', 'Gurram, Neha', 'Hamadneh, Yazan', 'Joseph, Rachel', 'King, Matthew', 'Mukherjee, Lipilekha', 'Omokaro, Precious', 'Paripati, Laxmi Mahita Reddy', 'Quillin, Travis', 'Rakaba, Michelle', 'Suresh, Sneha', 'Thupili, Sasanka', 'Yekini, Stephen']

function parseName(fullName: string): { firstName: string; lastName: string } {
  const [lastName, ...firstParts] = fullName.split(', ')
  return { firstName: firstParts.join(', ').trim(), lastName: lastName.trim() }
}

/**
 * Transfer data: residents who left the program early.
 */
const TRANSFERS_OUT: Record<string, { leaveDate: string; leaveReason: 'transferred_out' }> = {
  'Mysore, Nishad Narain': { leaveDate: '2024-06-30', leaveReason: 'transferred_out' },
  'Cho, Kevin Wook Jin': { leaveDate: '2025-06-30', leaveReason: 'transferred_out' },
}


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const seed: NonNullable<Config['onInit']> = async (payload): Promise<void> => {
  // Check if already seeded
  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: 'demo@payloadcms.com' } },
    limit: 1,
  })

  if (existingUsers.docs.length > 0) {
    payload.logger.info('Seed data already exists, skipping.')
    return
  }

  payload.logger.info('Starting MHS seed...')

  try {
    // ─── Tenant ───
  const mhsTenant = await payload.create({
    collection: 'tenants',
    data: { name: 'MHS Internal Medicine', slug: 'mhs', domain: 'MHShealth.com' },
  })
  const tenantId = mhsTenant.id

  // ─── Users ───
  const superAdmin = await payload.create({
    collection: 'users',
    data: { email: 'demo@payloadcms.com', password: 'demo', roles: ['super-admin'] },
  })
  await payload.create({
    collection: 'users',
    data: {
      email: 'Andrew.Wright@MHShealth.com', password: 'demo', username: 'mhs-admin',
      tenants: [{ roles: ['tenant-admin'], tenant: tenantId }],
    },
  })

  // ─── Academic Years ───
  const ayMap: Record<number, number> = {} // startingYear → record ID
  for (const year of [2023, 2024, 2025, 2026]) { // added 2023 for historical data
    const ay = await payload.create({
      collection: 'academic-years',
      data: {
        startingYear: year,
      },
    })
    ayMap[year] = ay.id
  }

  // ─── Tags ───
  const uniqueCategories: string[] = [...new Set(ROTATION_DATA.map((r) => r.category))]
  // Add our new Grad Requirement categories based on ACGME Balance Audit
  const extraCategories = ['Inpatient Core', 'Outpatient Core', 'Individualized']
  for (const cat of extraCategories) {
    if (!uniqueCategories.includes(cat)) uniqueCategories.push(cat)
  }
  
  const tagMap: Record<string, number> = {} 

  for (const catName of uniqueCategories) {
    const tag = await payload.create({
      collection: 'tags',
      data: { title: catName, retired: false, tenant: tenantId },
    })
    tagMap[catName] = tag.id
  }

  // ─── Rotations ───
  const rotationMap: Record<string, number> = {} // codename → rotation ID

  for (const r of ROTATION_DATA) {
    const tagIds = [tagMap[r.category]].filter(Boolean)
    
    // Auto-map extra tags based on settings and category
    if (r.setting === 'Inpatient' || r.setting === 'Critical Care') {
      tagIds.push(tagMap['Inpatient Core'])
    }
    if (r.setting === 'Outpatient') {
      tagIds.push(tagMap['Outpatient Core'])
    }
    if (r.category === 'Elective') {
      tagIds.push(tagMap['Individualized'])
    }

    const rotation = await payload.create({
      collection: 'rotations',
      data: {
        title: r.title,
        codename: r.codename, // we use short identifier for codename now per instruction
        intensity: r.intensity,
        outpatientPercentage: settingToOutpatient[r.setting] ?? 0,
        color: r.color,
        isFlexible: false,
        retired: false,
        tags: tagIds,
        tenant: tenantId,
      },
    })
    rotationMap[r.codename] = rotation.id
  }

  // ─── Staffing Preferences (for AY 2026) ───
  for (const r of ROTATION_DATA) {
    const rotId = rotationMap[r.codename]
    if (!rotId) continue

    const combos: Array<{ interns: number; seniors: number; rank: number }> = []
    combos.push({ interns: r.minInterns, seniors: r.minSeniors, rank: 1 })

    if (r.maxInterns !== r.minInterns || r.maxSeniors !== r.minSeniors) {
      combos.push({ interns: r.maxInterns, seniors: r.maxSeniors, rank: 2 })
    }

    for (const combo of combos) {
      await payload.create({
        collection: 'staffing-preferences',
        data: {
          academicYear: ayMap[2026],
          rotation: rotId,
          internCount: combo.interns,
          seniorCount: combo.seniors,
          preferenceRank: combo.rank,
          tenant: tenantId,
        },
      })
    }
  }

  // ─── Graduation Requirements (Curriculum Rules) ───
  // Based on MHS Curriculum.md "ACGME Balance Audit"
  const gradReqsData = [
    { tag: 'Inpatient Core', source: 'acgme', minimum: 40, ideal: 40 }, // 10 months
    { tag: 'ICU', source: 'acgme', minimum: 8, maximum: 24, ideal: 16 }, // Min 2, max 6 months, 4 exact
    { tag: 'Outpatient Core', source: 'acgme', minimum: 40, ideal: 44 }, // Min 10 months, 44 weeks derived
    { tag: 'Night Float', source: 'mhs', minimum: 12, maximum: 12, ideal: 12 }, // 12 weeks exact
    { tag: 'Individualized', source: 'acgme', minimum: 24, ideal: 24 }, // Min 6 months
  ]

  for (const req of gradReqsData) {
    const tagId = tagMap[req.tag]
    if (!tagId) continue
    await payload.create({
      collection: 'grad-requirements',
      data: {
        academicYear: ayMap[2026],
        tag: tagId,
        source: req.source as 'acgme' | 'mhs' | 'program',
        minimum: req.minimum,
        maximum: req.maximum,
        ideal: req.ideal,
        tenant: tenantId,
      },
    })
  }

  // ─── Residents ───
  const residentMap: Record<string, number> = {} // full name → resident ID
  const classData: Array<{ names: string[]; startYear: number }> = [
    { names: CLASS_2024, startYear: 2024 },
    { names: CLASS_2025, startYear: 2025 },
    { names: CLASS_2026, startYear: 2026 },
  ]

  for (const cls of classData) {
    const ayId = ayMap[cls.startYear]
    if (!ayId) continue

    for (const fullName of cls.names) {
      const { firstName, lastName } = parseName(fullName)
      const transfer = TRANSFERS_OUT[fullName]

      const resident = await payload.create({
        collection: 'residents',
        data: {
          firstName,
          lastName,
          startYear: ayId,
          joinDate: `${cls.startYear}-07-01`,
          ...(transfer && {
            leaveDate: transfer.leaveDate,
            leaveReason: transfer.leaveReason,
          }),
          tenant: tenantId,
        },
      })
      residentMap[fullName] = resident.id
    }
  }
  
  // ─── Historical Schedules & Assignments ───
  try {
    const schedulesPath = path.resolve(__dirname, '../../residency-optimizer/specification/historical_schedules_grid_v2.json')
    const schedulesRaw = fs.readFileSync(schedulesPath, 'utf-8')
    const historicalSchedules = JSON.parse(schedulesRaw)
    
    for (const [yearStr, residentsObj] of Object.entries(historicalSchedules)) {
      const yearNum = parseInt(yearStr, 10)
      if (!ayMap[yearNum]) continue
      
      const schedule = await payload.create({
        collection: 'schedules',
        data: {
          title: `Historical Schedule ${yearStr}`,
          academicYear: ayMap[yearNum],
          _status: 'published',
          tenant: tenantId,
        }
      })
      
      for (const [residentName, weeks] of Object.entries(residentsObj as Record<string, any[]>)) {
        const residentId = residentMap[residentName]
        if (!residentId) continue
        
        const pool = (payload.db as any).pool
        const values: any[] = []
        const placeholders: string[] = []
        let idx = 1
        
        for (let w = 0; w < weeks.length; w++) {
          const codename = weeks[w]
          if (!codename) continue
          const rotId = rotationMap[codename]
          if (!rotId) continue
          
          placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`)
          values.push(schedule.id, residentId, w + 1, rotId, tenantId)
        }
        
        if (placeholders.length > 0) {
          await pool.query(
            `INSERT INTO schedule_assignments (schedule_id, resident_id, week, rotation_id, tenant_id)
             VALUES ${placeholders.join(', ')}`,
            values
          )
        }
      }
    }
  } catch (e) {
    payload.logger.error(`Error loading historical schedules: ${e}`)
  }
  
  // ─── Transfer Credits ───
  try {
    const creditsPath = path.resolve(__dirname, '../../residency-optimizer/specification/resident_subspecialty_data_v2.json')
    const creditsRaw = fs.readFileSync(creditsPath, 'utf-8')
    const subspecialtyData = JSON.parse(creditsRaw)
    
    const parseSubspecialtyTag = (text: string): string | null => {
        text = text.toLowerCase()
        if (text.includes('id')) return 'Infectious Disease'
        if (text.includes('neph')) return 'Nephrology'
        if (text.includes('em')) return 'Emergency'
        if (text.includes('pulm')) return 'Pulmonology'
        if (text.includes('cards')) return 'Cardiology'
        if (text.includes('neuro')) return 'Neurology'
        if (text.includes('gi')) return 'Gastroenterology'
        if (text.includes('onc')) return 'Heme/Onc'
        if (text.includes('rheum')) return 'Rheumatology'
        if (text.includes('endo')) return 'Endocrinology'
        if (text.includes('geri')) return 'Geriatrics'
        if (text.includes('icu') || text.includes('ccm')) return 'ICU'
        if (text.includes('ward')) return 'Wards'
        return null
    }

    for (const [residentName, dataObj] of Object.entries(subspecialtyData)) {
      const residentId = residentMap[residentName]
      if (!residentId) continue
      
      const completed = (dataObj as any).Completed as string[]
      if (!completed || !Array.isArray(completed)) continue
      
      for (const comp of completed) {
         // Example: "IM ID (2w)"
         const match = comp.match(/(.*)\s+\((\d+)w\)/)
         if (match) {
             const namePart = match[1]
             const weeks = parseInt(match[2], 10)
             const cat = parseSubspecialtyTag(namePart)
             if (cat && tagMap[cat]) {
                 await payload.create({
                     collection: 'transfer-credits',
                     data: {
                         resident: residentId,
                         tag: tagMap[cat],
                         weeks: weeks,
                         fromProgram: 'Unknown Previous Program',
                         notes: `Transferred: ${comp}`,
                         tenant: tenantId,
                     }
                 })
             }
         }
      }
    }
  } catch (e) {
    payload.logger.error(`Error loading transfer credits: ${e}`)
  }

  payload.logger.info(
    `Seed completed: ${Object.keys(rotationMap).length} rotations, ` +
    `${uniqueCategories.length} tags, ` +
    `${Object.keys(residentMap).length} residents.`
  )
  } catch (e) {
    payload.logger.error(`FATAL ERROR IN SEED: ${e}`)
    console.error(e)
  }
}
