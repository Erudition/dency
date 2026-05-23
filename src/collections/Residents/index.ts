import type { CollectionConfig, Where } from 'payload'

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
    baseListFilter: ({ req }) => {
      const cookieHeader = req.headers.get('cookie') || ''
      const match = cookieHeader.match(/payload-working-year=(\d+)/)
      if (!match) return null

      const workingYear = Number(match[1])
      const filter: Where = {
        and: [
          { 'startYear.startingYear': { less_than_equal: workingYear } },
          { 'pgy3Year.startingYear': { greater_than_equal: workingYear } },
        ],
      }
      return filter
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
    {
      name: 'isSynthetic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Auto-generated placeholder for future-year scheduling. Cleaned up when real residents are enrolled.',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // When a real (non-synthetic) resident is created, auto-delete any
        // synthetic residents that share the same startYear.
        if (operation !== 'create' || data?.isSynthetic) return data

        const startYearId =
          typeof data?.startYear === 'object' ? data.startYear.id : data?.startYear
        if (!startYearId) return data

        try {
          const synthetics = await req.payload.find({
            collection: 'residents',
            where: {
              and: [
                { isSynthetic: { equals: true } },
                { startYear: { equals: startYearId } },
              ],
            },
            limit: 100,
            depth: 0,
          })

          if (synthetics.docs.length > 0) {
            req.payload.logger.info(
              `Cleaning up ${synthetics.docs.length} synthetic resident(s) for startYear ${startYearId}`,
            )
            await Promise.all(
              synthetics.docs.map((doc) =>
                req.payload.delete({
                  collection: 'residents',
                  id: doc.id,
                }),
              ),
            )
          }
        } catch {
          // Non-critical — don't block real resident creation if cleanup fails
        }

        return data
      },
    ],
  },
}
