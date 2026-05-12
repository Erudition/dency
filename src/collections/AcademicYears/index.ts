import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const AcademicYears: CollectionConfig = {
  slug: 'academic-years',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'isActive'],
    group: 'Program Structure',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Display label, e.g. "2026-2027"',
      },
    },
    {
      name: 'startingYear',
      type: 'number',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The calendar year the academic year begins (e.g. 2026 for 2026-2027)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Default year for the optimizer UI',
        position: 'sidebar',
      },
    },
  ],
}
