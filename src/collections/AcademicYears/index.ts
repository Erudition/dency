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
  },
  fields: [
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
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeValidate: [
          ({ data, siblingData }) => {
            const year = data?.startingYear ?? siblingData?.startingYear
            if (year != null) return `${year}-${year + 1}`
            return undefined
          },
        ],
      },
    },
  ],
}
