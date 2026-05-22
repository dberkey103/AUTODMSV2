import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDeals } from './client'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

const statusColors = {
  Funded: 'bg-green-100 text-green-700',
  Pending: 'bg-blue-100 text-blue-700',
  'In progress': 'bg-yellow-100 text-yellow-700',
  Dead: 'bg-gray-100 text-gray-500',
}

export default function Deals() {
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => getDeals().then(r => r.data)
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500">{deals.length} total</p>
        </div>
        <Link to="/deals/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus size={16} /> New deal
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : deals.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No deals yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {deals.map(deal => (
              <Link key={deal.deal_num} to={`/deals/${deal.deal_num}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-900">{deal.customer_first} {deal.customer_last}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{deal.vehicle_name} · {deal.deal_num}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">${(deal.total_gross || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-400">gross</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[deal.status] || 'bg-gray-100 text-gray-500'}`}>
                    {deal.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}