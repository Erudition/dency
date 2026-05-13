import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const StaffingPreferences: CollectionConfig = {
  slug: 'staffing-preferences',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rotation', 'academicYear', 'internCount', 'seniorCount', 'preferenceRank'],
    group: 'Requirements & Staffing',
    hidden: true,
    pagination: {
      defaultLimit: 100,
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data?.rotation && data?.academicYear) {
          try {
            const rotation = await req.payload.findByID({ collection: 'rotations', id: data.rotation })
            const year = await req.payload.findByID({ collection: 'academic-years', id: data.academicYear })
            if (rotation && year) {
              data.title = `${rotation.title} (${year.title})`
            }
          } catch (e) {
            // ignore if relation not found
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'academicYear',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
      index: true,
    },
    {
      name: 'rotation',
      type: 'relationship',
      relationTo: 'rotations',
      required: true,
      index: true,
    },
    {
      name: 'internCount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Number of interns (PGY-1) in this staffing configuration',
      },
    },
    {
      name: 'seniorCount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Number of seniors (PGY-2/3) in this staffing configuration',
      },
    },
    {
      name: 'preferenceRank',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Lower = more preferred. Rank 1 is the most desirable staffing combo.',
      },
    },
  ],
}
