import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const AvoidanceRules: CollectionConfig = {
  slug: 'avoidance-rules',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['resident', 'avoidedResident'],
    group: 'People',
    description: 'Pairs of residents who should not be co-scheduled.',
  },
  fields: [
    {
      name: 'resident',
      type: 'relationship',
      relationTo: 'residents',
      required: true,
      index: true,
    },
    {
      name: 'avoidedResident',
      type: 'relationship',
      relationTo: 'residents',
      required: true,
      index: true,
    },
  ],
}
