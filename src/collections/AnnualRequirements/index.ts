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
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['academicYear', 'tag', 'source', 'minimum', 'maximum', 'ideal'],
    group: 'Requirements & Staffing',
    description:
      'Operational requirements for a specific academic year + tag. One entry per tag × year. ' +
      'Min/max apply uniformly across all PGY levels. PGY-specific ideals are soft goals for scoring.',
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
        },
        {
          name: 'maximum',
          type: 'number',
          min: 0,
          admin: {
            description: 'Hard ceiling (weeks). Violation if exceeded.',
            width: '33%',
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
