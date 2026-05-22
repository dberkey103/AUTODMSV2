import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import Layout from './Layout'
import Dashboard from './Dashboard'
import Inventory from './Inventory'
import VehicleDetail from './VehicleDetail'
import Deals from './Deals'
import DealDesk from './DealDesk'
import Service from './Service'
import Users from './Users'

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