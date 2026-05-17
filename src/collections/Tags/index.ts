import type { CollectionConfig, Where } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'
import { setDefaultAvailableSince } from '@/hooks/setDefaultAvailableSince'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'description', 'availableSince', 'availableUntil'],
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
        description: 'Educational/audit bucket name, e.g. "Wards", "ICU", "Cardiology"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Hint for what rotations apply to the tag',
      },
    },
    {
      name: 'availableSince',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
      admin: {
        description: 'First academic year this tag is active',
        position: 'sidebar',
      },
    },
    {
      name: 'availableUntil',
      type: 'relationship',
      relationTo: 'academic-years',
      admin: {
        description: 'Last academic year this tag is active (blank = indefinite)',
        position: 'sidebar',
      },
    },
    {
      name: 'gradRequirements',
      type: 'join',
      collection: 'grad-requirements',
      on: 'tag',
    },
    {
      name: 'annualRequirements',
      type: 'join',
      collection: 'annual-requirements',
      on: 'tag',
    },
  ],
}
