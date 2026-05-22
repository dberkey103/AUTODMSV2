import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInventory, updateVehicle, saveRO } from './client'
import { ArrowLeft, Edit2, FileText, Send, Plus, Trash2, ExternalLink, Camera, ToggleLeft, ToggleRight, DollarSign, Calendar, Wrench } from 'lucide-react'

const statusColors = {
  Available: 'bg-green-100 text-green-700',
  'In recon': 'bg-yellow-100 text-yellow-700',
  Sold: 'bg-gray-100 text-gray-500',
  Pending: 'bg-blue-100 text-blue-700',
}

const RECON_VENDORS = ['Body Shop', 'Mechanical', 'Detail', 'Tires', 'Glass', 'Electrical', 'Interior', 'Other']

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('info')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [newRecon, setNewRecon] = useState({ description: '', vendor: '', amount: '' })
  const [listings, setListings] = useState({ autotrader: false, carsdotcom: false, cargurus: false, facebook: false })

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data)
  })

  const vehicle = inventory.find(v => String(v.id) === String(id))

  const updateMut = useMutation({
    mutationFn: (data) => updateVehicle(id, data),
    onSuccess: () => { qc.invalidateQueries(['inventory']); setEditing(false) }
  })

  React.useEffect(() => {
    if (vehicle && !editing) {
      setEditForm({ ...vehicle })
      if (vehicle.listings) setListings(vehicle.listings)
    }
  }, [vehicle])

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>
  if (!vehicle) return <div className="p-8 text-center text-gray-400">Vehicle not found</div>

  const recon = vehicle.recon || []
  const reconTotal = recon.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
  const totalCost = (vehicle.cost || 0) + reconTotal
  const grossPotential = (vehicle.price || 0) - totalCost
  const daysOnLot = vehicle.purchase_date_raw
    ? Math.floor((Date.now() - new Date(vehicle.purchase_date_raw)) / 86400000)
    : 0
  const floorPlanAccrual = vehicle.fp_amount && vehicle.fp_rate && daysOnLot
    ? ((vehicle.fp_amount * (vehicle.fp_rate / 100)) / 365) * daysOnLot
    : 0

  const saveEdit = () => updateMut.mutate(editForm)

  const addReconLine = () => {
    if (!newRecon.description || !newRecon.amount) return
    const updatedRecon = [...recon, { ...newRecon, id: Date.now() }]
    updateMut.mutate({ ...vehicle, recon: updatedRecon })
    setNewRecon({ description: '', vendor: '', amount: '' })
  }

  const removeReconLine = (idx) => {
    const updatedRecon = recon.filter((_, i) => i !== idx)
    updateMut.mutate({ ...vehicle, recon: updatedRecon })
  }

  const toggleListing = (key) => {
    const updated = { ...listings, [key]: !listings[key] }
    setListings(updated)
    updateMut.mutate({ ...vehicle, listings: updated })
  }

  const startDeal = () => navigate('/deals/new', { state: { vehicle } })
  const sendToDesk = () => navigate('/desk', { state: { vehicle } })

  const Field = ({ label, value }) => (
    <div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value || '—'}</div>
    </div>
  )

  const EditField = ({ label, field, type = 'text' }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={editForm[field] || ''}
        onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  const tabs = ['info', 'recon', 'photos', 'listings']

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/inventory')} className="mt-1 text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
              {vehicle.trim && <span className="text-sm text-gray-500">{vehicle.trim}</span>}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[vehicle.status] || 'bg-gray-100 text-gray-500'}`}>
                {vehicle.status}
              </span>
            </div>
            <div className="text-sm text-gray-400 mt-0.5">Stock #{vehicle.stock} &nbsp;·&nbsp; {vehicle.vin}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Edit2 size={14} /> {editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={sendToDesk}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Send size={14} /> Send to Desk
          </button>
          <button onClick={startDeal}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <FileText size={14} /> Start Deal
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-gray-100">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>{tab === 'info' ? 'Vehicle Info' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>

          {/* Vehicle Info Tab */}
          {activeTab === 'info' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              {editing ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <EditField label="VIN" field="vin" />
                    <EditField label="Stock #" field="stock" />
                    <EditField label="Year" field="year" />
                    <EditField label="Make" field="make" />
                    <EditField label="Model" field="model" />
                    <EditField label="Trim" field="trim" />
                    <EditField label="Miles" field="miles" type="number" />
                    <EditField label="Ext Color" field="ext_color" />
                    <EditField label="Int Color" field="int_color" />
                    <EditField label="Source" field="source" />
                    <EditField label="Purchase Date" field="purchase_date_raw" type="date" />
                    <EditField label="List Price" field="price" type="number" />
                    <EditField label="Cost" field="cost" type="number" />
                    <EditField label="Floor Plan Amount" field="fp_amount" type="number" />
                    <EditField label="Floor Plan Rate (%)" field="fp_rate" type="number" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select
                      value={editForm.status || ''}
                      onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['Available', 'In recon', 'Pending', 'Sold'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <button onClick={saveEdit}
                    disabled={updateMut.isPending}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    {updateMut.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <Field label="VIN" value={vehicle.vin} />
                  <Field label="Stock #" value={vehicle.stock} />
                  <Field label="Year" value={vehicle.year} />
                  <Field label="Make" value={vehicle.make} />
                  <Field label="Model" value={vehicle.model} />
                  <Field label="Trim" value={vehicle.trim} />
                  <Field label="Miles" value={vehicle.miles ? Number(vehicle.miles).toLocaleString() : '—'} />
                  <Field label="Ext Color" value={vehicle.ext_color} />
                  <Field label="Int Color" value={vehicle.int_color} />
                  <Field label="Source" value={vehicle.source} />
                  <Field label="Purchase Date" value={vehicle.purchase_date_raw} />
                  <Field label="List Price" value={vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : '—'} />
                  <Field label="Cost" value={vehicle.cost ? `$${Number(vehicle.cost).toLocaleString()}` : '—'} />
                  <Field label="Floor Plan Amount" value={vehicle.fp_amount ? `$${Number(vehicle.fp_amount).toLocaleString()}` : '—'} />
                  <Field label="Floor Plan Rate" value={vehicle.fp_rate ? `${vehicle.fp_rate}%` : '—'} />
                </div>
              )}
            </div>
          )}

          {/* Recon Tab */}
          {activeTab === 'recon' && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Reconditioning</span>
                <span className="text-sm font-semibold text-gray-900">Total: ${reconTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              {recon.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No recon lines yet</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Description</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Vendor</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Amount</th>
                      <th className="w-10 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recon.map((line, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{line.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{line.vendor}</td>
                        <td className="px-4 py-3 text-sm font-medium text-right">${parseFloat(line.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeReconLine(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Add recon line */}
              <div className="p-4 border-t border-gray-100 flex gap-3">
                <input
                  placeholder="Description"
                  value={newRecon.description}
                  onChange={e => setNewRecon(p => ({ ...p, description: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newRecon.vendor}
                  onChange={e => setNewRecon(p => ({ ...p, vendor: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Vendor</option>
                  {RECON_VENDORS.map(v => <option key={v}>{v}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={newRecon.amount}
                  onChange={e => setNewRecon(p => ({ ...p, amount: e.target.value }))}
                  className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addReconLine}
                  className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-900">Photos</span>
                <button className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <Camera size={14} /> Upload Photos
                </button>
              </div>
              {vehicle.photos && vehicle.photos.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {vehicle.photos.map((url, idx) => (
                    <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded">Main</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                  <Camera size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">No photos yet</p>
                  <p className="text-xs text-gray-300 mt-1">Upload JPG, PNG, or HEIC</p>
                </div>
              )}
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-sm font-medium text-gray-900 mb-4">Listing Sites</div>
              <div className="space-y-3">
                {[
                  { key: 'autotrader', label: 'AutoTrader', desc: 'autotrader.com' },
                  { key: 'carsdotcom', label: 'Cars.com', desc: 'cars.com' },
                  { key: 'cargurus', label: 'CarGurus', desc: 'cargurus.com' },
                  { key: 'facebook', label: 'Facebook Marketplace', desc: 'facebook.com/marketplace' },
                ].map(site => (
                  <div key={site.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <ExternalLink size={14} className="text-blue-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{site.label}</div>
                        <div className="text-xs text-gray-400">{site.desc}</div>
                      </div>
                    </div>
                    <button onClick={() => toggleListing(site.key)} className="transition-colors">
                      {listings[site.key]
                        ? <ToggleRight size={28} className="text-green-500" />
                        : <ToggleLeft size={28} className="text-gray-300" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Financial Summary Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Financial Summary</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cost</span>
                <span className="font-medium">${(vehicle.cost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recon</span>
                <span className="font-medium">${reconTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2 font-semibold">
                <span className="text-gray-700">Total Cost-In</span>
                <span>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">List Price</span>
                <span className="font-medium">${(vehicle.price || 0).toLocaleString()}</span>
              </div>
              <div className={`flex justify-between text-sm font-semibold ${grossPotential >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>Gross Potential</span>
                <span>{grossPotential >= 0 ? '' : '-'}${Math.abs(grossPotential).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Age & Floorplan</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={12} /> Days on Lot</span>
                <span className={`font-semibold ${daysOnLot > 45 ? 'text-red-600' : daysOnLot > 30 ? 'text-yellow-600' : 'text-gray-900'}`}>{daysOnLot}d</span>
              </div>
              {vehicle.fp_amount && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Floored Amount</span>
                    <span className="font-medium">${Number(vehicle.fp_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Floor Rate</span>
                    <span className="font-medium">{vehicle.fp_rate}%</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-orange-600">
                    <span>Interest Accrued</span>
                    <span>${floorPlanAccrual.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}