import type { CollectionConfig, Where } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'
import { setDefaultAvailableSince } from '@/hooks/setDefaultAvailableSince'

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
    baseListFilter: ({ req }) => {
      const cookieHeader = req.headers.get('cookie') || ''
      const match = cookieHeader.match(/payload-working-year=(\d+)/)
      if (!match) return null

      const workingYear = Number(match[1])
      const filter: Where = {
        and: [
          { 'availableSince.startingYear': { less_than_equal: workingYear } },
          {
            or: [
              { availableUntil: { exists: false } },
              { 'availableUntil.startingYear': { greater_than_equal: workingYear } },
            ],
          },
        ],
      }
      return filter
    },
  },
  hooks: {
    beforeValidate: [setDefaultAvailableSince],
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
      name: 'availableSince',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
      admin: {
        description: 'First academic year this rotation is active',
        position: 'sidebar',
      },
    },
    {
      name: 'availableUntil',
      type: 'relationship',
      relationTo: 'academic-years',
      admin: {
        description: 'Last academic year this rotation is active (blank = indefinite)',
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
    {
      name: 'staffingPreferences',
      type: 'join',
      collection: 'staffing-preferences',
      on: 'rotation',
    },
  ],
}
