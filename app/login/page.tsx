'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { findUser, createUser, setCurrentUser, getCurrentUser } from '@/lib/storage'
import { Dumbbell, Eye, EyeOff, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) router.push('/dashboard')
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Preencha todos os campos.' })
      return
    }

    setLoading(true)
    setMessage(null)

    await new Promise(r => setTimeout(r, 600))

    const existing = findUser(username)

    if (existing) {
      if (existing.password !== password) {
        setMessage({ type: 'error', text: 'Senha incorreta. Tente novamente.' })
        setLoading(false)
        return
      }
      setCurrentUser(existing)
      setMessage({ type: 'success', text: 'Bem-vindo de volta!' })
    } else {
      setMessage({ type: 'info', text: 'Usuário novo detectado. Criando conta automaticamente...' })
      await new Promise(r => setTimeout(r, 800))
      const newUser = createUser(username, password)
      setCurrentUser(newUser)
      setMessage({ type: 'success', text: 'Conta criada com sucesso!' })
    }

    await new Promise(r => setTimeout(r, 500))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-dark-900 flex overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-800 relative flex-col items-center justify-center p-12 border-r border-dark-600">
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f97316 0, #f97316 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}
          />
        </div>

        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-500/10 rounded-2xl border border-brand-500/20 mb-8">
            <Dumbbell className="w-10 h-10 text-brand-400" />
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-4 leading-tight">
            PT<span className="text-brand-500">Pro</span>
          </h1>
          <p className="text-dark-100 text-lg leading-relaxed">
            O sistema completo para personal trainers que querem transformar resultados em ciência.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: 'Alunos', desc: 'Gerencie perfis completos' },
              { label: 'Treinos', desc: 'Monte fichas detalhadas' },
              { label: 'Métricas', desc: 'Acompanhe evolução' },
            ].map(f => (
              <div key={f.label} className="bg-dark-700/50 border border-dark-500/50 rounded-xl p-4 text-left">
                <Zap className="w-5 h-5 text-brand-400 mb-2" />
                <p className="font-display font-semibold text-sm text-white">{f.label}</p>
                <p className="text-xs text-dark-200 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-brand-400" />
            </div>
            <span className="font-display text-2xl font-bold">PT<span className="text-brand-500">Pro</span></span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-white">Entrar no sistema</h2>
            <p className="text-dark-200 mt-2 text-sm">Faça login ou crie sua conta automaticamente.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">Usuário</label>
              <input
                type="text"
                className="input-field"
                placeholder="seu.usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-200 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`rounded-lg px-4 py-3 text-sm animate-slide-up ${
                message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                'bg-brand-500/10 border border-brand-500/20 text-brand-400'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 font-display font-semibold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Aguarde...
                </>
              ) : 'Acessar sistema'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-dark-300">
            Não tem conta? Digite um usuário e senha para criar automaticamente.
          </p>
        </div>
      </div>
    </div>
  )
}
