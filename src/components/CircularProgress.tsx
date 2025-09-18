'use client'

import React from 'react'

interface CircularProgressProps {
  value: number
  maxValue: number
  size?: number
  strokeWidth?: number
  primaryColor?: string
  secondaryColor?: string
  label?: string
  sublabel?: string
  centerText?: boolean
}

export default function CircularProgress({
  value,
  maxValue,
  size = 200,
  strokeWidth = 12,
  primaryColor = '#ffd020',
  secondaryColor = '#E9ECEF',
  label,
  sublabel,
  centerText = true
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percent = maxValue === 0 ? 0 : (value / maxValue) * 100
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={secondaryColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease',
          }}
        />
      </svg>
      
      {centerText && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <div style={{ 
            fontSize: size * 0.2, 
            fontWeight: '700', 
            color: '#212529',
            lineHeight: 1
          }}>
            {value}
          </div>
          {label && (
            <div style={{ 
              fontSize: size * 0.06, 
              color: '#6C757D',
              marginTop: '4px'
            }}>
              {label}
            </div>
          )}
          {sublabel && (
            <div style={{ 
              fontSize: size * 0.055, 
              color: '#ADB5BD',
              marginTop: '2px'
            }}>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}