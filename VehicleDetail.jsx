import React from 'react'
import { useParams } from 'react-router-dom'

export default function VehicleDetail() {
  const { id } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900">Vehicle Detail</h1>
      <p className="text-sm text-gray-500 mt-1">Vehicle ID: {id}</p>
    </div>
  )
}