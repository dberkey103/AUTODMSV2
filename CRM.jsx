import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDeals } from './client'
import { useNavigate } from 'react-router-dom'
import { Search, User } from 'lucide-react'

export default function CRM() {
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => getDeals().then(r => r.data),
  })
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const customers = useMemo(() => {
    const map = new Map()
    deals.forEach(d => {
      const key = `${d.customer_first || ''} ${d.customer_last || ''}`.trim()
      if (!key) return
      if (!map.has(key)) {
        map.set(key, { name: key, first: d.customer_first, last: d.customer_last, deals: [] })
      }
      map.get(key).deals.push(d)
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [deals])

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(q))
  }, [customers, search])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">CRM</h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} customers</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers…"
            className="pl-8 pr-3 h-9 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#378ADD] w-56 bg-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <User size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">
            {search ? 'No customers match your search' : 'No customers yet — they appear here once deals are created'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5f5f3] border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Deals</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Purchase</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total Gross</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const sorted = [...c.deals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                const last = sorted[0]
                const totalGross = c.deals.reduce((s, d) => s + (parseFloat(d.total_gross) || 0), 0)
                return (
                  <tr
                    key={c.name}
                    className="border-b border-gray-50 hover:bg-[#f9f9f7] cursor-pointer"
                    onClick={() => navigate('/sales/deals')}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#378ADD] text-xs font-semibold shrink-0">
                          {c.first?.[0]}{c.last?.[0]}
                        </div>
                        <span className="font-medium text-gray-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.deals.length}</td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[180px]">{last?.vehicle_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {last?.created_at ? new Date(last.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${totalGross >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        ${totalGross.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
