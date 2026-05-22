import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRepairOrders, saveRO, getInventory } from './client'
import { Plus, Search, X, Trash2, Wrench, User, Car, Save } from 'lucide-react'

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700',
  'In progress': 'bg-yellow-100 text-yellow-700',
  'Waiting parts': 'bg-orange-100 text-orange-700',
  Complete: 'bg-green-100 text-green-700',
  Invoiced: 'bg-gray-100 text-gray-600',
}

const STATUSES = ['Open', 'In progress', 'Waiting parts', 'Complete', 'Invoiced']
const JOB_TYPES = ['Customer Pay', 'Internal / Recon', 'Warranty', 'Recall']
const DEFAULT_LABOR_RATE = 120
const DEFAULT_TAX_RATE = 6.35

function generateRONum() {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 900) + 100
  return `RO-${yy}${mm}-${rand}`
}

const emptyLine = () => ({ job_type: 'Customer Pay', description: '', book_hours: '', parts: '' })

function ROModal({ ro, onClose, inventory }) {
  const qc = useQueryClient()
  const isNew = !ro?.ro_num

  const [form, setForm] = useState({
    ro_num: ro?.ro_num || generateRONum(),
    status: ro?.status || 'Open',
    customer_first: ro?.customer_first || '',
    customer_last: ro?.customer_last || '',
    customer_phone: ro?.customer_phone || '',
    customer_email: ro?.customer_email || '',
    stock_num: ro?.stock_num || '',
    vehicle_year: ro?.vehicle_year || '',
    vehicle_make: ro?.vehicle_make || '',
    vehicle_model: ro?.vehicle_model || '',
    vin: ro?.vin || '',
    mileage_in: ro?.mileage_in || '',
    advisor: ro?.advisor || '',
    tech: ro?.tech || '',
    ro_type: ro?.ro_type || 'Customer Pay',
    labor_rate: ro?.labor_rate || DEFAULT_LABOR_RATE,
    tax_rate: ro?.tax_rate || DEFAULT_TAX_RATE,
    promise_date: ro?.promise_date || '',
    notes: ro?.notes || '',
    lines: ro?.lines || [emptyLine()],
  })

  const setF = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const setLine = (idx, field, val) => {
    setForm(p => ({
      ...p,
      lines: p.lines.map((l, i) => i === idx ? { ...l, [field]: val } : l)
    }))
  }

  const addLine = () => setForm(p => ({ ...p, lines: [...p.lines, emptyLine()] }))
  const removeLine = (idx) => setForm(p => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }))

  const laborTotal = form.lines.reduce((s, l) => s + (parseFloat(l.book_hours || 0) * parseFloat(form.labor_rate || 0)), 0)
  const partsTotal = form.lines.reduce((s, l) => s + parseFloat(l.parts || 0), 0)
  const subtotal = laborTotal + partsTotal
  const taxAmt = subtotal * (parseFloat(form.tax_rate) / 100)
  const total = subtotal + taxAmt

  // Autofill from stock
  const handleStockLookup = () => {
    const v = inventory.find(v => v.stock === form.stock_num || String(v.stock).toLowerCase() === form.stock_num.toLowerCase())
    if (v) {
      setForm(p => ({
        ...p,
        vehicle_year: v.year || p.vehicle_year,
        vehicle_make: v.make || p.vehicle_make,
        vehicle_model: v.model || p.vehicle_model,
        vin: v.vin || p.vin,
      }))
    }
  }

  const saveMut = useMutation({
    mutationFn: () => saveRO({ ...form, labor_total: laborTotal, parts_total: partsTotal, subtotal, tax_amount: taxAmt, total }),
    onSuccess: () => { qc.invalidateQueries(['service']); onClose() }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-gray-900 font-mono">{form.ro_num}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[form.status] || 'bg-gray-100 text-gray-500'}`}>
                {form.status}
              </span>
            </div>
            <p className="text-xs text-gray-400">{isNew ? 'New Repair Order' : 'Edit Repair Order'}</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={form.status} onChange={e => setF('status', e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Customer</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['First Name', 'customer_first'],
                ['Last Name', 'customer_last'],
                ['Phone', 'customer_phone', 'tel'],
                ['Email', 'customer_email', 'email'],
              ].map(([label, field, type = 'text']) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type={type} value={form[field]} onChange={e => setF(field, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vehicle</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Stock # (inventory lookup)</label>
                <div className="flex gap-2">
                  <input value={form.stock_num} onChange={e => setF('stock_num', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleStockLookup}
                    className="text-xs text-blue-600 border border-blue-200 px-2 rounded-lg hover:bg-blue-50 transition-colors">
                    Lookup
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mileage In</label>
                <input type="number" value={form.mileage_in} onChange={e => setF('mileage_in', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {[
                ['Year', 'vehicle_year'],
                ['Make', 'vehicle_make'],
                ['Model', 'vehicle_model'],
              ].map(([label, field]) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input value={form[field]} onChange={e => setF(field, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1">VIN</label>
                <input value={form.vin} onChange={e => setF('vin', e.target.value)} maxLength={17}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* RO Config */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Advisor</label>
              <input value={form.advisor} onChange={e => setF('advisor', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Technician</label>
              <input value={form.tech} onChange={e => setF('tech', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Labor Rate ($/hr)</label>
              <input type="number" value={form.labor_rate} onChange={e => setF('labor_rate', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Promise Date</label>
              <input type="date" value={form.promise_date} onChange={e => setF('promise_date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Job Lines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Job Lines</span>
              <button onClick={addLine}
                className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={11} /> Add Line
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <div className="col-span-2">Type</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Hours</div>
                <div className="col-span-2">Parts ($)</div>
                <div className="col-span-1 text-right">Labor</div>
                <div className="col-span-1"></div>
              </div>
              {form.lines.map((line, idx) => {
                const laborAmt = parseFloat(line.book_hours || 0) * parseFloat(form.labor_rate || 0)
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2">
                      <select value={line.job_type} onChange={e => setLine(idx, 'job_type', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input value={line.description} onChange={e => setLine(idx, 'description', e.target.value)}
                        placeholder="Description of work"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" step="0.1" value={line.book_hours} onChange={e => setLine(idx, 'book_hours', e.target.value)}
                        placeholder="0.0"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={line.parts} onChange={e => setLine(idx, 'parts', e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-1 text-right text-xs font-medium text-gray-700">
                      ${laborAmt.toFixed(0)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {form.lines.length > 1 && (
                        <button onClick={() => removeLine(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Labor Total</span>
                <span>${laborTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Parts Total</span>
                <span>${partsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax ({form.tax_rate}%)</span>
                <span>${taxAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Total</span>
                <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Technician Notes</label>
            <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={3}
              placeholder="Notes, findings, recommendations..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
            <Save size={14} /> {saveMut.isPending ? 'Saving...' : 'Save Repair Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Service() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [selectedRO, setSelectedRO] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const { data: ros = [], isLoading } = useQuery({
    queryKey: ['service'],
    queryFn: () => getRepairOrders().then(r => r.data)
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data)
  })

  const statusCounts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: ros.filter(r => r.status === s).length }), {})

  const filtered = ros.filter(ro => {
    const matchFilter = filter === 'All' || ro.status === filter
    const matchSearch = !search ||
      `${ro.ro_num} ${ro.customer_first} ${ro.customer_last} ${ro.vehicle_year} ${ro.vehicle_make} ${ro.vehicle_model}`.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const openRO = (ro) => { setSelectedRO(ro); setShowModal(true) }
  const newRO = () => { setSelectedRO(null); setShowModal(true) }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Service</h1>
          <p className="text-sm text-gray-500">{ros.length} repair orders</p>
        </div>
        <button onClick={newRO}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus size={16} /> New RO
        </button>
      </div>

      {/* Status metric tiles */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(filter === s ? 'All' : s)}
            className={`bg-white rounded-xl border p-3 text-left transition-all ${
              filter === s ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100 hover:border-gray-200'
            }`}>
            <div className="text-lg font-bold text-gray-900">{statusCounts[s] || 0}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s}</div>
          </button>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ROs..."
            className="pl-8 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {['All', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* RO Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench size={28} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No repair orders found</p>
            <button onClick={newRO}
              className="mt-4 flex items-center gap-2 mx-auto bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={14} /> Create First RO
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">RO #</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Vehicle</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Advisor</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Total</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(ro => (
                <tr key={ro.ro_num || ro.id} onClick={() => openRO(ro)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-5 py-3 text-sm font-mono font-medium text-blue-600">{ro.ro_num}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{ro.customer_first} {ro.customer_last}</div>
                    <div className="text-xs text-gray-400">{ro.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{ro.vehicle_year} {ro.vehicle_make} {ro.vehicle_model}</div>
                    {ro.stock_num && <div className="text-xs text-gray-400">Stock #{ro.stock_num}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{ro.advisor || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ro.status] || 'bg-gray-100 text-gray-500'}`}>
                      {ro.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">
                    {ro.total ? `$${parseFloat(ro.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {ro.created_at ? new Date(ro.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ROModal ro={selectedRO} onClose={() => setShowModal(false)} inventory={inventory} />
      )}
    </div>
  )
}
