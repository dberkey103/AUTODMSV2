import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import VehicleDetail from './pages/VehicleDetail'
import Deals from './pages/Deals'
import DealDesk from './pages/DealDesk'
import Service from './pages/Service'
import Users from './pages/Users'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/:id" element={<VehicleDetail />} />
        <Route path="deals" element={<Deals />} />
        <Route path="deals/:dealNum" element={<DealDesk />} />
        <Route path="deals/new" element={<DealDesk />} />
        <Route path="service" element={<Service />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
