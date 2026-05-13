import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

const requirementSourceOptions = [
  { label: 'ACGME', value: 'acgme' },
  { label: 'MHS', value: 'mhs' },
  { label: 'Program', value: 'program' },
]

export const AnnualRequirements: CollectionConfig = {
  slug: 'annual-requirements',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  indexes: [
    { fields: ['academicYear', 'tag', 'tenant'], unique: true },
  ],
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['academicYear', 'tag', 'source', 'minimum', 'maximum', 'ideal'],
    group: 'Requirements & Staffing',
    description:
      'Annual operational requirements effective-dated to an academic year. ' +
      'Resolved against the schedule year (latest rule where effectiveYear \u2264 scheduleYear).',
    hidden: true,
    pagination: {
      defaultLimit: 100,
    },
  },
  fields: [
    {
      name: 'academicYear',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
      index: true,
    },
    {
      name: 'tag',
      type: 'relationship',
      relationTo: 'tags',
      required: true,
      index: true,
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: requirementSourceOptions,
      admin: {
        description: 'Origin of this requirement (ACGME mandate, MHS policy, or program-specific)',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'minimum',
          type: 'number',
          min: 0,
          admin: {
            description: 'Hard floor (weeks). Violation if not met.',
            width: '33%',
          },
          validate: (val: number | null | undefined, { siblingData }: { siblingData: any }) => {
            if (val != null && siblingData.maximum != null && val > siblingData.maximum) {
              return 'Minimum cannot be greater than maximum'
            }
            if (val != null && siblingData.ideal != null && val > siblingData.ideal) {
              return 'Minimum cannot be greater than ideal'
            }
            return true
          },
        },
        {
          name: 'maximum',
          type: 'number',
          min: 0,
          admin: {
            description: 'Hard ceiling (weeks). Violation if exceeded.',
            width: '33%',
          },
          validate: (val: number | null | undefined, { siblingData }: { siblingData: any }) => {
            if (val != null && siblingData.minimum != null && val < siblingData.minimum) {
              return 'Maximum cannot be less than minimum'
            }
            if (val != null && siblingData.ideal != null && val < siblingData.ideal) {
              return 'Maximum cannot be less than ideal'
            }
            return true
          },
        },
        {
          name: 'ideal',
          type: 'number',
          min: 0,
          admin: {
            description: 'Soft goal (weeks). Closer is better, not a violation.',
            width: '33%',
          },
          validate: (val: number | null | undefined, { siblingData }: { siblingData: any }) => {
            if (val != null && siblingData.minimum != null && val < siblingData.minimum) {
              return 'Ideal cannot be less than minimum'
            }
            if (val != null && siblingData.maximum != null && val > siblingData.maximum) {
              return 'Ideal cannot be greater than maximum'
            }
            return true
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'PGY-Specific Ideals (for catch-up scoring)',
      admin: {
        description:
          'These are soft goals per PGY level. They cannot be hard limits because vacations, ' +
          'transfers, etc. will routinely break them. Meeting them improves the schedule score.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'pgy1Ideal',
              type: 'number',
              min: 0,
              admin: {
                description: 'PGY-1 ideal weeks for this tag in this year',
                width: '33%',
              },
            },
            {
              name: 'pgy2Ideal',
              type: 'number',
              min: 0,
              admin: {
                description: 'PGY-2 ideal weeks for this tag in this year',
                width: '33%',
              },
            },
            {
              name: 'pgy3Ideal',
              type: 'number',
              min: 0,
              admin: {
                description: 'PGY-3 ideal weeks for this tag in this year',
                width: '33%',
              },
            },
          ],
        },
      ],
    },
  ],
}
