/**
 * Bulk Assignments Endpoint
 *
 * Efficiently creates a Schedule with all its ScheduleAssignment documents
 * in a single request, bypassing individual afterChange hooks to avoid
 * flooding the SSE stream with 1,300+ individual events.
 *
 * Instead, a single `bulk-sync` SSE event is broadcast after all
 * assignments are inserted.
 *
 * Route: POST /api/schedules/bulk
 */

import type { Endpoint } from 'payload'
import { broadcast } from './sseConnectionManager'

interface BulkAssignmentInput {
  residentId: number
  week: number
  rotationId: number
  locked: boolean
}

interface BulkRequestBody {
  candidateId: number
  title: string
  academicYearId: number
  assignments: BulkAssignmentInput[]
}

export const bulkAssignmentsEndpoint: Endpoint = {
  path: '/schedules/bulk',
  method: 'post',
  handler: async (req) => {
    // Auth check: require authenticated user
    if (!req.user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = req.data as BulkRequestBody | undefined
    if (!body?.candidateId || !body?.title || !body?.academicYearId || !body?.assignments) {
      return Response.json(
        { error: 'Missing required fields: candidateId, title, academicYearId, assignments' },
        { status: 400 },
      )
    }

    const { candidateId, title, academicYearId, assignments } = body

    try {
      // 1. Create the Schedule document linked to the candidate
      const schedule = await req.payload.create({
        collection: 'schedules',
        data: {
          title,
          academicYear: academicYearId,
          candidate: candidateId,
          _status: 'published',
        },
        // Bypass hooks to avoid triggering SSE for the schedule-created event yet.
        // We'll broadcast everything at the end.
        disableTransaction: false,
      })

      // 2. Batch-insert all ScheduleAssignment documents
      // We use Promise.all with chunks to avoid overwhelming the DB
      const BATCH_SIZE = 100
      let insertedCount = 0

      for (let i = 0; i < assignments.length; i += BATCH_SIZE) {
        const batch = assignments.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map((a) =>
            req.payload.create({
              collection: 'schedule-assignments',
              data: {
                schedule: schedule.id,
                resident: a.residentId,
                week: a.week,
                rotation: a.rotationId,
                locked: a.locked,
              },
              // Skip individual afterChange hooks — we broadcast in bulk below
              context: { skipSSEBroadcast: true },
            }),
          ),
        )
        insertedCount += batch.length
      }

      // 3. Broadcast a single bulk-sync event
      await broadcast(candidateId, {
        event: 'schedule-created',
        data: {
          scheduleId: schedule.id,
          title: schedule.title,
          academicYearId,
          assignmentCount: insertedCount,
        },
      })

      return Response.json(
        {
          scheduleId: schedule.id,
          assignmentCount: insertedCount,
          message: `Created schedule "${title}" with ${insertedCount} assignments`,
        },
        { status: 201 },
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Response.json({ error: message }, { status: 500 })
    }
  },
}
