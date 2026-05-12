import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Tenants } from './collections/Tenants'
import Users from './collections/Users'
import { AcademicYears } from './collections/AcademicYears'
import { Tags } from './collections/Tags'
import { Rotations } from './collections/Rotations'
import { StaffingPreferences } from './collections/StaffingPreferences'
import { AnnualRequirements } from './collections/AnnualRequirements'
import { GradRequirements } from './collections/GradRequirements'
import { Residents } from './collections/Residents'
import { TransferCredits } from './collections/TransferCredits'
import { AvoidanceRules } from './collections/AvoidanceRules'
import { Schedules } from './collections/Schedules'
import { ScheduleAssignments } from './collections/ScheduleAssignments'

import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { isSuperAdmin } from './access/isSuperAdmin'
import type { Config } from './payload-types'
import { getUserTenantIDs } from './utilities/getUserTenantIDs'
import { seed } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// eslint-disable-next-line no-restricted-exports
export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [
    // Infrastructure
    Users,
    Tenants,
    // Program Structure
    AcademicYears,
    Tags,
    Rotations,
    // Requirements & Staffing
    StaffingPreferences,
    AnnualRequirements,
    GradRequirements,
    // People
    Residents,
    TransferCredits,
    AvoidanceRules,
    // Scheduling
    Schedules,
    ScheduleAssignments,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL,
    },
  }),
  onInit: async (args) => {
    if (process.env.SEED_DB) {
      await seed(args)
    }
  },
  editor: lexicalEditor({}),
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  secret: process.env.PAYLOAD_SECRET as string,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  plugins: [
    multiTenantPlugin<Config>({
      collections: {
        'tags': {},
        'rotations': {},
        'staffing-preferences': {},
        'annual-requirements': {},
        'grad-requirements': {},
        'residents': {},
        'transfer-credits': {},
        'avoidance-rules': {},
        'schedules': {},
        'schedule-assignments': {},
      },
      tenantField: {
        access: {
          read: () => true,
          update: ({ req }) => {
            if (isSuperAdmin(req.user)) {
              return true
            }
            return getUserTenantIDs(req.user).length > 0
          },
        },
      },
      tenantsArrayField: {
        includeDefaultField: false,
      },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
    }),
  ],
})
