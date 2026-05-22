import type { CollectionConfig } from 'payload'

import { isSuperAdminAccess } from '@/access/isSuperAdmin'

export const AcademicYears: CollectionConfig = {
  slug: 'academic-years',
  access: {
    create: isSuperAdminAccess,
    delete: isSuperAdminAccess,
    read: () => true,
    update: isSuperAdminAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startingYear'],
    group: 'Program Structure',
    hidden: true,
    pagination: {
      defaultLimit: 100,
    },
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && data) {
          if (data.startingYear == null) {
            const existing = await req.payload.find({
              collection: 'academic-years',
              sort: '-startingYear',
              limit: 1,
            })
            const maxYear = existing.docs[0]?.startingYear
            const nextYear = maxYear != null ? maxYear + 1 : new Date().getFullYear()
            data.startingYear = nextYear
          }
          if (data.startingYear != null) {
            data.title = `AY${data.startingYear}`
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'startingYear',
      type: 'number',
      required: true,
      unique: true,
      index: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'clinicWeeksPerCycle',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      admin: {
        description:
          'Y in X+Y: how many consecutive weeks each cohort spends in clinic per cycle. ' +
          'Most programs use 1 (4+1). Some use 2 (4+2 or 6+2).',
      },
    },
    {
      name: 'canonicalSchedule',
      type: 'relationship',
      relationTo: 'schedules',
      admin: {
        description:
          'The official historical schedule for this academic year. ' +
          'Set automatically when a schedule is exported with the promotion checkbox.',
      },
    },
    {
      name: 'clinicCycles',
      type: 'join',
      collection: 'clinic-cycles',
      on: 'academicYear',
    },
    {
      name: 'annualRequirements',
      type: 'join',
      collection: 'annual-requirements',
      on: 'academicYear',
    },
  ],
}
