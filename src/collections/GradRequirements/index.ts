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
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['startYear', 'tag', 'source', 'minimum', 'maximum', 'ideal'],
    group: 'Requirements & Staffing',
    description:
      'Cumulative graduation requirements tied to a class entry year. ' +
      'Tracks total weeks across the full residency for a given tag.',
  },
  fields: [
    {
      name: 'startYear',
      type: 'number',
      required: true,
      index: true,
      admin: {
        description: 'The class entry year (e.g. 2026 for the class starting July 2026)',
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
        },
        {
          name: 'maximum',
          type: 'number',
          min: 0,
          admin: {
            description: 'Hard ceiling (total weeks across residency)',
            width: '33%',
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
