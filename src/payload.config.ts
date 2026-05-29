import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { Tenants } from './collections/Tenants'
import Users from './collections/Users'
import { AcademicYears } from './collections/AcademicYears'
import { Tags } from './collections/Tags'
import { Rotations } from './collections/Rotations'
import { AnnualRequirements } from './collections/AnnualRequirements'
import { GradRequirements } from './collections/GradRequirements'
import { Residents } from './collections/Residents'
import { TransferCredits } from './collections/TransferCredits'
import { AvoidanceRules } from './collections/AvoidanceRules'
import { Schedules } from './collections/Schedules'
import { ScheduleAssignments } from './collections/ScheduleAssignments'

import { Candidates } from './collections/Candidates'

import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { isSuperAdmin } from './access/isSuperAdmin'
import type { Config } from './payload-types'
import { getUserTenantIDs } from './utilities/getUserTenantIDs'
import { seed } from './seed'
import { scheduleSSEEndpoint } from './endpoints/scheduleSSE'
import { bulkAssignmentsEndpoint } from './endpoints/bulkAssignments'
import { launchSchedulerEndpoint } from './endpoints/launchScheduler'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// eslint-disable-next-line no-restricted-exports
export default buildConfig({
  cors: [
    'https://erudition.github.io',
    ...(process.env.PAYLOAD_PUBLIC_SERVER_URL ? [process.env.PAYLOAD_PUBLIC_SERVER_URL] : []),
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : []),
  ],
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM || 'noreply@example.com',
    defaultFromName: 'Residency Optimizer',
    transportOptions: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
  }),
  endpoints: [scheduleSSEEndpoint, bulkAssignmentsEndpoint, launchSchedulerEndpoint],
  admin: {
    user: 'users',
    components: {
      beforeNavLinks: ['@/components/WorkingYearSelector#default'],
      afterNavLinks: ['@/components/LaunchSchedulerLink#default'],
      graphics: {
        Logo: '@/components/Logo#Logo',
        Icon: '@/components/Logo#Icon',
      },
    },
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
    AnnualRequirements,
    GradRequirements,
    // People
    Residents,
    TransferCredits,
    AvoidanceRules,
    // Scheduling
    Candidates,
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
        'rotations': {
          useBaseFilter: false,
        },
        'annual-requirements': {},
        'grad-requirements': {},
        'residents': {
          useBaseFilter: false,
        },
        'transfer-credits': {},
        'avoidance-rules': {},
        'candidates': {},
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
