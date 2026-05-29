'use client'
import React from 'react'
import { useTheme } from '@payloadcms/ui'

export const Logo: React.FC = () => {
  const { theme } = useTheme()
  const filter = theme === 'dark' ? 'invert(1)' : 'none'
  return (
    <div className="logo">
      <img src="/logo.svg" alt="Residency Optimizer Logo" style={{ maxHeight: '40px', maxWidth: '100%', height: '100%', width: 'auto', filter }} />
    </div>
  )
}

export const Icon: React.FC = () => {
  const { theme } = useTheme()
  const filter = theme === 'dark' ? 'invert(1)' : 'none'
  return (
    <div className="icon">
      <img src="/logo.svg" alt="Residency Optimizer Icon" style={{ maxHeight: '30px', maxWidth: '100%', height: '100%', width: 'auto', filter }} />
    </div>
  )
}
