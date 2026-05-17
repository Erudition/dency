import { getUserTenantIDs } from '@/utilities/getUserTenantIDs'
import { isSuperAdmin } from './isSuperAdmin'
import { Access } from 'payload'

/**
 * Shared access control: super-admins have full access,
 * tenant-admins can manage data within their tenant(s),
 * and schedule-managers can manage schedules within their tenant(s).
 */
export const manageSchedulesAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isSuperAdmin(req.user)) {
    return true
  }

  // Check for admin role
  const adminTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-admin')
  if (adminTenantAccessIDs.length > 0) {
    return true
  }

  // Check for schedule manager role
  const managerTenantAccessIDs = getUserTenantIDs(req.user, 'schedule-manager')
  if (managerTenantAccessIDs.length > 0) {
    return true
  }

  return false
}
