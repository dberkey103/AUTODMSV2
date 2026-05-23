import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Car, Wrench, ChevronRight } from 'lucide-react'

export default function ModuleSelector() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tracking-tight">CARSATION</span>
          <span className="text-xs text-[#E31837] font-medium tracking-widest uppercase">DMS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Hi, {user?.first}</span>
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold text-white">Select a module</h1>
            <p className="text-gray-500 mt-2 text-sm">Where would you like to go?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button
              onClick={() => navigate('/sales/dashboard')}
              className="bg-[#141414] rounded-2xl p-8 text-left border border-[#2a2a2a] hover:border-[#E31837] hover:shadow-lg hover:shadow-red-900/20 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-[#1e1e1e] flex items-center justify-center mb-5 group-hover:bg-[#E31837] transition-colors">
                <Car size={28} className="text-[#E31837] group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-white mb-1">Sales</div>
                  <div className="text-sm text-gray-500">Inventory · Deals · Desk · CRM</div>
                </div>
                <ChevronRight size={20} className="text-gray-600 group-hover:text-[#E31837] transition-colors mt-0.5" />
              </div>
            </button>

            <button
              onClick={() => navigate('/service')}
              className="bg-[#141414] rounded-2xl p-8 text-left border border-[#2a2a2a] hover:border-[#E31837] hover:shadow-lg hover:shadow-red-900/20 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-[#1e1e1e] flex items-center justify-center mb-5 group-hover:bg-[#E31837] transition-colors">
                <Wrench size={28} className="text-[#E31837] group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-white mb-1">Service</div>
                  <div className="text-sm text-gray-500">Repair orders · Estimates · History</div>
                </div>
                <ChevronRight size={20} className="text-gray-600 group-hover:text-[#E31837] transition-colors mt-0.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
