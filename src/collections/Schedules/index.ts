import type { CollectionConfig } from 'payload'

import { manageSchedulesAccess } from '@/access/manageSchedules'

export const Schedules: CollectionConfig = {
  slug: 'schedules',
  access: {
    create: manageSchedulesAccess,
    delete: manageSchedulesAccess,
    read: () => true,
    update: manageSchedulesAccess,
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
