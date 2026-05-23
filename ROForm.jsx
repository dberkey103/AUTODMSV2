import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRepairOrders, saveRO, updateRO, getInventory } from './client'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'

const STATUSES = ['Open', 'In Progress', 'Waiting Parts', 'Complete', 'Invoiced']
const JOB_TYPES = ['LOF', 'Brake Service', 'Tire Rotation', 'Engine', 'Transmission', 'Electrical', 'A/C', 'Body', 'Detail', 'Alignment', 'Inspection', 'Other']
const LABOR_RATE = 125

function genRONum() {
  const d = new Date()
  const mo = d.toLocaleString('en', { month: 'short' }).toUpperCase()
  const yy = String(d.getFullYear()).slice(2)
  const n = Math.floor(Math.random() * 900) + 100
  return `RO-${yy}${mo}-${n}`
}

const EMPTY = {
  ro_num: genRONum(),
  customer_name: '', customer_phone: '', customer_email: '',
  vin: '', year: '', make: '', model: '', trim: '', miles: '', stock: '',
  advisor: '', tech: '', status: 'Open', notes: '', promise_date: '',
  jobs: [],
}

export default function ROForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: ros = [] } = useQuery({
    queryKey: ['repair_orders'],
    queryFn: () => getRepairOrders().then(r => r.data),
    enabled: isEdit,
  })
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data),
  })

  const [form, setForm] = useState(EMPTY)
  const [stockSearch, setStockSearch] = useState('')
  const [showStock, setShowStock] = useState(false)

  useEffect(() => {
    if (isEdit && ros.length) {
      const ro = ros.find(r => String(r.id) === String(id) || r.ro_num === id)
      if (ro) setForm({ ...EMPTY, ...ro, jobs: ro.jobs || [] })
    }
  }, [isEdit, ros, id])

  const saveMut = useMutation({
    mutationFn: isEdit ? data => updateRO(id, data) : saveRO,
    onSuccess: () => { qc.invalidateQueries(['repair_orders']); navigate('/service') },
  })

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addJob() {
    setForm(f => ({
      ...f,
      jobs: [...f.jobs, { type: 'Other', description: '', hours: '', parts: '', labor_total: 0, parts_total: 0 }],
    }))
  }

  function setJob(i, k, v) {
    setForm(f => {
      const jobs = f.jobs.map((j, idx) => {
        if (idx !== i) return j
        const u = { ...j, [k]: v }
        if (k === 'hours') u.labor_total = (parseFloat(v) || 0) * LABOR_RATE
        if (k === 'parts') u.parts_total = parseFloat(v) || 0
        return u
      })
      return { ...f, jobs }
    })
  }

  function removeJob(i) { setForm(f => ({ ...f, jobs: f.jobs.filter((_, idx) => idx !== i) })) }

  function pickVehicle(v) {
    setForm(f => ({
      ...f, vin: v.vin, year: String(v.year), make: v.make,
      model: v.model, trim: v.trim || '', miles: String(v.miles || ''), stock: v.stock,
    }))
    setShowStock(false)
    setStockSearch('')
  }

  const stockResults = inventory.filter(v => {
    const q = stockSearch.toLowerCase()
    return q.length > 0 && (
      v.stock?.toLowerCase().includes(q) ||
      v.vin?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q)
    )
  }).slice(0, 8)

  const laborTotal = form.jobs.reduce((s, j) => s + (parseFloat(j.labor_total) || 0), 0)
  const partsTotal = form.jobs.reduce((s, j) => s + (parseFloat(j.parts_total) || 0), 0)
  const grandTotal = laborTotal + partsTotal

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/service')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-800">
            {isEdit ? `RO ${form.ro_num}` : 'New Repair Order'}
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{form.ro_num}</p>
        </div>
        <select
          value={form.status}
          onChange={e => setF('status', e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white"
        >
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button
          onClick={() => saveMut.mutate(form)}
          disabled={saveMut.isPending}
          className="px-5 h-9 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-[#e67e00] hover:bg-orange-600"
        >
          {saveMut.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create RO'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Customer</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                <input value={form.customer_name} onChange={e => setF('customer_name', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <input value={form.customer_phone || ''} onChange={e => setF('customer_phone', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input value={form.customer_email || ''} onChange={e => setF('customer_email', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vehicle</div>
              <button
                onClick={() => setShowStock(s => !s)}
                className="text-xs font-medium flex items-center gap-1 text-[#e67e00]"
              >
                <Search size={12} /> Lookup stock
              </button>
            </div>
            {showStock && (
              <div className="mb-3">
                <input
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  placeholder="Stock #, VIN, make, model…"
                  autoFocus
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm mb-2"
                />
                {stockResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {stockResults.map(v => (
                      <button
                        key={v.id}
                        onClick={() => pickVehicle(v)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#f5f5f3] border-b border-gray-50 last:border-0"
                      >
                        <span className="font-medium text-gray-800">{v.year} {v.make} {v.model}</span>
                        <span className="text-gray-400 ml-2 text-xs">#{v.stock} · {v.vin}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {[['Year', 'year'], ['Make', 'make'], ['Model', 'model']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input value={form[key]} onChange={e => setF(key, e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">VIN</label>
                <input value={form.vin} onChange={e => setF('vin', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mileage</label>
                <input value={form.miles} onChange={e => setF('miles', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Stock #</label>
                <input value={form.stock || ''} onChange={e => setF('stock', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Advisor</label>
                <input value={form.advisor || ''} onChange={e => setF('advisor', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Technician</label>
                <input value={form.tech || ''} onChange={e => setF('tech', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Promise Date</label>
                <input type="date" value={form.promise_date || ''} onChange={e => setF('promise_date', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Job Lines</div>
              <button onClick={addJob} className="text-xs font-medium flex items-center gap-1 text-[#e67e00]">
                <Plus size={13} /> Add line
              </button>
            </div>
            {form.jobs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No jobs yet.{' '}
                <button onClick={addJob} className="text-[#e67e00] font-medium hover:underline">Add one</button>
              </p>
            ) : (
              <div className="space-y-3">
                {form.jobs.map((job, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 bg-[#fafaf9]">
                    <div className="flex items-start gap-2 mb-2">
                      <select
                        value={job.type}
                        onChange={e => setJob(i, 'type', e.target.value)}
                        className="h-8 px-2 rounded border border-gray-200 text-sm bg-white"
                      >
                        {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <input
                        value={job.description}
                        onChange={e => setJob(i, 'description', e.target.value)}
                        placeholder="Description…"
                        className="flex-1 h-8 px-2 rounded border border-gray-200 text-sm"
                      />
                      <button onClick={() => removeJob(i)} className="text-gray-300 hover:text-red-400 mt-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Hours</label>
                        <input type="number" value={job.hours} onChange={e => setJob(i, 'hours', e.target.value)}
                          className="w-full h-8 px-2 rounded border border-gray-200 text-sm" step="0.5" min="0" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Labor (${LABOR_RATE}/hr)</label>
                        <div className="h-8 px-2 rounded border border-gray-100 text-sm bg-white flex items-center text-gray-500">
                          ${(parseFloat(job.labor_total) || 0).toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Parts $</label>
                        <input type="number" value={job.parts} onChange={e => setJob(i, 'parts', e.target.value)}
                          className="w-full h-8 px-2 rounded border border-gray-200 text-sm" step="0.01" min="0" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Line Total</label>
                        <div className="h-8 px-2 rounded border border-gray-100 text-sm bg-white flex items-center font-medium text-gray-700">
                          ${((parseFloat(job.labor_total) || 0) + (parseFloat(job.parts_total) || 0)).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setF('notes', e.target.value)}
              placeholder="Internal notes…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none outline-none focus:border-[#e67e00]"
            />
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Summary</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Labor</span>
                <span className="font-medium">${laborTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Parts</span>
                <span className="font-medium">${partsTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span className="text-[#e67e00] text-base">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              {form.jobs.length} job line{form.jobs.length !== 1 ? 's' : ''} · ${LABOR_RATE}/hr labor rate
            </div>
            <button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending}
              className="mt-5 w-full h-9 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-[#e67e00] hover:bg-orange-600"
            >
              {saveMut.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create RO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
