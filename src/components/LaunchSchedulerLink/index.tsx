'use client'

import React from 'react'

/**
 * Dev-only navigation link in the Payload admin sidebar that opens
 * the frontend scheduler with the current user's JWT token.
 *
 * The link hits /api/launch-scheduler which extracts the user's
 * cookie-based token and redirects to the frontend with ?token=...
 */
export default function LaunchSchedulerLink() {

  return (
    <a
      href="/api/launch-scheduler"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        margin: '0.5rem 1rem',
        borderRadius: '0.5rem',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        color: '#10b981',
        textDecoration: 'none',
        fontSize: '0.8125rem',
        fontWeight: 600,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      Launch Scheduler
    </a>
  )
}
