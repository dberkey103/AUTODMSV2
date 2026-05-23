import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDeals, getInventory } from './client'
import { TrendingUp, Car, FileText, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

function MetricCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: deals = [] } = useQuery({ queryKey: ['deals'], queryFn: () => getDeals().then(r => r.data) })
  const { data: inventory = [] } = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory().then(r => r.data) })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const mtdDeals = deals.filter(d => d.status === 'Funded' && new Date(d.created_at) >= startOfMonth)
  const mtdGross = mtdDeals.reduce((s, d) => s + (d.total_gross || 0), 0)
  const inProgress = deals.filter(d => d.status === 'In progress').length
  const available = inventory.filter(v => v.status === 'Available').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="MTD Units" value={mtdDeals.length} sub="Funded this month" icon={TrendingUp} color="bg-blue-500" />
        <MetricCard label="MTD Gross" value={`$${mtdGross.toLocaleString()}`} sub="Total gross profit" icon={DollarSign} color="bg-green-500" />
        <MetricCard label="In Progress" value={inProgress} sub="Active deals" icon={FileText} color="bg-yellow-500" />
        <MetricCard label="Available" value={available} sub="Units in stock" icon={Car} color="bg-purple-500" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent deals</h2>
          <Link to="/sales/deals" className="text-sm text-blue-500 hover:underline">View all →</Link>
        </div>
        {deals.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No deals yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {deals.slice(0, 5).map(deal => (
              <Link key={deal.deal_num} to={`/sales/deals/${deal.deal_num}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-900">{deal.customer_first} {deal.customer_last}</div>
                  <div className="text-xs text-gray-400">{deal.vehicle_name} — {deal.deal_num}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    deal.status === 'Funded' ? 'bg-green-100 text-green-700' :
                    deal.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{deal.status}</div>
                  <div className="text-xs text-gray-400 mt-0.5">${(deal.total_gross || 0).toLocaleString()} gross</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
