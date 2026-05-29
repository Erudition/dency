import type { CollectionBeforeChangeHook } from 'payload'
import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getUserTenantIDs } from '../../../utilities/getUserTenantIDs'

export const sanitizeTenants: CollectionBeforeChangeHook = async ({ data, req, originalDoc, operation }) => {
  if ((operation === 'update' || operation === 'create') && data.tenants && req.user) {
    if (isSuperAdmin(req.user)) {
      return data // Super admin can do anything
    }

    const adminTenants = getUserTenantIDs(req.user, 'tenant-admin')
    
    // If the user has no admin tenants, they cannot change the tenants array at all
    if (adminTenants.length === 0) {
      data.tenants = originalDoc?.tenants || []
      return data
    }

    // A tenant-admin is updating the user.
    // They can ONLY modify the roles/presence of tenants they are an admin of.
    // They cannot modify or remove tenants they are not an admin of.
    const newTenants = []
    const originalTenants = originalDoc?.tenants || []
    
    // Keep all original tenants that the current user is NOT an admin of
    for (const ot of originalTenants) {
      const tenantIdStr = typeof ot.tenant === 'object' ? ot.tenant.id : ot.tenant
      if (!adminTenants.includes(tenantIdStr as number)) {
        newTenants.push(ot)
      }
    }
    
    // Add the tenants that the current user submitted, IF they are an admin of them
    for (const nt of data.tenants) {
      const tenantIdStr = typeof nt.tenant === 'object' ? nt.tenant.id : nt.tenant
      if (adminTenants.includes(tenantIdStr as number)) {
        newTenants.push(nt)
      }
    }
    
    data.tenants = newTenants
  }
  return data
}
