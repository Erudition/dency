import type { CollectionBeforeValidateHook } from 'payload'

/**
 * beforeValidate hook that automatically generates the preferences array 
 * under staffingConfigurations if the ranges (minInterns, maxInterns, 
 * minSeniors, maxSeniors) are specified and the preferences array is empty.
 */
export const populateStaffingPreferences: CollectionBeforeValidateHook = async ({
  data,
}) => {
  if (data && Array.isArray(data.staffingConfigurations)) {
    data.staffingConfigurations = data.staffingConfigurations.map((config: any) => {
      const { minInterns, maxInterns, minSeniors, maxSeniors, preferences } = config

      // Check if all four ranges are populated with valid numbers
      const hasRanges =
        minInterns !== undefined && minInterns !== null &&
        maxInterns !== undefined && maxInterns !== null &&
        minSeniors !== undefined && minSeniors !== null &&
        maxSeniors !== undefined && maxSeniors !== null

      // Check if preferences list is empty/missing
      const isPrefsEmpty = !preferences || (Array.isArray(preferences) && preferences.length === 0)

      if (hasRanges && isPrefsEmpty) {
        const generatedPrefs: Array<{ internCount: number; seniorCount: number }> = []
        
        const minIC = Number(minInterns)
        const maxIC = Number(maxInterns)
        const minSC = Number(minSeniors)
        const maxSC = Number(maxSeniors)

        if (minIC <= maxIC && minSC <= maxSC) {
          for (let ic = minIC; ic <= maxIC; ic++) {
            for (let sc = minSC; sc <= maxSC; sc++) {
              generatedPrefs.push({ internCount: ic, seniorCount: sc })
            }
          }
        }

        return {
          ...config,
          preferences: generatedPrefs,
        }
      }
      return config
    })
  }
  return data
}
