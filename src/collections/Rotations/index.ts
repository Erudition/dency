import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const Rotations: CollectionConfig = {
  slug: 'rotations',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'codename', 'intensity', 'outpatientPercentage'],
    group: 'Program Structure',
    pagination: {
      defaultLimit: 100,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Full clinical name, e.g. "Medical ICU"',
      },
    },
    {
      name: 'codename',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Machine identifier, e.g. MICU, RED. Used as the key in the scheduling engine.',
      },
    },

    {
      name: 'intensity',
      type: 'number',
      required: true,
      min: 0,
      max: 5,
      admin: {
        description: 'Workload score (0 = no clinical work, 5 = maximum intensity)',
      },
    },
    {
      name: 'outpatientPercentage',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      defaultValue: 0,
      admin: {
        description: '0 = fully inpatient, 100 = fully ambulatory',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color or hue value for UI display',
      },
    },
    {
      name: 'isFlexible',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Eligible for Jeopardy/Backup coverage',
        position: 'sidebar',
      },
    },
    {
      name: 'retired',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Soft-delete flag',
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Educational/audit buckets this rotation counts toward',
      },
    },
  ],
}
