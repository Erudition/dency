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

  // ─── Tenant ───
  const mhsTenant = await payload.create({
    collection: 'tenants',
    data: { name: 'MHS Internal Medicine', slug: 'mhs', domain: 'localhost' },
  })
  const tenantId = mhsTenant.id

  // ─── Users ───
  await payload.create({
    collection: 'users',
    data: { email: 'demo@payloadcms.com', password: 'demo', roles: ['super-admin'] },
  })
  await payload.create({
    collection: 'users',
    data: {
      email: 'admin@mhs.mil', password: 'demo', username: 'mhs-admin',
      tenants: [{ roles: ['tenant-admin'], tenant: tenantId }],
    },
  })

  // ─── Academic Years ───
  const ayMap: Record<number, number> = {} // startingYear → record ID
  for (const year of [2024, 2025, 2026]) {
    const ay = await payload.create({
      collection: 'academic-years',
      data: {
        startingYear: year,
      },
    })
    ayMap[year] = ay.id
  }

  // ─── Tags ───
  // Collect unique categories from rotation data
  const uniqueCategories = [...new Set(ROTATION_DATA.map((r) => r.category))]
  const tagMap: Record<string, number> = {} // category name → tag ID

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
    const rotation = await payload.create({
      collection: 'rotations',
      data: {
        title: r.title,
        codename: r.codename,
        abbreviation: r.abbr,
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

    // Seed the min and max as preference ranks 1 (preferred) and max rank
    // Rank 1 = minimum staffing (most preferred), highest rank = maximum
    const combos: Array<{ interns: number; seniors: number; rank: number }> = []

    // Add the minimum combo as rank 1
    combos.push({ interns: r.minInterns, seniors: r.minSeniors, rank: 1 })

    // Add the maximum combo as rank 2 (if different from min)
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

  // ─── Annual Requirements (for AY 2026) ───
  // Build requirements from the rotation data's pgy1/pgy2/pgy3 fields,
  // aggregated by category (tag). One entry per tag.
  const reqByTag: Record<string, { pgy1: number; pgy2: number; pgy3: number }> = {}

  for (const r of ROTATION_DATA) {
    const cat = r.category
    if (!reqByTag[cat]) reqByTag[cat] = { pgy1: 0, pgy2: 0, pgy3: 0 }

    // Take the max across rotations in the same category
    const pgy1 = (r as any).pgy1 ?? 0
    const pgy2 = (r as any).pgy2 ?? 0
    const pgy3 = (r as any).pgy3 ?? 0

    reqByTag[cat].pgy1 = Math.max(reqByTag[cat].pgy1, pgy1)
    reqByTag[cat].pgy2 = Math.max(reqByTag[cat].pgy2, pgy2)
    reqByTag[cat].pgy3 = Math.max(reqByTag[cat].pgy3, pgy3)
  }

  for (const [catName, ideals] of Object.entries(reqByTag)) {
    const tagId = tagMap[catName]
    if (!tagId) continue

    // Only create a requirement if there's at least one nonzero ideal
    const maxIdeal = Math.max(ideals.pgy1, ideals.pgy2, ideals.pgy3)
    if (maxIdeal === 0) continue

    await payload.create({
      collection: 'annual-requirements',
      data: {
        academicYear: ayMap[2026],
        tag: tagId,
        source: 'mhs',
        // For now, use the max ideal as the minimum (matching current engine behavior)
        minimum: maxIdeal,
        pgy1Ideal: ideals.pgy1 || undefined,
        pgy2Ideal: ideals.pgy2 || undefined,
        pgy3Ideal: ideals.pgy3 || undefined,
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

  payload.logger.info(
    `Seed completed: ${Object.keys(rotationMap).length} rotations, ` +
    `${uniqueCategories.length} tags, ` +
    `${Object.keys(residentMap).length} residents.`,
  )
}
