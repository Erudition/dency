import type { CollectionConfig, Where } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const ClinicCycles: CollectionConfig = {
  slug: 'clinic-cycles',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'number', 'academicYear', 'residents'],
    group: 'Scheduling',
    description:
      'Each document is a clinic cycle cohort in the X+Y model. ' +
      'The number of cohorts × Y (clinic weeks per cycle) = Z (total cycle length). ' +
      'Add or remove cohorts to experiment with different X+Y configurations.',
    pagination: {
      defaultLimit: 100,
    },
    baseListFilter: ({ req }) => {
      const cookieHeader = req.headers.get('cookie') || ''
      const match = cookieHeader.match(/payload-working-year=(\d+)/)
      if (!match) return null

      const workingYear = Number(match[1])
      const filter: Where = {
        'academicYear.startingYear': { equals: workingYear },
      }
      return filter
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.number != null) {
          data.label = `Clinic Cycle ${data.number}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'number',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description:
          'Cohort number (1-based). "Clinic Cycle 1" = clinic on the first week of the year.',
      },
    },
    {
      name: 'label',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated from cohort number',
      },
    },
    {
      name: 'academicYear',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
      index: true,
      admin: {
        description: 'The academic year this cycle configuration applies to',
      },
    },
    {
      name: 'residents',
      type: 'relationship',
      relationTo: 'residents',
      hasMany: true,
      admin: {
        description: 'Residents assigned to this clinic cycle for this academic year',
      },
    },
  ],
}
