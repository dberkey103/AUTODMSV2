import React, { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getInventory, lookupTax } from './client'
import { Search, Calculator, ArrowRight, X } from 'lucide-react'

function calcPayment(principal, annualRate, months) {
  if (!principal || !months || principal <= 0) return 0
  if (!annualRate || annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

const TERMS = [24, 36, 48, 60, 72, 84]
const PRICE_OFFSETS = [-1000, -500, 0, 500, 1000]

const inputCls = 'w-full border border-[#2a2a2a] bg-[#1e1e1e] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E31837] transition-colors'

export default function DeskCalculator() {
  const navigate = useNavigate()
  const location = useLocation()

  const [vehicleSearch, setVehicleSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(location.state?.vehicle || null)

  const [sellPrice, setSellPrice] = useState(
    location.state?.vehicle?.price ? String(location.state.vehicle.price) : ''
  )
  const [tradeAllowance, setTradeAllowance] = useState('')
  const [tradePayoff, setTradePayoff] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [rate, setRate] = useState('7.9')
  const [taxRate, setTaxRate] = useState('6.35')
  const [docFee, setDocFee] = useState('599')
  const [zip, setZip] = useState('')
  const [taxLoading, setTaxLoading] = useState(false)

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data)
  })

  const filteredInventory = inventory.filter(v =>
    v.status === 'Available' &&
    (!vehicleSearch || `${v.year} ${v.make} ${v.model} ${v.stock}`.toLowerCase().includes(vehicleSearch.toLowerCase()))
  ).slice(0, 8)

  const baseSell = parseFloat(sellPrice) || 0
  const trade = parseFloat(tradeAllowance) || 0
  const payoff = parseFloat(tradePayoff) || 0
  const down = parseFloat(downPayment) || 0
  const apr = parseFloat(rate) || 0
  const tax = parseFloat(taxRate) || 0
  const doc = parseFloat(docFee) || 0
  const tradeNet = trade - payoff

  const matrix = useMemo(() => {
    return PRICE_OFFSETS.map(offset => {
      const price = baseSell + offset
      if (price <= 0) return TERMS.map(() => null)
      const taxAmt = Math.max(0, (price + doc - trade)) * (tax / 100)
      const otd = price + doc + taxAmt - trade
      const financed = Math.max(0, otd - down)
      return TERMS.map(term => calcPayment(financed, apr, term))
    })
  }, [baseSell, trade, down, apr, tax, doc])

  const centerIdx = 2
  const centerTerm60Idx = TERMS.indexOf(60)
  const centerPayment = matrix[centerIdx]?.[centerTerm60Idx] || 0

  const lookupTaxByZip = async () => {
    if (!zip || zip.length < 5) return
    setTaxLoading(true)
    try {
      const res = await lookupTax(zip)
      if (res.data?.rate) setTaxRate((res.data.rate * 100).toFixed(2))
    } catch {}
    finally { setTaxLoading(false) }
  }

  const startDeal = () => {
    navigate('/sales/deals/new', {
      state: {
        vehicle: selectedVehicle,
        preset: {
          sell: sellPrice, tradeAllowance, tradePayoff, downPayment,
          tax_rate: taxRate, sell_rate: rate, doc_fee: docFee,
        }
      }
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator size={20} /> Desk Calculator
          </h1>
          <p className="text-sm text-gray-500">Payment matrix – real-time financing scenarios</p>
        </div>
        <button onClick={startDeal}
          className="flex items-center gap-2 bg-[#E31837] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c0001c] transition-colors">
          Start Deal <ArrowRight size={14} />
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vehicle</div>
            {selectedVehicle ? (
              <div className="bg-[#1a1a1a] rounded-lg p-3 relative">
                <button onClick={() => setSelectedVehicle(null)}
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-300 transition-colors">
                  <X size={14} />
                </button>
                <div className="text-sm font-semibold text-white pr-4">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</div>
                <div className="text-xs text-gray-500 mt-0.5">Stock #{selectedVehicle.stock} · ${(selectedVehicle.price || 0).toLocaleString()}</div>
              </div>
            ) : (
              <button onClick={() => setShowSearch(!showSearch)}
                className="w-full flex items-center gap-2 border border-dashed border-[#2a2a2a] rounded-lg p-3 text-sm text-gray-500 hover:border-[#E31837] hover:text-gray-300 transition-colors">
                <Search size={14} /> Search inventory...
              </button>
            )}
            {showSearch && (
              <div className="mt-2">
                <input value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)}
                  placeholder="Year, make, model, stock..." autoFocus
                  className={`${inputCls} mb-1`} />
                <div className="border border-[#2a2a2a] rounded-lg divide-y divide-[#2a2a2a] max-h-40 overflow-y-auto">
                  {filteredInventory.length === 0
                    ? <div className="p-2 text-xs text-gray-500 text-center">No results</div>
                    : filteredInventory.map(v => (
                      <button key={v.id}
                        onClick={() => {
                          setSelectedVehicle(v)
                          setSellPrice(String(v.price || ''))
                          setShowSearch(false)
                          setVehicleSearch('')
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#1e1e1e] transition-colors">
                        <div className="text-xs font-medium text-white">{v.year} {v.make} {v.model}</div>
                        <div className="text-xs text-gray-500">#{v.stock} · ${(v.price || 0).toLocaleString()}</div>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deal Structure</div>
            {[
              ['Sell Price ($)', sellPrice, setSellPrice],
              ['Trade Allowance ($)', tradeAllowance, setTradeAllowance],
              ['Trade Payoff ($)', tradePayoff, setTradePayoff],
              ['Down Payment ($)', downPayment, setDownPayment],
              ['Doc Fee ($)', docFee, setDocFee],
            ].map(([label, val, setter]) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                <input type="number" value={val} onChange={e => setter(e.target.value)} className={inputCls} />
              </div>
            ))}
          </div>

          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate &amp; Tax</div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Interest Rate (%)</label>
              <input type="number" value={rate} step="0.1" onChange={e => setRate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Tax Rate (%)</label>
              <input type="number" value={taxRate} step="0.01" onChange={e => setTaxRate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">ZIP (for tax lookup)</label>
              <div className="flex gap-2">
                <input value={zip} onChange={e => setZip(e.target.value)} onBlur={lookupTaxByZip} placeholder="ZIP code"
                  className={`flex-1 border border-[#2a2a2a] bg-[#1e1e1e] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E31837] transition-colors placeholder-gray-600`} />
                <button onClick={lookupTaxByZip}
                  className="text-xs text-[#E31837] border border-[#E31837]/30 px-2 rounded-lg hover:bg-[#E31837]/10 transition-colors">
                  {taxLoading ? '...' : 'Go'}
                </button>
              </div>
            </div>
          </div>

          {baseSell > 0 && (
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 text-white">
              <div className="text-xs text-gray-500 mb-2">Quick Summary (60 mo)</div>
              <div className="text-2xl font-bold text-white">${centerPayment.toFixed(2)}<span className="text-sm font-normal text-gray-500">/mo</span></div>
              <div className="text-xs text-[#E31837] mt-1">{rate}% APR</div>
              <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                <div className="flex justify-between"><span>Trade Net:</span><span>{tradeNet >= 0 ? '+' : '-'}${Math.abs(tradeNet).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Down:</span><span>-${down.toLocaleString()}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Payment Matrix</div>
                <div className="text-xs text-gray-500">Payments for sell price ±$1,000 across all terms</div>
              </div>
              {baseSell > 0 && <div className="text-xs text-gray-500">{rate}% APR</div>}
            </div>
            {baseSell <= 0 ? (
              <div className="p-16 text-center">
                <Calculator size={32} className="mx-auto text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Enter a sell price to generate the payment matrix</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a] bg-[#0f0f0f]">
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-28">Sell Price</th>
                      {TERMS.map(term => (
                        <th key={term} className="text-center text-xs font-medium text-gray-500 px-3 py-3">{term} mo</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {PRICE_OFFSETS.map((offset, rowIdx) => {
                      const price = baseSell + offset
                      const isCenter = offset === 0
                      return (
                        <tr key={offset} className={isCenter ? 'bg-[#E31837]/5' : 'hover:bg-[#1e1e1e]'}>
                          <td className="px-4 py-3">
                            <div className={`text-sm font-semibold ${isCenter ? 'text-[#E31837]' : 'text-white'}`}>
                              ${price.toLocaleString()}
                            </div>
                            {isCenter && <div className="text-xs text-[#E31837]/70">Listed</div>}
                          </td>
                          {matrix[rowIdx].map((payment, colIdx) => (
                            <td key={TERMS[colIdx]} className={`px-3 py-3 text-center ${isCenter ? 'bg-[#E31837]/5' : ''}`}>
                              {payment !== null ? (
                                <div className={`text-sm font-semibold ${isCenter ? 'text-[#E31837]' : 'text-gray-200'}`}>
                                  ${payment.toFixed(0)}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-600">–</div>
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {baseSell > 0 && (
              <div className="p-3 border-t border-[#2a2a2a] text-xs text-gray-500 flex justify-between items-center">
                <span>Assumes ${down.toLocaleString()} down · ${doc.toLocaleString()} doc · {taxRate}% tax · {tradeNet !== 0 ? `${Math.abs(tradeNet).toLocaleString()} trade net` : 'no trade'}</span>
                <button onClick={startDeal}
                  className="flex items-center gap-1.5 bg-[#E31837] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#c0001c] transition-colors">
                  Start Deal <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>

          {baseSell > 0 && centerPayment > 0 && (
            <div className="mt-4 bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
              <div className="text-sm font-semibold text-white mb-3">Financing Detail (Listed Price · 60 months)</div>
              <div className="grid grid-cols-4 gap-4 text-center">
                {(() => {
                  const taxAmt = Math.max(0, (baseSell + doc - trade)) * (tax / 100)
                  const otd = baseSell + doc + taxAmt - trade
                  const financed = Math.max(0, otd - down)
                  const total = centerPayment * 60
                  const interest = total - financed
                  return [
                    ['Amount Financed', `$${financed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                    ['Total of Payments', `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                    ['Total Interest', `$${Math.max(0, interest).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                    ['Out-the-Door', `$${otd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-[#1a1a1a] rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">{label}</div>
                      <div className="text-sm font-bold text-white">{val}</div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
