import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { LayoutDashboard, Car, FileText, Wrench, Users, LogOut, Menu, X, Calculator } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/inventory', icon: Car, label: 'Inventory' },
  { to: '/deals', icon: FileText, label: 'Deals' },
  { to: '/desk', icon: Calculator, label: 'Desk' },
  { to: '/service', icon: Wrench, label: 'Service' },
  { to: '/users', icon: Users, label: 'Users' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="font-bold text-lg text-gray-900">AutoDMS</div>
        <div className="text-xs text-gray-400">Dealer management</div>
      </div>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
          {user?.first?.[0]}{user?.last?.[0]}
        </div>
        <div>
          <div className="text-sm font-medium">{user?.first} {user?.last}</div>
          <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-gray-900 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Icon size={16} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-gray-100">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 w-full transition-colors">
          <LogOut size={16} />Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="hidden md:flex w-56 flex-col bg-white border-r border-gray-100 flex-shrink-0">
        <Sidebar />
      </aside>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white flex flex-col z-50">
            <button className="absolute top-4 right-4" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            <Sidebar />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <span className="font-semibold">AutoDMS</span>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  )
}
