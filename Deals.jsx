import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDeals } from './client'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

const statusColors = {
  Funded: 'bg-green-100 text-green-700',
  Pending: 'bg-blue-100 text-blue-700',
  'In progress': 'bg-yellow-100 text-yellow-700',
  Dead: 'bg-gray-100 text-gray-500',
}

const FILTERS = ['All', 'In progress', 'Pending', 'Funded', 'Dead']

export default function Deals() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => getDeals().then(r => r.data)
  })

  const filtered = deals.filter(d => {
    const matchFilter = filter === 'All' || d.status === filter
    const matchSearch = !search ||
      `${d.customer_first} ${d.customer_last} ${d.vehicle_name} ${d.deal_num}`.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500">{deals.length} total deals</p>
        </div>
        <button onClick={() => navigate('/sales/deals/new')}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus size={16} /> New Deal
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search deals..."
            className="pl-8 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No deals found</p>
            <button onClick={() => navigate('/sales/deals/new')}
              className="mt-4 flex items-center gap-2 mx-auto bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={14} /> Create First Deal
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Deal #</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Vehicle</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Sell Price</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Gross</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(deal => (
                <tr key={deal.deal_num}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/sales/deals/${deal.deal_num}`)}>
                  <td className="px-5 py-3 text-sm font-mono font-medium text-blue-600">{deal.deal_num}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{deal.customer_first} {deal.customer_last}</div>
                    <div className="text-xs text-gray-400">{deal.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{deal.vehicle_name}</div>
                    <div className="text-xs text-gray-400">{deal.stock}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      deal.deal_type === 'Finance' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>{deal.deal_type || 'Cash'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[deal.status] || 'bg-gray-100 text-gray-500'}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-right">${(deal.sell || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-green-600">${(deal.total_gross || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {deal.updated_at ? new Date(deal.updated_at).toLocaleDateString() : '—'}
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
