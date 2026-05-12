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
    useAsTitle: 'id',
    defaultColumns: ['academicYear', 'rotation', 'internCount', 'seniorCount', 'preferenceRank'],
    group: 'Requirements & Staffing',
  },
  fields: [
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
