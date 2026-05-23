import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import {
  LayoutDashboard, Car, FileText, Calculator, Users,
  Menu, LogOut, Wrench,
} from 'lucide-react'

const salesNav = [
  { to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sales/inventory', icon: Car, label: 'Inventory' },
  { to: '/sales/deals', icon: FileText, label: 'Deals' },
  { to: '/sales/desk', icon: Calculator, label: 'Desk' },
  { to: '/sales/crm', icon: Users, label: 'CRM' },
]

const serviceNav = [
  { to: '/service', icon: Wrench, label: 'Repair Orders', end: true },
]

function SidebarInner({ nav, isSales, user, onLogout, onNavigate, onClose }) {
  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      <div className="px-5 py-4 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-base text-white tracking-tight">CARSATION</div>
            <div className="text-xs mt-0.5 text-[#E31837] font-medium tracking-wider">
              {isSales ? 'Sales · DMS' : 'Service · DMS'}
            </div>
          </div>
          <button
            onClick={() => onNavigate('/select')}
            className="text-xs px-2 py-1 rounded text-gray-500 hover:text-gray-300 hover:bg-[#1e1e1e] transition-colors"
          >
            Switch
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#E31837]/10 text-[#E31837] font-medium'
                  : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 bg-[#E31837]">
            {user?.first?.[0]}{user?.last?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate text-gray-200">
              {user?.first} {user?.last}
            </div>
            <div className="text-xs capitalize text-gray-500">
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors text-gray-500 hover:bg-[#1e1e1e] hover:text-gray-300"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function Layout({ module }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const isSales = module === 'sales'
  const nav = isSales ? salesNav : serviceNav

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      <div className="hidden md:flex flex-col w-52 shrink-0 border-r border-[#2a2a2a]">
        <SidebarInner nav={nav} isSales={isSales} user={user} onLogout={handleLogout} onNavigate={navigate} onClose={() => {}} />
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-52 flex flex-col z-50 border-r border-[#2a2a2a]">
            <SidebarInner nav={nav} isSales={isSales} user={user} onLogout={handleLogout} onNavigate={navigate} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] bg-[#0f0f0f]">
          <button onClick={() => setOpen(true)} className="text-gray-400">
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm text-white tracking-tight">CARSATION</span>
          <span className="text-xs text-[#E31837] font-medium tracking-wider">{isSales ? 'Sales' : 'Service'}</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
