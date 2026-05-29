'use client'
import React from 'react'

export const Logo: React.FC = () => {
  return (
    <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        maskImage: 'url(/logo/logo.svg)',
        WebkitMaskImage: 'url(/logo/logo.svg)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        backgroundColor: 'currentColor',
        height: '40px',
        width: '40px'
      }} />
    </div>
  )
}

export const Icon: React.FC = () => {
  return (
    <div className="icon" style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        maskImage: 'url(/logo/logo.svg)',
        WebkitMaskImage: 'url(/logo/logo.svg)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        backgroundColor: 'currentColor',
        height: '30px',
        width: '30px'
      }} />
    </div>
  )
}

