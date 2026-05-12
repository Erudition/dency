import { getUserTenantIDs } from '@/utilities/getUserTenantIDs'
import { isSuperAdmin } from './isSuperAdmin'
import { Access } from 'payload'

/**
 * Shared access control: super-admins have full access,
 * tenant-admins can manage data within their tenant(s).
 */
export const superAdminOrTenantAdminAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isSuperAdmin(req.user)) {
    return true
  }

  const adminTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-admin')

  if (adminTenantAccessIDs.length > 0) {
    return true
  }

  return false
}
