import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

export const assignTenantFromEmail: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  if (operation === 'create' && !req.user) {
    const email = data?.email

    if (!email) {
      throw new APIError('Email is required', 400)
    }

    const domain = email.split('@')[1]?.toLowerCase()
    
    if (!domain) {
      throw new APIError('Invalid email address', 400)
    }

    const tenants = await req.payload.find({
      collection: 'tenants',
      where: {
        'domains.domain': {
          equals: domain,
        },
      },
      depth: 0,
    })

    if (tenants.totalDocs === 0) {
      throw new APIError(`The domain ${domain} is not registered. Please contact your program administrator.`, 403)
    }

    const tenantId = tenants.docs[0].id

    // Assign the tenant with the default role
    data.tenants = [
      {
        tenant: tenantId,
        roles: ['tenant-viewer'],
      },
    ]

    // Prevent malicious role assignment during public registration
    data.roles = ['user']
  }
  
  return data
}
