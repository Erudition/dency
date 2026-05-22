import type { CollectionBeforeChangeHook } from 'payload'
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs'

/**
 * Shared beforeChange hook that auto-fills the `tenant` field from the
 * authenticated user's first tenant assignment. This allows the frontend
 * to create documents without knowing or sending the tenant ID.
 *
 * The multi-tenant plugin adds the `tenant` field to collections listed
 * in tenantDomains but does not auto-fill it on create — this hook does.
 */
export const autoFillTenant: CollectionBeforeChangeHook = ({ data, req, operation }) => {
  if (operation === 'create' && !data?.tenant && req.user) {
    const tenantIDs = getUserTenantIDs(req.user)
    if (tenantIDs.length > 0) {
      data!.tenant = tenantIDs[0]
    }
  }
  return data
}
