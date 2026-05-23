import type { CollectionBeforeValidateHook } from 'payload'
import { isSuperAdmin } from '@/access/isSuperAdmin'
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs'

/**
 * Shared beforeValidate hook that auto-fills the `tenant` field.
 *
 * Priority:
 *  1. If the data already includes a tenant, leave it alone.
 *  2. If the user has explicit tenant assignments, use the first one.
 *  3. If the user is a super-admin (no tenant assignments), fall back to
 *     the first tenant in the database — super-admins manage all tenants
 *     so this is always correct in a single-program deployment.
 *
 * Must run as a beforeValidate hook so the tenant field is populated
 * before Payload's multi-tenant plugin evaluates access control.
 */
export const autoFillTenant: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  if (operation === 'create' && !data?.tenant && req.user) {
    const tenantIDs = getUserTenantIDs(req.user)

    if (tenantIDs.length > 0) {
      // Normal tenant user — use their first assigned tenant
      data!.tenant = tenantIDs[0]
    } else if (isSuperAdmin(req.user)) {
      // Super-admin has no explicit tenant rows; fall back to first DB tenant
      const result = await req.payload.find({
        collection: 'tenants',
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (result.docs.length > 0) {
        data!.tenant = result.docs[0].id
      }
    }
  }
  return data
}
