'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation.js'
import { SelectInput } from '@payloadcms/ui'
import type { OptionObject } from 'payload'

type AcademicYear = {
  id: number
  title: string
  startingYear: number
}

/**
 * Determines the current academic year based on the date.
 * Academic years start July 1, so before July we're still in the prior AY.
 */
function getCurrentAcademicStartYear(): number {
  const now = new Date()
  const month = now.getMonth() // 0-indexed
  const year = now.getFullYear()
  return month >= 6 ? year : year - 1
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : undefined
}

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365}`
}

export default function WorkingYearSelector() {
  const router = useRouter()
  const [options, setOptions] = useState<OptionObject[]>([])
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await fetch('/api/academic-years?limit=100&sort=startingYear')
        const data = await res.json()
        const docs: AcademicYear[] = data.docs || []

        const opts: OptionObject[] = docs.map((y) => ({
          label: y.title,
          value: String(y.startingYear),
        }))
        setOptions(opts)

        // Read cookie or default to current academic year
        const cookieVal = getCookie('payload-working-year')
        const match = opts.find((o) => o.value === cookieVal)
        if (match) {
          setSelected(match.value)
        } else {
          const currentAY = getCurrentAcademicStartYear()
          const fallback =
            opts.find((o) => o.value === String(currentAY)) || opts[opts.length - 1]
          if (fallback) {
            setSelected(fallback.value)
            setCookie('payload-working-year', String(fallback.value))
          }
        }
      } catch (e) {
        console.error('Failed to fetch academic years:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchYears()
  }, [])

  function handleChange(option: any) {
    const val = Array.isArray(option) ? option[0] : option
    if (!val || !val.value) return
    setSelected(val.value)
    setCookie('payload-working-year', String(val.value))
    router.refresh()
  }

  if (loading || options.length === 0) return null

  return (
    <div className="tenant-selector" style={{ width: '100%', marginBottom: '2rem' }}>
      <SelectInput
        label="Working Year"
        name="workingYear"
        path="workingYear"
        options={options}
        value={selected}
        onChange={handleChange}
        isClearable={false}
      />
    </div>
  )
}
