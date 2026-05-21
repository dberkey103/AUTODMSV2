import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getInventory } from '../api/client'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

const statusColors = {
  Available: 'bg-green-100 text-green-700',
  'In recon': 'bg-yellow-100 text-yellow-700',
  Sold: 'bg-gray-100 text-gray-500',
  Pending: 'bg-blue-100 text-blue-700',
}

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data)
  })

  const filtered = inventory.filter(v => {
    const matchSearch = !search || `${v.year} ${v.make} ${v.model} ${v.stock} ${v.vin}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || v.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{inventory.length} vehicles</p>
        </div>
        <Link
          to="/inventory/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} /> Stock in
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'Available', 'In recon', 'Pending', 'Sold'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No vehicles found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-16"></th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Vehicle</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Stock</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Miles</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Price</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cost</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Age</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(v => {
                const days = v.purchase_date_raw
                  ? Math.floor((Date.now() - new Date(v.purchase_date_raw)) / 86400000)
                  : 0
                const photo = v.photos?.[0]
                return (
                  <tr key={v.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/inventory/${v.id}`}>
                    <td className="px-4 py-3">
                      <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-lg">
                        {photo ? <img src={photo} className="w-full h-full object-cover" alt="" /> : '🚗'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{v.year} {v.make} {v.model}</div>
                      <div className="text-xs text-gray-400">{v.trim}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.stock}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.miles}</td>
                    <td className="px-4 py-3 text-sm font-medium">${(v.price || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${(v.cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${days > 45 ? 'text-red-600' : days > 30 ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {days}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[v.status] || 'bg-gray-100 text-gray-500'}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
