import type { CollectionConfig } from 'payload'

import { manageSchedulesAccess } from '@/access/manageSchedules'

export const Candidates: CollectionConfig = {
  slug: 'candidates',
  access: {
    create: manageSchedulesAccess,
    delete: manageSchedulesAccess,
    read: () => true,
    update: manageSchedulesAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startingYear', 'status'],
    group: 'Scheduling',
    description: 'Groups of 3-year schedule planning sessions for real-time collaboration.',
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
        description: 'A descriptive name for this planning session, e.g. "May 2026 Planning Session".',
      },
    },
    {
      name: 'startingYear',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
      admin: {
        description: 'The first academic year of this 3-year planning horizon.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Finalized', value: 'finalized' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        description:
          'Active = in progress. Finalized = year 1 was promoted to canonical. Archived = superseded.',
      },
    },
    {
      name: 'schedules',
      type: 'join',
      collection: 'schedules',
      on: 'candidate',
    },
  ],
}
