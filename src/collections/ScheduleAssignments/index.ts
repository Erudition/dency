import type { CollectionConfig } from 'payload'

import { manageSchedulesAccess } from '@/access/manageSchedules'
import { broadcast } from '@/endpoints/sseConnectionManager'
import { autoFillTenant } from '@/hooks/autoFillTenant'

export const ScheduleAssignments: CollectionConfig = {
  slug: 'schedule-assignments',
  access: {
    create: manageSchedulesAccess,
    delete: manageSchedulesAccess,
    read: () => true,
    update: manageSchedulesAccess,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['schedule', 'resident', 'week', 'rotation', 'locked'],
    group: 'Scheduling',
    description: 'Individual assignment cells within a schedule grid.',
    hidden: true,
    pagination: {
      defaultLimit: 100,
    },
  },
  hooks: {
    beforeChange: [autoFillTenant],
    afterChange: [
      async ({ doc, context, req }) => {
        // Skip SSE broadcast when called from the bulk endpoint
        if (context?.skipSSEBroadcast) return doc

        // Resolve the parent schedule to find its candidate
        const scheduleId =
          typeof doc.schedule === 'object' ? doc.schedule.id : doc.schedule
        try {
          const schedule = await req.payload.findByID({
            collection: 'schedules',
            id: scheduleId,
            depth: 0,
          })
          if (!schedule.candidate) return doc

          const candidateId =
            typeof schedule.candidate === 'object'
              ? schedule.candidate.id
              : schedule.candidate

          const rotationCodename =
            typeof doc.rotation === 'object' ? doc.rotation.codename : undefined

          // If we don't have the codename from the doc, look it up
          let codename = rotationCodename
          if (!codename) {
            const rotId =
              typeof doc.rotation === 'object' ? doc.rotation.id : doc.rotation
            const rotation = await req.payload.findByID({
              collection: 'rotations',
              id: rotId,
              depth: 0,
            })
            codename = rotation.codename
          }

          const residentId =
            typeof doc.resident === 'object' ? doc.resident.id : doc.resident

          await broadcast(candidateId, {
            event: 'assignment-change',
            data: {
              scheduleId,
              residentId,
              week: doc.week,
              rotation: codename,
              locked: doc.locked ?? false,
            },
          })
        } catch {
          // Schedule lookup failed — possibly deleted; skip broadcast
        }

        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const scheduleId =
          typeof doc.schedule === 'object' ? doc.schedule.id : doc.schedule
        try {
          const schedule = await req.payload.findByID({
            collection: 'schedules',
            id: scheduleId,
            depth: 0,
          })
          if (!schedule.candidate) return doc

          const candidateId =
            typeof schedule.candidate === 'object'
              ? schedule.candidate.id
              : schedule.candidate

          const residentId =
            typeof doc.resident === 'object' ? doc.resident.id : doc.resident

          await broadcast(candidateId, {
            event: 'assignment-deleted',
            data: {
              scheduleId,
              residentId,
              week: doc.week,
            },
          })
        } catch {
          // Schedule already deleted — skip broadcast
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'schedule',
      type: 'relationship',
      relationTo: 'schedules',
      required: true,
      index: true,
    },
    {
      name: 'resident',
      type: 'relationship',
      relationTo: 'residents',
      required: true,
      index: true,
    },
    {
      name: 'week',
      type: 'number',
      required: true,
      min: 1,
      max: 52,
      admin: {
        description: 'Week index (1–52) within the academic year',
      },
    },
    {
      name: 'rotation',
      type: 'relationship',
      relationTo: 'rotations',
      required: true,
    },
    {
      name: 'locked',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'If set, the generator will not overwrite this assignment',
        position: 'sidebar',
      },
    },
  ],
}
