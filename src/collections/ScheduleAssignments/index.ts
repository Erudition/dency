import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const ScheduleAssignments: CollectionConfig = {
  slug: 'schedule-assignments',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['schedule', 'resident', 'week', 'rotation', 'locked'],
    group: 'Scheduling',
    description: 'Individual assignment cells within a schedule grid.',
  },
  fields: [
    {
      name: 'schedule',
      type: 'relationship',
      relationTo: 'schedules',
      required: true,
      index: true,
    },
    {
      name: 'resident',
      type: 'relationship',
      relationTo: 'residents',
      required: true,
      index: true,
    },
    {
      name: 'week',
      type: 'number',
      required: true,
      min: 1,
      max: 52,
      admin: {
        description: 'Week index (1–52) within the academic year',
      },
    },
    {
      name: 'rotation',
      type: 'relationship',
      relationTo: 'rotations',
      required: true,
    },
    {
      name: 'locked',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'If set, the generator will not overwrite this assignment',
        position: 'sidebar',
      },
    },
  ],
}
