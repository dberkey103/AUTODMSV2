import React from 'react'
import { useParams } from 'react-router-dom'

export default function DealDesk() {
  const { dealNum } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900">Deal Desk</h1>
      <p className="text-sm text-gray-500 mt-1">{dealNum ? `Deal: ${dealNum}` : 'New Deal'}</p>
    </div>
  )
}