import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

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
    defaultColumns: ['title', 'description', 'retired'],
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
      name: 'retired',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Soft-delete flag. Retired tags are hidden from new requirement creation.',
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
