import React from 'react'

export default async function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Residency Optimizer — Backend API</h1>
      <p>
        This is the Payload CMS backend for the Residency Optimizer.
        Visit <a href="/admin">/admin</a> to manage program data.
      </p>
    </div>
  )
}
