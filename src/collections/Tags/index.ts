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
    defaultColumns: ['title', 'retired'],
    group: 'Program Structure',
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
      name: 'retired',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Soft-delete flag. Retired tags are hidden from new requirement creation.',
        position: 'sidebar',
      },
    },
  ],
}
