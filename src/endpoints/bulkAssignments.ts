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
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs'
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
  path: '/sync/bulk',
  method: 'post',
  handler: async (req) => {
    // Auth check: require authenticated user
    if (!req.user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Payload's addDataAndFileToRequest middleware only runs for collection/global
    // routes, NOT for root custom endpoints. For custom endpoints we must parse
    // the body directly.
    const body = (await (req as Request).json().catch(() => null)) as BulkRequestBody | null

    if (!body?.candidateId || !body?.title || !body?.academicYearId || !body?.assignments) {
      return Response.json(
        { error: 'Missing required fields: candidateId, title, academicYearId, assignments' },
        { status: 400 },
      )
    }

    const { candidateId, title, academicYearId, assignments } = body

    // Determine the tenant from the authenticated user so all created documents
    // satisfy the multi-tenant plugin's required tenant field.
    let [tenantId] = getUserTenantIDs(req.user)
    if (tenantId == null) {
      // Super-admin has no explicit tenant assignments; fall back to first DB tenant
      const tenants = await req.payload.find({
        collection: 'tenants',
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (tenants.docs.length > 0) tenantId = tenants.docs[0].id
    }

    try {
      // 1. Create the Schedule document linked to the candidate
      const schedule = await req.payload.create({
        collection: 'schedules',
        data: {
          title,
          academicYear: academicYearId,
          candidate: candidateId,
          _status: 'published',
          ...(tenantId != null ? { tenant: tenantId } : {}),
        },
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
                ...(tenantId != null ? { tenant: tenantId } : {}),
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
