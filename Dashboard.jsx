import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDeals } from '../api/client'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

const statusColors = {
  'In progress': 'bg-yellow-100 text-yellow-700',
  Pending: 'bg-blue-100 text-blue-700',
  Funded: 'bg-green-100 text-green-700',
  Dead: 'bg-red-100 text-red-600',
}

export default function Deals() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => getDeals().then(r => r.data)
  })

  const filtered = deals.filter(d => {
    const name = `${d.customer_first} ${d.customer_last} ${d.vehicle_name} ${d.deal_num}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Deals</h1>
          <p className="text-sm text-gray-500">{deals.length} total deals</p>
        </div>
        <Link
          to="/deals/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} /> New deal
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals..." className="pl-8" />
        </div>
        <div className="flex gap-2">
          {['all', 'In progress', 'Pending', 'Funded', 'Dead'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No deals found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Vehicle</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Deal #</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">OTD</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Gross</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(deal => (
                <tr key={deal.deal_num} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/deals/${deal.deal_num}`}>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-gray-900">{deal.customer_first} {deal.customer_last}</div>
                    <div className="text-xs text-gray-400">{new Date(deal.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{deal.vehicle_name}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">{deal.deal_num}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{deal.deal_type}</td>
                  <td className="px-4 py-3.5 text-sm font-medium">${(deal.otd || 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-sm text-green-600 font-medium">${(deal.total_gross || 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[deal.status] || 'bg-gray-100 text-gray-500'}`}>
                      {deal.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
