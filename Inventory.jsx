import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInventory } from './client'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Car } from 'lucide-react'

const statusColors = {
  Available: 'bg-green-100 text-green-700',
  'In recon': 'bg-yellow-100 text-yellow-700',
  Sold: 'bg-gray-100 text-gray-500',
  Pending: 'bg-blue-100 text-blue-700',
}

export default function Inventory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data)
  })

  const filtered = inventory.filter(v => {
    const matchSearch = !search || `${v.year} ${v.make} ${v.model} ${v.trim} ${v.stock} ${v.vin}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || v.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all: inventory.length,
    Available: inventory.filter(v => v.status === 'Available').length,
    'In recon': inventory.filter(v => v.status === 'In recon').length,
    Pending: inventory.filter(v => v.status === 'Pending').length,
    Sold: inventory.filter(v => v.status === 'Sold').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{inventory.length} vehicles</p>
        </div>
        <Link to="/inventory/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus size={16} /> Stock In
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..."
            className="pl-8 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'Available', label: 'Available' },
            { key: 'In recon', label: 'In Recon' },
            { key: 'Pending', label: 'Pending' },
            { key: 'Sold', label: 'Sold' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {label}
              <span className={`ml-1.5 text-xs ${filter === key ? 'text-gray-300' : 'text-gray-400'}`}>
                {counts[key] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Car size={28} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No vehicles found</p>
            <Link to="/inventory/new"
              className="mt-4 inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={14} /> Stock In First Vehicle
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-16">Photo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Vehicle</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Stock #</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">VIN</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Miles</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">List Price</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Cost</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Age</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(v => {
                const days = v.purchase_date_raw
                  ? Math.floor((Date.now() - new Date(v.purchase_date_raw)) / 86400000)
                  : 0
                return (
                  <tr key={v.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/inventory/${v.id}`)}>
                    <td className="px-4 py-3">
                      <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-gray-300">
                        {v.photos?.[0]
                          ? <img src={v.photos[0]} className="w-full h-full object-cover" alt="" />
                          : <Car size={18} />
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{v.year} {v.make} {v.model}</div>
                      <div className="text-xs text-gray-400">{v.trim}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{v.stock || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{v.vin ? v.vin.slice(0, 10) + '...' : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.miles ? Number(v.miles).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right">${(v.price || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">${(v.cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${
                        days > 60 ? 'text-red-600' : days > 45 ? 'text-orange-500' : days > 30 ? 'text-yellow-600' : 'text-gray-500'
                      }`}>{days}d</span>
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
