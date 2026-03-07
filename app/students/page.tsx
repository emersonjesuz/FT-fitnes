'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getStudents, deleteStudent, createStudent, saveStudent, getWorkouts } from '@/lib/storage'
import { Student } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import { Plus, Search, Edit2, Trash2, User, TrendingUp, X, ChevronDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const BIOTIPOS = ['Ectomorfo', 'Mesomorfo', 'Endomorfo'] as const
const NIVEL_BADGE: Record<string, string> = {
  'Iniciante': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Intermediário': 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  'Avançado': 'bg-red-500/15 text-red-400 border-red-500/20',
}

interface StudentModalProps {
  student?: Student | null
  userId: string
  onClose: () => void
  onSave: () => void
}

function StudentModal({ student, userId, onClose, onSave }: StudentModalProps) {
  const [form, setForm] = useState({
    nome: student?.nome || '',
    biotipo: student?.biotipo || 'Ectomorfo',
    idade: student?.idade?.toString() || '',
    altura: student?.altura?.toString() || '',
    peso: student?.peso?.toString() || '',
    observacoes: student?.observacoes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nome.trim()) e.nome = 'Nome obrigatório'
    if (!form.idade || isNaN(+form.idade) || +form.idade < 10 || +form.idade > 100) e.idade = 'Idade inválida (10-100)'
    if (!form.altura || isNaN(+form.altura) || +form.altura < 1 || +form.altura > 2.5) e.altura = 'Altura inválida (1.0 - 2.5m)'
    if (!form.peso || isNaN(+form.peso) || +form.peso < 20 || +form.peso > 300) e.peso = 'Peso inválido (20-300kg)'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const data = {
      nome: form.nome.trim(),
      biotipo: form.biotipo as Student['biotipo'],
      idade: +form.idade,
      altura: +form.altura,
      peso: +form.peso,
      observacoes: form.observacoes.trim(),
      historicoPeso: student?.historicoPeso || [{ data: new Date().toISOString(), peso: +form.peso }],
    }

    if (student) {
      // Update - add weight history if changed
      const historico = [...(student.historicoPeso || [{ data: student.createdAt, peso: student.peso }])]
      if (+form.peso !== student.peso) {
        historico.push({ data: new Date().toISOString(), peso: +form.peso })
      }
      saveStudent({ ...student, ...data, historicoPeso: historico })
    } else {
      createStudent(userId, data)
    }
    onSave()
    onClose()
  }

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        className={`input-field ${errors[key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => { const n = { ...er }; delete n[key]; return n }) }}
      />
      {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="modal-content bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <h2 className="font-display text-lg font-bold text-white">{student ? 'Editar Aluno' : 'Adicionar Aluno'}</h2>
          <button onClick={onClose} className="text-dark-200 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field('nome', 'Nome completo', 'text', 'Ex: João Silva')}
          <div>
            <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">Biotipo</label>
            <div className="relative">
              <select className="select-field" value={form.biotipo} onChange={e => setForm(f => ({ ...f, biotipo: e.target.value }))}>
                {BIOTIPOS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-200 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field('idade', 'Idade', 'number', '25')}
            {field('altura', 'Altura (m)', 'number', '1.75')}
            {field('peso', 'Peso (kg)', 'number', '72')}
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">Observações (opcional)</label>
            <textarea
              className="input-field resize-none h-20"
              placeholder="Lesões, restrições, objetivos específicos..."
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{student ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WeightChart({ student }: { student: Student }) {
  const data = (student.historicoPeso || [{ data: student.createdAt, peso: student.peso }])
    .map(h => ({
      data: new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      peso: h.peso,
    }))
  if (data.length < 2) return <p className="text-xs text-dark-300 text-center py-4">Histórico insuficiente</p>
  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data}>
        <XAxis dataKey="data" tick={{ fontSize: 9, fill: '#71717f' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#71717f' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ background: '#1a1a1e', border: '1px solid #3d3d48', borderRadius: '8px', fontSize: '11px' }} />
        <Line type="monotone" dataKey="peso" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function StudentsPage() {
  const { user, loading } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [workouts, setWorkouts] = useState<ReturnType<typeof getWorkouts>>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = () => {
    if (user) {
      setStudents(getStudents(user.id))
      setWorkouts(getWorkouts(user.id))
    }
  }

  useEffect(() => { load() }, [user])

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><span className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>

  const filtered = students.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = (id: string) => {
    if (confirm('Excluir este aluno? Todos os treinos associados também serão removidos.')) {
      deleteStudent(id)
      load()
    }
  }

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Alunos</h1>
            <p className="text-dark-200 text-sm mt-1">{students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Adicionar aluno
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Buscar aluno por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <User size={48} className="text-dark-400 mb-4" />
            <p className="text-white font-medium">{search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}</p>
            <p className="text-dark-300 text-sm mt-1">{search ? 'Tente outra busca' : 'Clique em "Adicionar aluno" para começar'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(student => {
              const studentWorkouts = workouts.filter(w => w.studentId === student.id)
              const expanded = expandedId === student.id
              return (
                <div key={student.id} className="card overflow-hidden transition-all">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center font-display font-bold text-brand-400 flex-shrink-0">
                          {student.nome[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-white">{student.nome}</h3>
                          <span className="text-xs text-dark-200">{student.biotipo}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(student); setModalOpen(true) }} className="w-8 h-8 rounded-lg bg-dark-600 hover:bg-dark-500 flex items-center justify-center text-dark-200 hover:text-white transition-all">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="w-8 h-8 rounded-lg bg-dark-600 hover:bg-red-500/10 flex items-center justify-center text-dark-200 hover:text-red-400 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Idade', value: `${student.idade} anos` },
                        { label: 'Altura', value: `${student.altura}m` },
                        { label: 'Peso', value: `${student.peso}kg` },
                      ].map(stat => (
                        <div key={stat.label} className="bg-dark-700/60 rounded-lg py-2">
                          <p className="text-xs text-dark-300">{stat.label}</p>
                          <p className="text-sm font-semibold text-white mt-0.5">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-dark-300">
                        <TrendingUp size={12} className="text-brand-400" />
                        <span>{studentWorkouts.length} treino{studentWorkouts.length !== 1 ? 's' : ''}</span>
                      </div>
                      {student.observacoes && (
                        <span className="text-xs text-dark-300 italic truncate max-w-[140px]">{student.observacoes}</span>
                      )}
                    </div>
                  </div>

                  {/* Expand weight chart */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : student.id)}
                    className="w-full px-5 py-2.5 border-t border-dark-600/50 flex items-center justify-between text-xs text-dark-300 hover:text-white hover:bg-dark-700/30 transition-all"
                  >
                    <span>Histórico de peso</span>
                    <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded && (
                    <div className="px-5 pb-4 pt-2">
                      <WeightChart student={student} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {modalOpen && (
        <StudentModal
          student={editing}
          userId={user!.id}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={load}
        />
      )}
    </div>
  )
}
