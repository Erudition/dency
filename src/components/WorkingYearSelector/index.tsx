'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation.js'
import { ReactSelect } from '@payloadcms/ui'
import type { ReactSelectOption } from '@payloadcms/ui'

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
  const [options, setOptions] = useState<ReactSelectOption[]>([])
  const [selected, setSelected] = useState<ReactSelectOption | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await fetch('/api/academic-years?limit=100&sort=startingYear')
        const data = await res.json()
        const docs: AcademicYear[] = data.docs || []

        const opts: ReactSelectOption[] = docs.map((y) => ({
          label: y.title,
          value: String(y.startingYear),
        }))
        setOptions(opts)

        // Read cookie or default to current academic year
        const cookieVal = getCookie('payload-working-year')
        const match = opts.find((o) => o.value === cookieVal)
        if (match) {
          setSelected(match)
        } else {
          const currentAY = getCurrentAcademicStartYear()
          const fallback =
            opts.find((o) => o.value === String(currentAY)) || opts[opts.length - 1]
          setSelected(fallback)
          if (fallback) setCookie('payload-working-year', String(fallback.value))
        }
      } catch (e) {
        console.error('Failed to fetch academic years:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchYears()
  }, [])

  function handleChange(option: ReactSelectOption | ReactSelectOption[]) {
    const val = Array.isArray(option) ? option[0] : option
    if (!val) return
    setSelected(val)
    setCookie('payload-working-year', String(val.value))
    router.refresh()
  }

  if (loading || options.length === 0) return null

  return (
    <div
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--theme-elevation-150)',
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--theme-elevation-500)',
          marginBottom: '6px',
        }}
      >
        Working Year
      </label>
      <ReactSelect
        options={options}
        value={selected}
        onChange={handleChange}
        isClearable={false}
        isSearchable={false}
      />
    </div>
  )
}
