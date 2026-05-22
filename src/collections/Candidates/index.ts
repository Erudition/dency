import type { CollectionConfig } from 'payload'

import { manageSchedulesAccess } from '@/access/manageSchedules'
import { autoFillTenant } from '@/hooks/autoFillTenant'

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
  hooks: {
    beforeChange: [autoFillTenant],
    afterDelete: [
      async ({ id, req }) => {
        // Cascade: delete all Schedules (and their Assignments) belonging to this Candidate
        const schedules = await req.payload.find({
          collection: 'schedules',
          where: { candidate: { equals: id } },
          limit: 100,
          depth: 0,
        })

        for (const schedule of schedules.docs) {
          // Delete all ScheduleAssignments for this Schedule
          const assignments = await req.payload.find({
            collection: 'schedule-assignments',
            where: { schedule: { equals: schedule.id } },
            limit: 10000,
            depth: 0,
          })
          for (const assignment of assignments.docs) {
            await req.payload.delete({
              collection: 'schedule-assignments',
              id: assignment.id,
            })
          }
          // Delete the Schedule itself
          await req.payload.delete({
            collection: 'schedules',
            id: schedule.id,
          })
        }
      },
    ],
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
