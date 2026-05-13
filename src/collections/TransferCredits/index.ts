import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const TransferCredits: CollectionConfig = {
  slug: 'transfer-credits',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['resident', 'tag', 'weeks', 'fromProgram'],
    group: 'People',
    description:
      'Educational credit a transfer-in resident brings from their prior program, per tag.',
    hidden: true,
    pagination: {
      defaultLimit: 100,
    },
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
      name: 'tag',
      type: 'relationship',
      relationTo: 'tags',
      required: true,
      admin: {
        description: 'The educational bucket this credit counts toward',
      },
    },
    {
      name: 'weeks',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Number of weeks of credit from the prior program',
      },
    },
    {
      name: 'fromProgram',
      type: 'text',
      admin: {
        description: 'Name of the prior residency program',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Free text for additional context',
      },
    },
  ],
}
