import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addVehicle, decodeVin } from './client'
import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'

const SOURCES = ['Trade-in', 'Auction', 'Private Party', 'Dealer Trade', 'New']
const EXT_COLORS = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 'Orange', 'Yellow', 'Other']
const INT_COLORS = ['Black', 'Gray', 'Beige', 'Tan', 'Brown', 'White', 'Red', 'Other']

function StepIndicator({ step }) {
  const steps = ['VIN Entry', 'Vehicle Details', 'Confirm']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, idx) => (
        <React.Fragment key={idx}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              idx < step ? 'bg-green-500 text-white' :
              idx === step ? 'bg-gray-900 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {idx < step ? <Check size={12} /> : idx + 1}
            </div>
            <span className={`text-sm font-medium ${idx === step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
          </div>
          {idx < steps.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function StockIn() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [vin, setVin] = useState('')
  const [vinError, setVinError] = useState('')
  const [decoding, setDecoding] = useState(false)
  const [form, setForm] = useState({
    vin: '', year: '', make: '', model: '', trim: '',
    miles: '', ext_color: '', int_color: '', source: '',
    purchase_date_raw: new Date().toISOString().split('T')[0],
    price: '', cost: '', fp_amount: '', fp_rate: '', fp_days: '',
    stock: '', status: 'In recon'
  })

  const addMut = useMutation({
    mutationFn: addVehicle,
    onSuccess: (res) => {
      qc.invalidateQueries(['inventory'])
      navigate(`/sales/inventory/${res.data.id || res.data.vehicle_id || ''}`)
    }
  })

  const setField = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const decodeVIN = async () => {
    if (vin.length !== 17) { setVinError('VIN must be exactly 17 characters'); return }
    setVinError('')
    setDecoding(true)
    try {
      const res = await decodeVin(vin)
      const d = res.data
      setForm(p => ({
        ...p, vin,
        year: d.year || p.year,
        make: d.make || p.make,
        model: d.model || p.model,
        trim: d.trim || p.trim,
      }))
      setStep(1)
    } catch {
      setVinError('Could not decode VIN. Please enter details manually.')
      setForm(p => ({ ...p, vin }))
      setStep(1)
    } finally {
      setDecoding(false)
    }
  }

  const handleSave = () => {
    addMut.mutate({
      ...form,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      miles: parseInt(form.miles) || 0,
      fp_amount: parseFloat(form.fp_amount) || 0,
      fp_rate: parseFloat(form.fp_rate) || 0,
      fp_days: parseInt(form.fp_days) || 0,
    })
  }

  const LabelInput = ({ label, field, type = 'text', required = false }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[field] || ''}
        onChange={e => setField(field, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  const LabelSelect = ({ label, field, options }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={form[field] || ''}
        onChange={e => setField(field, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )

  const grossProfit = (parseFloat(form.price) || 0) - (parseFloat(form.cost) || 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/sales/inventory')} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stock In Vehicle</h1>
          <p className="text-sm text-gray-400">Add a vehicle to inventory</p>
        </div>
      </div>

      <StepIndicator step={step} />

      {step === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Enter Vehicle VIN</h2>
          <p className="text-sm text-gray-400 mb-5">We'll automatically decode the year, make, model, and trim.</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                value={vin}
                onChange={e => { setVin(e.target.value.toUpperCase()); setVinError('') }}
                placeholder="17-character VIN"
                maxLength={17}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
              {vinError && <p className="text-xs text-red-500 mt-1">{vinError}</p>}
              <p className="text-xs text-gray-400 mt-1">{vin.length}/17 characters</p>
            </div>
            <button onClick={decodeVIN} disabled={decoding}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              <Search size={14} /> {decoding ? 'Decoding...' : 'Decode VIN'}
            </button>
          </div>
          <div className="mt-4">
            <button onClick={() => { setForm(p => ({ ...p, vin })); setStep(1) }}
              className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors">
              Skip VIN decode, enter manually
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">VIN</label>
                <input
                  value={form.vin}
                  onChange={e => setField('vin', e.target.value.toUpperCase())}
                  maxLength={17}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <LabelInput label="Stock #" field="stock" />
              <LabelInput label="Year" field="year" required />
              <LabelInput label="Make" field="make" required />
              <LabelInput label="Model" field="model" required />
              <LabelInput label="Trim" field="trim" />
              <LabelInput label="Miles" field="miles" type="number" />
              <LabelSelect label="Ext Color" field="ext_color" options={EXT_COLORS} />
              <LabelSelect label="Int Color" field="int_color" options={INT_COLORS} />
              <LabelSelect label="Source" field="source" options={SOURCES} />
              <LabelInput label="Purchase Date" field="purchase_date_raw" type="date" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setField('status', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['Available', 'In recon', 'Pending', 'Sold'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Pricing & Floorplan</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <LabelInput label="Purchase Cost ($)" field="cost" type="number" required />
              </div>
              <div>
                <LabelInput label="List Price ($)" field="price" type="number" />
                {form.price && form.cost && (
                  <p className={`text-xs mt-1 font-medium ${grossProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    Gross potential: {grossProfit >= 0 ? '' : '-'}${Math.abs(grossProfit).toLocaleString()}
                  </p>
                )}
              </div>
              <LabelInput label="Floor Plan Amount ($)" field="fp_amount" type="number" />
              <LabelInput label="Floor Plan Rate (%)" field="fp_rate" type="number" />
              <LabelInput label="Floor Plan Days" field="fp_days" type="number" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <button onClick={() => {
              if (!form.year || !form.make || !form.model) { alert('Year, Make, and Model are required'); return }
              setStep(2)
            }}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              Continue <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Confirm Vehicle Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['VIN', form.vin],
                ['Stock #', form.stock || 'Auto-assigned'],
                ['Year', form.year],
                ['Make', form.make],
                ['Model', form.model],
                ['Trim', form.trim || '–'],
                ['Miles', form.miles ? Number(form.miles).toLocaleString() : '–'],
                ['Ext Color', form.ext_color || '–'],
                ['Int Color', form.int_color || '–'],
                ['Source', form.source || '–'],
                ['Purchase Date', form.purchase_date_raw || '–'],
                ['Status', form.status],
                ['Purchase Cost', form.cost ? `$${Number(form.cost).toLocaleString()}` : '–'],
                ['List Price', form.price ? `$${Number(form.price).toLocaleString()}` : '–'],
                ['Gross Potential', form.price && form.cost ? `$${grossProfit.toLocaleString()}` : '–'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <button onClick={handleSave} disabled={addMut.isPending}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              <Check size={14} /> {addMut.isPending ? 'Saving...' : 'Stock In Vehicle'}
            </button>
            <button onClick={() => navigate('/sales/inventory')}
              className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors">
              Cancel
            </button>
          </div>
          {addMut.isError && (
            <p className="text-sm text-red-500">Error saving vehicle. Please try again.</p>
          )}
        </div>
      )}
    </div>
  )
}
