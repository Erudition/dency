import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

const requirementSourceOptions = [
  { label: 'ACGME', value: 'acgme' },
  { label: 'MHS', value: 'mhs' },
  { label: 'Program', value: 'program' },
]

export const GradRequirements: CollectionConfig = {
  slug: 'grad-requirements',
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
      'Cumulative graduation requirements effective-dated to an academic year. ' +
      'Resolved against the resident\u2019s matriculation year (latest rule where effectiveYear \u2264 startYear).',
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
      admin: {
        description: 'Effective year: this rule applies to residents whose matriculation year is at or after this academic year, until a newer rule supersedes it.',
      },
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
            description: 'Hard floor (total weeks across residency)',
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
            description: 'Hard ceiling (total weeks across residency)',
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
            description: 'Soft goal (total weeks across residency)',
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
      label: 'PGY-Specific Milestone Ideals',
      admin: {
        description:
          'Cumulative milestone targets by PGY level. Soft goals for catch-up scoring.',
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
                description: 'Cumulative PGY-1 milestone ideal (weeks by end of PGY-1)',
                width: '33%',
              },
            },
            {
              name: 'pgy2Ideal',
              type: 'number',
              min: 0,
              admin: {
                description: 'Cumulative PGY-2 milestone ideal (weeks by end of PGY-2)',
                width: '33%',
              },
            },
            {
              name: 'pgy3Ideal',
              type: 'number',
              min: 0,
              admin: {
                description: 'Cumulative PGY-3 milestone ideal (weeks by end of PGY-3)',
                width: '33%',
              },
            },
          ],
        },
      ],
    },
  ],
}
