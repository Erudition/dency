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
      name: 'gradRequirements',
      type: 'join',
      collection: 'grad-requirements',
      on: 'academicYear',
    },
    {
      name: 'annualRequirements',
      type: 'join',
      collection: 'annual-requirements',
      on: 'academicYear',
    },
    {
      name: 'staffingPreferences',
      type: 'join',
      collection: 'staffing-preferences',
      on: 'academicYear',
    },
  ],
}
