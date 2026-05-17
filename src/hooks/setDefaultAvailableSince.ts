import type { CollectionBeforeValidateHook } from 'payload'

/**
 * beforeValidate hook that auto-assigns `availableSince` to the first future
 * Academic Year (based on the current date) when creating a new document
 * if the field was not explicitly set.
 *
 * Academic years start July 1, so before July we're still in the prior AY.
 */
export const setDefaultAvailableSince: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation === 'create' && data && data.availableSince == null) {
    const now = new Date()
    const month = now.getMonth() // 0-indexed
    const currentAYStart = month >= 6 ? now.getFullYear() : now.getFullYear() - 1
    // The "first future academic year" is the next one starting after this AY
    const nextAYStart = currentAYStart + 1

    const result = await req.payload.find({
      collection: 'academic-years',
      where: { startingYear: { equals: nextAYStart } },
      limit: 1,
    })

    if (result.docs.length > 0) {
      data.availableSince = result.docs[0].id
    } else {
      // Fall back to the current AY if the next one doesn't exist yet
      const fallback = await req.payload.find({
        collection: 'academic-years',
        where: { startingYear: { equals: currentAYStart } },
        limit: 1,
      })
      if (fallback.docs.length > 0) {
        data.availableSince = fallback.docs[0].id
      }
    }
  }
  return data
}
