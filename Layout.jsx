import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import {
  LayoutDashboard, Car, FileText, Calculator, Users,
  Menu, LogOut, Wrench, ArrowLeftRight,
} from 'lucide-react'

const salesNav = [
  { to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sales/inventory', icon: Car,             label: 'Inventory' },
  { to: '/sales/deals',     icon: FileText,        label: 'Deals' },
  { to: '/sales/desk',      icon: Calculator,      label: 'Desk' },
  { to: '/sales/crm',       icon: Users,           label: 'CRM' },
]

const serviceNav = [
  { to: '/service', icon: Wrench, label: 'Repair Orders', end: true },
]

function SidebarInner({ isSales, nav, accent, divider, user, onLogout, onClose, onSwitch }) {
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? isSales
          ? 'bg-blue-50 text-[#378ADD] font-medium'
          : 'bg-white/10 text-[#e67e00] font-medium'
        : isSales
          ? 'text-gray-600 hover:bg-gray-50'
          : 'text-gray-400 hover:bg-white/5'
    }`

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`px-5 py-4 border-b ${divider}`}>
        <div className="font-bold text-base" style={{ color: accent }}>AutoDMS</div>
        <div className={`text-xs mt-0.5 ${isSales ? 'text-gray-400' : 'text-gray-500'}`}>
          {isSales ? 'Sales' : 'Service'}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={linkClass}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={`p-3 border-t ${divider} space-y-1`}>
        {/* Switch module */}
        <button
          onClick={onSwitch}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
            isSales
              ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <ArrowLeftRight size={14} />
          {isSales ? 'Switch to Service' : 'Switch to Sales'}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{ background: accent }}
          >
            {user?.first?.[0]}{user?.last?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-medium truncate ${isSales ? 'text-gray-800' : 'text-gray-200'}`}>
              {user?.first} {user?.last}
            </div>
            <div className={`text-xs capitalize ${isSales ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.role}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={onLogout}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
            isSales
              ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
          }`}
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

  const isSales  = module === 'sales'
  const nav      = isSales ? salesNav : serviceNav
  const accent   = isSales ? '#378ADD' : '#e67e00'
  const sidebarBg = isSales ? 'bg-white border-r border-gray-200' : 'bg-[#1a1a1a]'
  const divider  = isSales ? 'border-gray-100' : 'border-white/10'

  const handleLogout = async () => { await logout(); navigate('/login') }
  const handleSwitch = () => navigate(isSales ? '/service' : '/sales/dashboard')

  const sidebarProps = {
    isSales, nav, accent, divider, user,
    onLogout: handleLogout,
    onClose:  () => setOpen(false),
    onSwitch: handleSwitch,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f3]">
      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col w-52 shrink-0 ${sidebarBg}`}>
        <SidebarInner {...sidebarProps} />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className={`relative w-52 flex flex-col z-50 ${sidebarBg}`}>
            <SidebarInner {...sidebarProps} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className={`md:hidden flex items-center gap-3 px-4 py-3 border-b ${
          isSales ? 'bg-white border-gray-200' : 'bg-[#1a1a1a] border-white/10'
        }`}>
          <button onClick={() => setOpen(true)} className={isSales ? 'text-gray-600' : 'text-gray-400'}>
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm" style={{ color: accent }}>AutoDMS</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}