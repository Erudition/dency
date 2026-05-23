/**
 * Bulk Assignments Endpoint
 *
 * Efficiently creates a Schedule with all its ScheduleAssignment documents
 * in a single request, bypassing individual afterChange hooks to avoid
 * flooding the SSE stream with 1,300+ individual events.
 *
 * Also handles synthetic (placeholder) resident creation: the frontend sends
 * an optional `syntheticResidents` array, and this endpoint upserts them
 * (find-by firstName+lastName+startYear+isSynthetic, create if missing)
 * before inserting assignments. A `residentIdMap` is returned so the
 * frontend can remap in-memory grid keys from synthetic IDs to real backend IDs.
 *
 * Route: POST /api/sync/bulk
 */

import type { Endpoint } from 'payload'
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs'
import { broadcast } from './sseConnectionManager'

interface BulkAssignmentInput {
  residentId: number | string // number for real residents, string for synthetic keys
  week: number
  rotationId: number
  locked: boolean
}

interface SyntheticResidentInput {
  frontendKey: string // e.g. "c2027-1"
  firstName: string
  lastName: string
  startYearId: number // backend AY ID
}

interface BulkRequestBody {
  candidateId: number
  title: string
  academicYearId: number
  assignments: BulkAssignmentInput[]
  syntheticResidents?: SyntheticResidentInput[]
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

    const { candidateId, title, academicYearId, assignments, syntheticResidents } = body

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
      // 0. Upsert synthetic residents and build frontendKey → backendId map
      const residentIdMap: Record<string, number> = {}

      if (syntheticResidents && syntheticResidents.length > 0) {
        for (const sr of syntheticResidents) {
          // Try to find an existing synthetic resident with matching name + startYear
          const existing = await req.payload.find({
            collection: 'residents',
            where: {
              and: [
                { isSynthetic: { equals: true } },
                { firstName: { equals: sr.firstName } },
                { lastName: { equals: sr.lastName } },
                { startYear: { equals: sr.startYearId } },
              ],
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })

          if (existing.docs.length > 0) {
            // Reuse existing synthetic resident
            residentIdMap[sr.frontendKey] = existing.docs[0].id as number
          } else {
            // Create new synthetic resident
            const created = await req.payload.create({
              collection: 'residents',
              data: {
                firstName: sr.firstName,
                lastName: sr.lastName,
                startYear: sr.startYearId,
                isSynthetic: true,
                ...(tenantId != null ? { tenant: tenantId } : {}),
              },
              overrideAccess: true,
            })
            residentIdMap[sr.frontendKey] = created.id as number
          }
        }
      }

      // 1. Remap assignment residentIds — replace synthetic frontend keys with backend IDs
      const resolvedAssignments = assignments.map((a) => {
        const residentId =
          typeof a.residentId === 'string' && residentIdMap[a.residentId]
            ? residentIdMap[a.residentId]
            : typeof a.residentId === 'string'
              ? parseInt(a.residentId, 10)
              : a.residentId
        return { ...a, residentId }
      })

      // 1.5. Clean up any existing schedule (and assignments) for this candidate and academic year to prevent duplicates
      const existingSchedules = await req.payload.find({
        collection: 'schedules',
        where: {
          and: [
            { candidate: { equals: candidateId } },
            { academicYear: { equals: academicYearId } },
          ],
        },
        limit: 10,
        depth: 0,
        overrideAccess: true,
      })

      for (const ex of existingSchedules.docs) {
        // Bulk delete child assignments
        await req.payload.delete({
          collection: 'schedule-assignments',
          where: { schedule: { equals: ex.id } },
          overrideAccess: true,
        })
        // Delete the schedule itself
        await req.payload.delete({
          collection: 'schedules',
          id: ex.id,
          overrideAccess: true,
        })
      }

      // 2. Create the Schedule document linked to the candidate
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

      // 3. Batch-insert all ScheduleAssignment documents
      // We use Promise.all with chunks to avoid overwhelming the DB
      const BATCH_SIZE = 100
      let insertedCount = 0

      for (let i = 0; i < resolvedAssignments.length; i += BATCH_SIZE) {
        const batch = resolvedAssignments.slice(i, i + BATCH_SIZE)
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

      // 4. Broadcast a single bulk-sync event
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
          residentIdMap,
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
