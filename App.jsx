import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import ModuleSelector from './ModuleSelector'
import Layout from './Layout'
import Dashboard from './Dashboard'
import Inventory from './Inventory'
import StockIn from './StockIn'
import VehicleDetail from './VehicleDetail'
import Deals from './Deals'
import DealDesk from './DealDesk'
import DeskCalculator from './DeskCalculator'
import CRM from './CRM'
import ServiceList from './ServiceList'
import ROForm from './ROForm'

const qc = new QueryClient()

function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-sm text-gray-400">
      Loading…
    </div>
  )
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route path="/select" element={<ModuleSelector />} />
              <Route path="/sales" element={<Layout module="sales" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="inventory/new" element={<StockIn />} />
                <Route path="inventory/:id" element={<VehicleDetail />} />
                <Route path="deals" element={<Deals />} />
                <Route path="deals/new" element={<DealDesk />} />
                <Route path="deals/:dealNum" element={<DealDesk />} />
                <Route path="desk" element={<DeskCalculator />} />
                <Route path="crm" element={<CRM />} />
              </Route>
              <Route path="/service" element={<Layout module="service" />}>
                <Route index element={<ServiceList />} />
                <Route path="new" element={<ROForm />} />
                <Route path=":id" element={<ROForm />} />
              </Route>
              <Route path="/" element={<Navigate to="/select" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/select" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
