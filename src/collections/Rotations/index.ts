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
    defaultColumns: ['title', 'codename', 'outpatientPercentage', 'isFlexible', 'tags'],
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
      maxLength: 8,
      validate: (value: string | null | undefined) => {
        if (!value) return true // required handles empty
        if (value.length > 8) return 'Codename must be 8 characters or fewer.'
        if (!/^[A-Z-]+$/.test(value)) return 'Codename must contain only capital letters and dashes.'
        return true
      },
      admin: {
        description: 'Short abbreviation (≤8 chars, A-Z and dashes only), e.g. MICU, W-RED. Displayed in the schedule grid.',
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
        description: 'Hue value (0–360). The frontend computes OKLCH colors from hue + intensity.',
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
      name: 'isPlaceholder',
      type: 'relationship',
      relationTo: 'tags',
      admin: {
        description: 'If set, this rotation is a placeholder for the given tag category (e.g. "Elective", "Clinic"). The admin or resident must resolve it to a specific rotation.',
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
      name: 'staffingConfigurations',
      type: 'array',
      admin: {
        description: 'Staffing rules apply indefinitely until superseded by a newer block.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'since',
          type: 'relationship',
          relationTo: 'academic-years',
          required: true,
        },
        {
          name: 'preferences',
          type: 'array',
          admin: {
            description: 'Drag rows to rank (top = most preferred).',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'internCount',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: { width: '50%' },
                },
                {
                  name: 'seniorCount',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
