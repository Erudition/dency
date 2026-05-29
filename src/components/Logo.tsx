import React from 'react'

export const Logo: React.FC = () => {
  return (
    <div className="logo">
      <img src="/logo.svg" alt="Residency Optimizer Logo" style={{ maxHeight: '40px', maxWidth: '100%' }} />
    </div>
  )
}

export const Icon: React.FC = () => {
  return (
    <div className="icon">
      <img src="/logo.svg" alt="Residency Optimizer Icon" style={{ maxHeight: '30px', maxWidth: '100%' }} />
    </div>
  )
}
