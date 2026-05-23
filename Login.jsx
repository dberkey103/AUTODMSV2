import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/select')
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-white mb-1 tracking-tight">CARSATION</div>
          <div className="text-sm text-[#E31837] font-medium tracking-widest uppercase">Dealer Management System</div>
        </div>
        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full h-10 px-3 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] text-white text-sm outline-none focus:border-[#E31837] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] text-white text-sm outline-none focus:border-[#E31837] transition-colors"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-50 bg-[#E31837] hover:bg-[#c0001c]"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
