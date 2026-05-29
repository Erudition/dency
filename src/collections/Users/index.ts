import type { CollectionConfig } from 'payload'

import { createAccess } from './access/create'
import { readAccess } from './access/read'
import { updateAndDeleteAccess } from './access/updateAndDelete'
import { externalUsersLogin } from './endpoints/externalUsersLogin'
import { ensureUniqueUsername } from './hooks/ensureUniqueUsername'
import { isSuperAdmin } from '@/access/isSuperAdmin'
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs'
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain'
import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'
import { assignTenantFromEmail } from './hooks/assignTenantFromEmail'
import { sanitizeTenants } from './hooks/sanitizeTenants'

const defaultTenantArrayField = tenantsArrayField({
  tenantsArrayFieldName: 'tenants',
  tenantsArrayTenantFieldName: 'tenant',
  tenantsCollectionSlug: 'tenants',
  arrayFieldAccess: {},
  tenantFieldAccess: {},
  rowFields: [
    {
      name: 'roles',
      type: 'select',
      defaultValue: ['tenant-viewer'],
      hasMany: true,
      options: [
        { label: 'Admin', value: 'tenant-admin' },
        { label: 'Schedule Manager', value: 'schedule-manager' },
        { label: 'Viewer', value: 'tenant-viewer' },
      ],
      required: true,
      // Access is governed by the sanitizeTenants beforeChange hook on the Users collection
    },
  ],
})

const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: createAccess,
    delete: updateAndDeleteAccess,
    read: readAccess,
    update: updateAndDeleteAccess,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'resident', 'roles', 'username'],
    pagination: {
      defaultLimit: 100,
    },
    hidden: ({ user }) => {
      if (isSuperAdmin(user as any)) return false
      const tenantAdminIDs = getUserTenantIDs(user as any, 'tenant-admin')
      return tenantAdminIDs.length === 0
    },
  },
  auth: true,
  endpoints: [externalUsersLogin],
  fields: [
    {
      type: 'text',
      name: 'password',
      hidden: true,
      access: {
        read: () => false, // Hide password field from read access
        update: ({ req, id }) => {
          const { user } = req
          if (!user) {
            return false
          }

          if (id === user.id) {
            // Allow user to update their own password
            return true
          }

          return isSuperAdmin(user)
        },
      },
    },
    {
      admin: {
        position: 'sidebar',
      },
      name: 'roles',
      type: 'select',
      defaultValue: ['user'],
      hasMany: true,
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'User', value: 'user' },
      ],
      access: {
        create: ({ req }) => isSuperAdmin(req.user),
        update: ({ req }) => isSuperAdmin(req.user),
      },
    },
    {
      name: 'username',
      type: 'text',
      hooks: {
        beforeValidate: [ensureUniqueUsername],
      },
      index: true,
    },
    {
      ...defaultTenantArrayField,
      admin: {
        ...(defaultTenantArrayField?.admin || {}),
        position: 'sidebar',
      },
    },
    {
      name: 'resident',
      type: 'relationship',
      relationTo: 'residents',
      admin: {
        description: 'Link this user account to a Resident clinical record',
        position: 'sidebar',
      },
    },
  ],
  // The following hook sets a cookie based on the domain a user logs in from.
  // It checks the domain and matches it to a tenant in the system, then sets
  // a 'payload-tenant' cookie for that tenant.

  hooks: {
    beforeValidate: [assignTenantFromEmail],
    beforeChange: [sanitizeTenants],
    afterLogin: [setCookieBasedOnDomain],
  },
}

export default Users
