export interface User {
  id: string
  username: string
  password: string
  createdAt: string
}

export interface Student {
  id: string
  userId: string
  nome: string
  biotipo: 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo'
  idade: number
  altura: number
  peso: number
  observacoes?: string
  historicoPeso?: { data: string; peso: number }[]
  createdAt: string
}

export interface Exercise {
  id: string
  exercicio: string
  repeticoes: string
  series: string
  peso: string
  descricao?: string
}

export interface WorkoutDay {
  id: string
  diaSemana: string
  exercises: Exercise[]
}

export interface Workout {
  id: string
  userId: string
  studentId: string
  objetivo: 'Hipertrofia' | 'Emagrecimento' | 'Condicionamento' | 'Força' | 'Resistência' | 'Reabilitação'
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado'
  dias: WorkoutDay[]
  createdAt: string
  updatedAt: string
}

export interface AppData {
  users: User[]
  students: Student[]
  workouts: Workout[]
}
