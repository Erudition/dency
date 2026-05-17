'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation.js'

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
  // Academic year starts July 1 (month index 6)
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
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await fetch('/api/academic-years?limit=100&sort=startingYear')
        const data = await res.json()
        const docs: AcademicYear[] = data.docs || []
        setYears(docs)

        // Read cookie or default to current academic year
        const cookieVal = getCookie('payload-working-year')
        if (cookieVal && docs.some((y) => String(y.startingYear) === cookieVal)) {
          setSelected(cookieVal)
        } else {
          const currentAY = getCurrentAcademicStartYear()
          // Find the closest year in available options
          const match = docs.find((y) => y.startingYear === currentAY)
          const fallback = match ? String(match.startingYear) : docs.length > 0 ? String(docs[docs.length - 1].startingYear) : ''
          setSelected(fallback)
          if (fallback) setCookie('payload-working-year', fallback)
        }
      } catch (e) {
        console.error('Failed to fetch academic years:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchYears()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setSelected(val)
    setCookie('payload-working-year', val)
    router.refresh()
  }

  if (loading || years.length === 0) return null

  return (
    <div
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--theme-elevation-150)',
      }}
    >
      <label
        htmlFor="working-year-selector"
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
      <select
        id="working-year-selector"
        value={selected}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: '4px',
          border: '1px solid var(--theme-elevation-250)',
          backgroundColor: 'var(--theme-elevation-50)',
          color: 'var(--theme-text)',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        {years.map((y) => (
          <option key={y.id} value={String(y.startingYear)}>
            {y.title}
          </option>
        ))}
      </select>
    </div>
  )
}
