import type { CollectionConfig } from 'payload'

import { superAdminOrTenantAdminAccess } from '@/access/superAdminOrTenantAdmin'

export const Residents: CollectionConfig = {
  slug: 'residents',
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'startYear', 'leaveDate', 'leaveReason'],
    group: 'People',
    pagination: {
      defaultLimit: 100,
    },
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'displayName',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeValidate: [
          ({ data, siblingData }) => {
            const first = data?.firstName || siblingData?.firstName || ''
            const last = data?.lastName || siblingData?.lastName || ''
            return `${last}, ${first}`
          },
        ],
      },
    },
    {
      name: 'startYear',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
      admin: {
        description: 'The academic year they entered as PGY-1',
      },
    },
    {
      name: 'pgy3Year',
      type: 'relationship',
      relationTo: 'academic-years',
      admin: {
        description:
          'The academic year they will be/were PGY-3. Usually startYear + 2, but may differ for leaves/transfers.',
      },
    },
    {
      name: 'user',
      type: 'join',
      collection: 'users',
      on: 'resident',
      admin: {
        description: 'Login account associated with this resident',
        position: 'sidebar',
      },
    },
    {
      name: 'joinDate',
      type: 'date',
      admin: {
        description: 'Date the resident joined the program',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'leaveDate',
      type: 'date',
      admin: {
        description: 'Date they left the program (null = still active)',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'leaveReason',
      type: 'select',
      options: [
        { label: 'Graduated', value: 'graduated' },
        { label: 'Transferred Out', value: 'transferred_out' },
        { label: 'Dismissed', value: 'dismissed' },
        { label: 'On Leave', value: 'on_leave' },
      ],
      admin: {
        description: 'Reason for departure',
        condition: (data) => Boolean(data?.leaveDate),
      },
    },
    {
      name: 'avoidanceRules',
      type: 'join',
      collection: 'avoidance-rules',
      on: 'resident',
    },
    {
      name: 'transferCredits',
      type: 'join',
      collection: 'transfer-credits',
      on: 'resident',
    },
  ],
}
