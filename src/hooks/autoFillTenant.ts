import type { CollectionBeforeValidateHook } from 'payload'
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs'

/**
 * Shared beforeValidate hook that auto-fills the `tenant` field from the
 * authenticated user's first tenant assignment. This allows the frontend
 * to create documents without knowing or sending the tenant ID.
 *
 * Must run as a beforeValidate (not beforeChange) hook so that the tenant
 * field is populated before Payload's multi-tenant plugin evaluates access
 * control — which happens before beforeChange hooks run.
 */
export const autoFillTenant: CollectionBeforeValidateHook = ({ data, req, operation }) => {
  if (operation === 'create' && !data?.tenant && req.user) {
    const tenantIDs = getUserTenantIDs(req.user)
    if (tenantIDs.length > 0) {
      data!.tenant = tenantIDs[0]
    }
  }
  return data
}
