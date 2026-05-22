import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://autodmsv2.onrender.com',
  withCredentials: true,
})

// Auth
export const login = (username, password) => api.post('/api/auth/login', { username, password })
export const logout = () => api.post('/api/auth/logout')
export const getMe = () => api.get('/api/auth/me')

// Inventory
export const getInventory = () => api.get('/api/inventory')
export const addVehicle = (data) => api.post('/api/inventory', data)
export const updateVehicle = (id, data) => api.put(`/api/inventory/${id}`, data)
export const deleteVehicle = (id) => api.delete(`/api/inventory/${id}`)

// Deals
export const getDeals = () => api.get('/api/deals')
export const saveDeal = (data) => api.post('/api/deals', data)
export const updateDeal = (dealNum, data) => api.put(`/api/deals/${dealNum}`, data)
export const deleteDeal = (dealNum) => api.delete(`/api/deals/${dealNum}`)

// Service / Repair Orders
export const getRepairOrders = () => api.get('/api/service')
export const saveRO = (data) => api.post('/api/service', data)
export const updateRO = (id, data) => api.put(`/api/service/${id}`, data)
export const deleteRO = (id) => api.delete(`/api/service/${id}`)

// Users
export const getUsers = () => api.get('/api/users')
export const saveUser = (data) => api.post('/api/users', data)
export const updateUser = (id, data) => api.put(`/api/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/api/users/${id}`)

// Tax lookup
export const lookupTax = (address) => api.get(`/api/tax/lookup?address=${encodeURIComponent(address)}`)

// VIN decode
export const decodeVin = (vin) => api.get(`/api/vin/${vin}`)

export default api
