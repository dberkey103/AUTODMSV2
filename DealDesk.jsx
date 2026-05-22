import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDeals, saveDeal, updateDeal, getInventory, lookupTax } from './client'
import { Save, Plus, Trash2, Search, ArrowLeft, Car, User, DollarSign } from 'lucide-react'

// Payment calculation: PMT formula
function calcPayment(principal, annualRate, months) {
  if (!principal || !months) return 0
  if (!annualRate || annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function generateDealNum() {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `D-${year}-${rand}`
}

const FI_PRODUCTS = ['GAP Insurance', 'Extended Warranty', 'Paint Protection', 'Tire & Wheel', 'Key Replacement', 'Windshield Protection', 'Prepaid Maintenance']
const LENDERS = ['Chase Auto', 'Capital One', 'TD Auto Finance', 'Ally Financial', 'Wells Fargo', 'Credit Acceptance', 'Westlake Financial', 'Other']
const TERMS = [24, 36, 48, 60, 72, 84]

const StatusBadge = ({ status }) => {
  const colors = {
    'In progress': 'bg-yellow-100 text-yellow-700',
    Pending: 'bg-blue-100 text-blue-700',
    Funded: 'bg-green-100 text-green-700',
    Dead: 'bg-gray-100 text-gray-500',
  }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

export default function DealDesk() {
  const { dealNum } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const isNew = !dealNum || dealNum === 'new'

  const [dealType, setDealType] = useState('Cash')
  const [status, setStatus] = useState('In progress')
  const [currentDealNum] = useState(isNew ? generateDealNum() : dealNum)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [showVehicleSearch, setShowVehicleSearch] = useState(false)
  const [taxLoading, setTaxLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const [customer, setCustomer] = useState({
    first: '', last: '', phone: '', email: '', address: '', city: '', state: '', zip: '', dob: '', dl: ''
  })

  const [vehicle, setVehicle] = useState(location.state?.vehicle || null)

  const [pricing, setPricing] = useState({
    sell: '', doc_fee: '599', discount: '0', trade_acv: '', trade_payoff: '',
    tax_rate: '6.35', reg: '180', emission: '20'
  })

  const [finance, setFinance] = useState({
    down: '', term: '60', buy_rate: '', sell_rate: '', lender: ''
  })

  const [fiProducts, setFiProducts] = useState([])
  const [notes, setNotes] = useState('')

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => getDeals().then(r => r.data),
    enabled: !isNew
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data)
  })

  useEffect(() => {
    if (!isNew && deals.length > 0) {
      const existing = deals.find(d => d.deal_num === dealNum)
      if (existing) {
        setStatus(existing.status || 'In progress')
        setDealType(existing.deal_type || 'Cash')
        setCustomer({
          first: existing.customer_first || '',
          last: existing.customer_last || '',
          phone: existing.customer_phone || '',
          email: existing.customer_email || '',
          address: existing.customer_addr || '',
          city: existing.customer_city || '',
          state: existing.customer_state || '',
          zip: existing.customer_zip || '',
          dob: existing.customer_dob || '',
          dl: existing.customer_dl || '',
        })
        setPricing({
          sell: existing.sell || '',
          doc_fee: existing.doc || '599',
          discount: existing.discount || '0',
          trade_acv: existing.trade_acv || '',
          trade_payoff: existing.trade_payoff || '',
          tax_rate: existing.tax_rate || '6.35',
          reg: existing.reg || '180',
          emission: existing.emission || '20',
        })
        setFinance({
          down: existing.f_down || '',
          term: existing.f_term || '60',
          buy_rate: existing.f_buy_rate || '',
          sell_rate: existing.f_sell_rate || '',
          lender: existing.lender || '',
        })
        setFiProducts(existing.fi_products || [])
        setNotes(existing.notes || '')
        if (existing.vehicle_name) {
          setVehicle({
            id: existing.vehicle_id, stock: existing.stock,
            year: existing.vehicle_year, make: existing.vehicle_make,
            model: existing.vehicle_model, vin: existing.vehicle_vin,
            miles: existing.vehicle_miles, cost: existing.vehicle_cost,
            recon: existing.vehicle_recon || []
          })
        }
      }
    }
  }, [deals, dealNum, isNew])

  // Calculations
  const sell = parseFloat(pricing.sell) || 0
  const docFee = parseFloat(pricing.doc_fee) || 0
  const discount = parseFloat(pricing.discount) || 0
  const tradeAcv = parseFloat(pricing.trade_acv) || 0
  const tradePayoff = parseFloat(pricing.trade_payoff) || 0
  const taxRate = parseFloat(pricing.tax_rate) || 0
  const reg = parseFloat(pricing.reg) || 0
  const emission = parseFloat(pricing.emission) || 0
  const downPayment = parseFloat(finance.down) || 0
  const term = parseInt(finance.term) || 60
  const buyRate = parseFloat(finance.buy_rate) || 0
  const sellRate = parseFloat(finance.sell_rate) || 0

  const tradeNet = tradeAcv - tradePayoff
  const taxableAmount = sell - discount + docFee - tradeAcv
  const taxAmount = Math.max(0, taxableAmount) * (taxRate / 100)
  const otd = sell - discount + docFee + taxAmount + reg + emission - tradeAcv
  const amountFinanced = Math.max(0, otd - downPayment)
  const monthlyPayment = dealType === 'Finance' ? calcPayment(amountFinanced, sellRate, term) : 0
  const reserve = dealType === 'Finance' ? ((sellRate - buyRate) / 100 / 12) * amountFinanced * term : 0

  const fiTotal = fiProducts.reduce((s, p) => s + (parseFloat(p.price) || 0), 0)
  const fiProfit = fiProducts.reduce((s, p) => s + ((parseFloat(p.price) || 0) - (parseFloat(p.cost) || 0)), 0)

  const vehicleCost = vehicle
    ? ((vehicle.cost || 0) + (vehicle.recon || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0))
    : 0
  const frontGross = sell - discount - vehicleCost
  const backGross = fiProfit + reserve
  const totalGross = frontGross + backGross

  const lookupTaxByZip = async () => {
    if (!customer.zip || customer.zip.length < 5) return
    setTaxLoading(true)
    try {
      const res = await lookupTax(customer.zip)
      if (res.data?.rate) setPricing(p => ({ ...p, tax_rate: (res.data.rate * 100).toFixed(2) }))
    } catch {}
    finally { setTaxLoading(false) }
  }

  const filteredInventory = inventory
    .filter(v => v.status === 'Available' && (!vehicleSearch || `${v.year} ${v.make} ${v.model} ${v.stock} ${v.vin}`.toLowerCase().includes(vehicleSearch.toLowerCase())))
    .slice(0, 8)

  const saveMut = useMutation({
    mutationFn: (data) => isNew ? saveDeal(data) : updateDeal(currentDealNum, data),
    onSuccess: (res) => {
      qc.invalidateQueries(['deals'])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (isNew && res.data?.deal_num) navigate(`/deals/${res.data.deal_num}`, { replace: true })
    }
  })

  const handleSave = () => {
    saveMut.mutate({
      deal_num: currentDealNum, status, deal_type: dealType,
      customer_first: customer.first, customer_last: customer.last,
      customer_phone: customer.phone, customer_email: customer.email,
      customer_addr: customer.address, customer_city: customer.city,
      customer_state: customer.state, customer_zip: customer.zip,
      customer_dob: customer.dob, customer_dl: customer.dl,
      vehicle_id: vehicle?.id,
      vehicle_name: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : '',
      vehicle_year: vehicle?.year, vehicle_make: vehicle?.make,
      vehicle_model: vehicle?.model, vehicle_vin: vehicle?.vin,
      vehicle_miles: vehicle?.miles, vehicle_cost: vehicle?.cost,
      stock: vehicle?.stock,
      sell: pricing.sell, discount: pricing.discount, doc: pricing.doc_fee,
      trade_acv: pricing.trade_acv, trade_payoff: pricing.trade_payoff,
      tax_rate: pricing.tax_rate, reg: pricing.reg, emission: pricing.emission,
      f_down: finance.down, f_term: finance.term,
      f_buy_rate: finance.buy_rate, f_sell_rate: finance.sell_rate,
      lender: finance.lender, fi_products: fiProducts,
      front_gross: frontGross, fi_profit: fiProfit,
      reserve, total_gross: totalGross, otd, payment: monthlyPayment, notes,
    })
  }

  const addFiProduct = () => setFiProducts(p => [...p, { name: '', term: '', cost: '', price: '' }])
  const updateFiProduct = (idx, field, val) => setFiProducts(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  const removeFiProduct = (idx) => setFiProducts(p => p.filter((_, i) => i !== idx))

  const setCust = (field, val) => setCustomer(p => ({ ...p, [field]: val }))
  const setPrice = (field, val) => setPricing(p => ({ ...p, [field]: val }))
  const setFin = (field, val) => setFinance(p => ({ ...p, [field]: val }))

  const F = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/deals')} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{currentDealNum}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-gray-400">{isNew ? 'New deal' : 'Edit deal'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {['In progress', 'Pending', 'Funded', 'Dead'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={handleSave} disabled={saveMut.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${saved ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            <Save size={14} /> {saveMut.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Deal'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main form */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="First Name" value={customer.first} onChange={v => setCust('first', v)} />
              <F label="Last Name" value={customer.last} onChange={v => setCust('last', v)} />
              <F label="Phone" value={customer.phone} onChange={v => setCust('phone', v)} type="tel" />
              <F label="Email" value={customer.email} onChange={v => setCust('email', v)} type="email" />
              <div className="col-span-2">
                <F label="Address" value={customer.address} onChange={v => setCust('address', v)} />
              </div>
              <F label="City" value={customer.city} onChange={v => setCust('city', v)} />
              <F label="State" value={customer.state} onChange={v => setCust('state', v)} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ZIP</label>
                <div className="flex gap-2">
                  <input value={customer.zip} onChange={e => setCust('zip', e.target.value)}
                    onBlur={lookupTaxByZip} placeholder="ZIP"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {taxLoading && <span className="text-xs text-gray-400 self-center">Loading...</span>}
                </div>
              </div>
              <F label="Date of Birth" value={customer.dob} onChange={v => setCust('dob', v)} type="date" />
              <F label="Driver's License" value={customer.dl} onChange={v => setCust('dl', v)} />
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Car size={16} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Vehicle</h2>
              </div>
              <button onClick={() => setShowVehicleSearch(!showVehicleSearch)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                {vehicle ? 'Change Vehicle' : 'Select Vehicle'}
              </button>
            </div>
            {showVehicleSearch && (
              <div className="mb-4">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)}
                    placeholder="Search year, make, model, stock..." autoFocus
                    className="pl-8 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 max-h-48 overflow-y-auto">
                  {filteredInventory.length === 0
                    ? <div className="p-3 text-xs text-gray-400 text-center">No available vehicles</div>
                    : filteredInventory.map(v => (
                      <button key={v.id} onClick={() => { setVehicle(v); setShowVehicleSearch(false); setVehicleSearch('') }}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium">{v.year} {v.make} {v.model} {v.trim}</div>
                        <div className="text-xs text-gray-400">Stock #{v.stock} · {v.vin} · {Number(v.miles || 0).toLocaleString()} mi</div>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
            {vehicle ? (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Stock #{vehicle.stock} &nbsp;·&nbsp; {vehicle.vin} &nbsp;·&nbsp; {Number(vehicle.miles || 0).toLocaleString()} mi
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No vehicle selected — click "Select Vehicle" above</div>
            )}
          </div>

          {/* Deal Type & Pricing */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Pricing</h2>
              </div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {['Cash', 'Finance'].map(t => (
                  <button key={t} onClick={() => setDealType(t)}
                    className={`px-4 py-1.5 text-xs font-medium transition-colors ${dealType === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Sell Price" value={pricing.sell} onChange={v => setPrice('sell', v)} type="number" />
              <F label="Dealer Discount" value={pricing.discount} onChange={v => setPrice('discount', v)} type="number" />
              <F label="Doc Fee" value={pricing.doc_fee} onChange={v => setPrice('doc_fee', v)} type="number" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tax Rate (%)</label>
                <div className="flex gap-2">
                  <input type="number" value={pricing.tax_rate} onChange={e => setPrice('tax_rate', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={lookupTaxByZip} className="text-xs text-blue-600 border border-blue-200 px-2 rounded-lg hover:bg-blue-50 transition-colors">
                    Lookup
                  </button>
                </div>
              </div>
              <F label="Registration" value={pricing.reg} onChange={v => setPrice('reg', v)} type="number" />
              <F label="Emission" value={pricing.emission} onChange={v => setPrice('emission', v)} type="number" />
              <F label="Trade ACV" value={pricing.trade_acv} onChange={v => setPrice('trade_acv', v)} type="number" />
              <F label="Trade Payoff" value={pricing.trade_payoff} onChange={v => setPrice('trade_payoff', v)} type="number" />
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1.5">
              {[
                ['Sell Price', `$${sell.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                discount > 0 ? ['Discount', `-$${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'text-red-500'] : null,
                ['Doc Fee', `$${docFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                [`Sales Tax (${taxRate}%)`, `$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                ['Reg + Emission', `$${(reg + emission).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                tradeAcv > 0 ? ['Trade Allowance', `-$${tradeAcv.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'text-red-500'] : null,
              ].filter(Boolean).map(([label, val, cls = '']) => (
                <div key={label} className="flex justify-between text-gray-600">
                  <span>{label}</span>
                  <span className={cls}>{val}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5">
                <span>Out-the-Door Total</span>
                <span>${otd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Finance */}
          {dealType === 'Finance' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Financing</h2>
              <div className="grid grid-cols-2 gap-3">
                <F label="Down Payment" value={finance.down} onChange={v => setFin('down', v)} type="number" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Term (months)</label>
                  <select value={finance.term} onChange={e => setFin('term', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TERMS.map(t => <option key={t} value={t}>{t} months</option>)}
                  </select>
                </div>
                <F label="Buy Rate (%)" value={finance.buy_rate} onChange={v => setFin('buy_rate', v)} type="number" />
                <F label="Sell Rate / APR (%)" value={finance.sell_rate} onChange={v => setFin('sell_rate', v)} type="number" />
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Lender</label>
                  <select value={finance.lender} onChange={e => setFin('lender', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select lender...</option>
                    {LENDERS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-blue-600 mb-0.5">Amount Financed</div>
                  <div className="text-base font-bold text-blue-800">${amountFinanced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 mb-0.5">Monthly Payment</div>
                  <div className="text-base font-bold text-blue-800">${monthlyPayment.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 mb-0.5">Reserve</div>
                  <div className="text-base font-bold text-blue-800">${reserve.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {/* F&I Products */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">F&I Products</h2>
              <button onClick={addFiProduct}
                className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={12} /> Add Product
              </button>
            </div>
            {fiProducts.length === 0 ? (
              <div className="text-sm text-gray-400 italic text-center py-4">No F&I products added</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 mb-1 px-1">
                  <div className="col-span-2">Product</div>
                  <div>Term</div>
                  <div>Cost</div>
                  <div>Price</div>
                </div>
                {fiProducts.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                    <div className="col-span-2">
                      <select value={p.name} onChange={e => updateFiProduct(idx, 'name', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select...</option>
                        {FI_PRODUCTS.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <input placeholder="Term" value={p.term} onChange={e => updateFiProduct(idx, 'term', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" placeholder="Cost" value={p.cost} onChange={e => updateFiProduct(idx, 'cost', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex gap-1 items-center">
                      <input type="number" placeholder="Price" value={p.price} onChange={e => updateFiProduct(idx, 'price', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button onClick={() => removeFiProduct(idx)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-semibold text-gray-700 pt-2 border-t border-gray-100 px-1">
                  <span>Total F&I Income</span>
                  <span>${fiTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Notes</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Deal notes, lender stipulations, special instructions..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* Deal Summary Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Payment hero */}
          <div className="bg-gray-900 rounded-xl p-5 text-white">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
              {dealType === 'Finance' ? 'Monthly Payment' : 'Out-the-Door Price'}
            </div>
            {dealType === 'Finance' ? (
              <>
                <div className="text-3xl font-bold">
                  ${monthlyPayment.toFixed(2)}
                  <span className="text-sm font-normal text-gray-400">/mo</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{finance.term} mo &nbsp;·&nbsp; {finance.sell_rate || '—'}% APR</div>
                <div className="mt-3 text-sm text-gray-300">OTD: ${otd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">${otd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div className="text-xs text-gray-400 mt-1">Cash deal</div>
              </>
            )}
          </div>

          {/* Gross summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Deal Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sell Price</span>
                <span className="font-medium">${sell.toLocaleString()}</span>
              </div>
              {tradeNet !== 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Trade Net</span>
                  <span className={`font-medium ${tradeNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tradeNet >= 0 ? '+' : '-'}${Math.abs(tradeNet).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Doc Fee</span>
                <span className="font-medium">${docFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">F&I Income</span>
                <span className="font-medium">${fiTotal.toLocaleString()}</span>
              </div>
              {dealType === 'Finance' && reserve > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reserve</span>
                  <span className="font-medium">${reserve.toFixed(0)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Front Gross</span>
                  <span className={`font-semibold ${frontGross >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    ${frontGross.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Back Gross</span>
                  <span className={`font-semibold ${backGross >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    ${backGross.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                  <span>Total Gross</span>
                  <span className={totalGross >= 0 ? 'text-green-600' : 'text-red-500'}>
                    ${totalGross.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {vehicle && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vehicle Cost</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Cost</span>
                  <span>${(vehicle.cost || 0).toLocaleString()}</span>
                </div>
                {vehicle.recon && vehicle.recon.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recon</span>
                    <span>${vehicle.recon.reduce((s, r) => s + parseFloat(r.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-gray-100 pt-1.5">
                  <span className="text-gray-700">Total Cost-In</span>
                  <span>${vehicleCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saveMut.isPending}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${saved ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            <Save size={14} /> {saveMut.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}
