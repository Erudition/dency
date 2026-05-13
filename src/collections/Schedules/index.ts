import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const Schedules: CollectionConfig = {
  slug: 'schedules',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'academicYear', '_status'],
    group: 'Scheduling',
    pagination: {
      defaultLimit: 100,
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'academicYear',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
    },
    {
      name: 'scheduleAssignments',
      type: 'join',
      collection: 'schedule-assignments',
      on: 'schedule',
    },
  ],
}
