import type { CollectionConfig } from 'payload'

import { manageSchedulesAccess } from '@/access/manageSchedules'
import { broadcast } from '@/endpoints/sseConnectionManager'

export const Schedules: CollectionConfig = {
  slug: 'schedules',
  access: {
    create: manageSchedulesAccess,
    delete: manageSchedulesAccess,
    read: () => true,
    update: manageSchedulesAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'academicYear', 'candidate', '_status'],
    group: 'Scheduling',
    pagination: {
      defaultLimit: 100,
    },
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Validate year contiguity when attaching to a candidate
        if (!data?.candidate) return data

        const candidateId =
          typeof data.candidate === 'object' ? data.candidate.id : data.candidate

        // Resolve this schedule's academic year
        let scheduleYear: number | undefined
        if (data.academicYear) {
          const ayId =
            typeof data.academicYear === 'object' ? data.academicYear.id : data.academicYear
          const ay = await req.payload.findByID({
            collection: 'academic-years',
            id: ayId,
          })
          scheduleYear = ay.startingYear
        }
        if (scheduleYear == null) return data

        // Resolve the candidate's starting year
        const candidate = await req.payload.findByID({
          collection: 'candidates',
          id: candidateId,
        })
        const candidateStartAY =
          typeof candidate.startingYear === 'object'
            ? candidate.startingYear
            : await req.payload.findByID({
                collection: 'academic-years',
                id: candidate.startingYear,
              })
        const candidateStartYear = candidateStartAY.startingYear

        // Validate: schedule year must fall within [startingYear, startingYear + 2]
        if (scheduleYear < candidateStartYear || scheduleYear > candidateStartYear + 2) {
          throw new Error(
            `Schedule year ${scheduleYear} is outside the candidate's 3-year window ` +
              `(${candidateStartYear}–${candidateStartYear + 2}).`,
          )
        }

        // Validate: no duplicate year within the same candidate
        const existing = await req.payload.find({
          collection: 'schedules',
          where: {
            candidate: { equals: candidateId },
          },
          limit: 10,
        })
        for (const sched of existing.docs) {
          // Skip self (for updates)
          if (operation === 'update' && sched.id === data.id) continue

          const existingAY =
            typeof sched.academicYear === 'object'
              ? sched.academicYear
              : await req.payload.findByID({
                  collection: 'academic-years',
                  id: sched.academicYear,
                })
          if (existingAY.startingYear === scheduleYear) {
            throw new Error(
              `Candidate already has a schedule for year ${scheduleYear}. ` +
                `Remove the existing one first.`,
            )
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (!doc.candidate) return doc

        const candidateId =
          typeof doc.candidate === 'object' ? doc.candidate.id : doc.candidate
        const ayId =
          typeof doc.academicYear === 'object'
            ? doc.academicYear.startingYear ?? doc.academicYear.id
            : doc.academicYear

        if (operation === 'create') {
          await broadcast(candidateId, {
            event: 'schedule-created',
            data: {
              scheduleId: doc.id,
              title: doc.title,
              academicYear: ayId,
            },
          })
        } else {
          await broadcast(candidateId, {
            event: 'schedule-updated',
            data: {
              scheduleId: doc.id,
              title: doc.title,
            },
          })
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        if (!doc.candidate) return doc

        const candidateId =
          typeof doc.candidate === 'object' ? doc.candidate.id : doc.candidate

        await broadcast(candidateId, {
          event: 'schedule-deleted',
          data: {
            scheduleId: doc.id,
          },
        })
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'academicYear',
      type: 'relationship',
      relationTo: 'academic-years',
      required: true,
    },
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      admin: {
        description:
          'The planning session this schedule belongs to. Null for historical/standalone schedules.',
        position: 'sidebar',
      },
    },
    {
      name: 'scheduleAssignments',
      type: 'join',
      collection: 'schedule-assignments',
      on: 'schedule',
    },
  ],
}
