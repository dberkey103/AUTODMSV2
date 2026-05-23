import { Component } from 'react'
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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '24px' }}>
          <div style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>
            App crashed — error caught by boundary
          </div>
          <div style={{ color: '#991b1b', fontSize: '14px', marginBottom: '8px' }}>
            {error.message}
          </div>
          {error.stack && (
            <pre style={{ color: '#7f1d1d', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', marginTop: '12px', background: '#fff', padding: '12px', borderRadius: '4px' }}>
              {error.stack}
            </pre>
          )}
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: '16px', padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}

// Shows spinner while auth check is in flight, then redirects to /login if not authenticated
function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-sm text-gray-400">
      Loading…
    </div>
  )
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

// Shows spinner while auth check is in flight, then redirects to /select if already authenticated
function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-sm text-gray-400">
      Loading…
    </div>
  )
  return user ? <Navigate to="/select" replace /> : <Outlet />
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Unauthenticated entry point — /login redirects to /select if already logged in */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* All protected routes — redirect to /login if not authenticated */}
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
              </Route>

              {/* Root and any unmatched path both go to /login — PublicRoute handles the auth check there */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}