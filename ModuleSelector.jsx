import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Car, Wrench, ChevronRight } from 'lucide-react'

export default function ModuleSelector() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f0efe9] flex flex-col">
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#378ADD]">AutoDMS</span>
          <span className="text-xs text-gray-400">v2</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Hi, {user?.first}</span>
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold text-gray-800">Select a module</h1>
            <p className="text-gray-400 mt-2 text-sm">Where would you like to go?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button
              onClick={() => navigate('/sales/dashboard')}
              className="bg-white rounded-2xl p-8 text-left border border-gray-200 hover:border-[#378ADD] hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-[#378ADD] transition-colors">
                <Car size={28} className="text-[#378ADD] group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-800 mb-1">Sales</div>
                  <div className="text-sm text-gray-400">Inventory · Deals · Desk · CRM</div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-[#378ADD] transition-colors mt-0.5" />
              </div>
            </button>

            <button
              onClick={() => navigate('/service')}
              className="bg-white rounded-2xl p-8 text-left border border-gray-200 hover:border-[#e67e00] hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-[#e67e00] transition-colors">
                <Wrench size={28} className="text-[#e67e00] group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-800 mb-1">Service</div>
                  <div className="text-sm text-gray-400">Repair orders · Estimates · History</div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-[#e67e00] transition-colors mt-0.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
