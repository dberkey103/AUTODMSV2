import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRepairOrders } from './client'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Wrench } from 'lucide-react'

const STATUS_CONFIG = {
  Open:            { bg: 'bg-blue-900/30',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  'In Progress':   { bg: 'bg-yellow-900/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  'Waiting Parts': { bg: 'bg-orange-900/30', text: 'text-orange-400', dot: 'bg-orange-400' },
  Complete:        { bg: 'bg-green-900/30',  text: 'text-green-400',  dot: 'bg-green-400' },
  Invoiced:        { bg: 'bg-[#2a2a2a]',     text: 'text-gray-400',   dot: 'bg-gray-500' },
}

const STATUSES = Object.keys(STATUS_CONFIG)

export default function ServiceList() {
  const { data: ros = [], isLoading } = useQuery({
    queryKey: ['repair_orders'],
    queryFn: () => getRepairOrders().then(r => r.data),
  })
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const counts = useMemo(() => {
    const c = {}
    STATUSES.forEach(s => { c[s] = ros.filter(r => r.status === s).length })
    return c
  }, [ros])

  const filtered = useMemo(() => {
    let result = ros
    if (statusFilter !== 'All') result = result.filter(r => r.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.ro_num?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.make?.toLowerCase().includes(q) ||
        r.model?.toLowerCase().includes(q) ||
        r.vin?.toLowerCase().includes(q)
      )
    }
    return result
  }, [ros, search, statusFilter])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Repair Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ros.length} total</p>
        </div>
        <button
          onClick={() => navigate('/service/new')}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors bg-[#E31837] hover:bg-[#c0001c]"
        >
          <Plus size={14} />
          New RO
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'All' : s)}
            className={`bg-[#141414] rounded-xl border p-3.5 text-left transition-all ${
              statusFilter === s ? 'border-[#E31837] shadow-sm shadow-red-900/20' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
            }`}
          >
            <div className="text-2xl font-semibold text-white">{counts[s] ?? 0}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s}</div>
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search RO #, customer, vehicle…"
          className="pl-8 pr-3 h-9 w-72 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] text-white text-sm outline-none focus:border-[#E31837] transition-colors placeholder-gray-600"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500 py-12 text-center">Loading…</div>
      ) : (
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Wrench size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">No repair orders found</p>
              <button
                onClick={() => navigate('/service/new')}
                className="mt-3 text-sm font-medium hover:underline text-[#E31837]"
              >
                Create the first one
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">RO #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Advisor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ro, i) => {
                  const cfg = STATUS_CONFIG[ro.status] || STATUS_CONFIG.Open
                  const total = (ro.jobs || []).reduce(
                    (s, j) => s + (parseFloat(j.labor_total) || 0) + (parseFloat(j.parts_total) || 0),
                    0
                  )
                  return (
                    <tr
                      key={ro.id || ro.ro_num || i}
                      className="border-b border-[#2a2a2a] hover:bg-[#1e1e1e] cursor-pointer transition-colors"
                      onClick={() => navigate(`/service/${ro.id || ro.ro_num}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{ro.ro_num}</td>
                      <td className="px-4 py-3 font-medium text-white">{ro.customer_name}</td>
                      <td className="px-4 py-3 text-gray-300">{ro.year} {ro.make} {ro.model}</td>
                      <td className="px-4 py-3 text-gray-400">{ro.advisor || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {ro.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white">
                        {total > 0 ? `$${total.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {ro.created_at ? new Date(ro.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
