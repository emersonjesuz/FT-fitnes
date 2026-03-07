import { User, Student, Workout } from '@/types'

const STORAGE_KEYS = {
  users: 'pt_users',
  students: 'pt_students',
  workouts: 'pt_workouts',
  currentUser: 'pt_current_user',
}

function getItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

// Users
export function getUsers(): User[] {
  return getItem<User>(STORAGE_KEYS.users)
}

export function saveUsers(users: User[]): void {
  setItem(STORAGE_KEYS.users, users)
}

export function findUser(username: string): User | undefined {
  return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase())
}

export function createUser(username: string, password: string): User {
  const users = getUsers()
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    username,
    password,
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  saveUsers(users)
  return newUser
}

// Current session
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user))
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.currentUser)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function logout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.currentUser)
}

// Students
export function getStudents(userId: string): Student[] {
  return getItem<Student>(STORAGE_KEYS.students).filter(s => s.userId === userId)
}

export function getAllStudents(): Student[] {
  return getItem<Student>(STORAGE_KEYS.students)
}

export function saveStudent(student: Student): void {
  const students = getAllStudents()
  const idx = students.findIndex(s => s.id === student.id)
  if (idx >= 0) {
    students[idx] = student
  } else {
    students.push(student)
  }
  setItem(STORAGE_KEYS.students, students)
}

export function deleteStudent(id: string): void {
  const students = getAllStudents().filter(s => s.id !== id)
  setItem(STORAGE_KEYS.students, students)
  // Also delete workouts for this student
  const workouts = getAllWorkouts().filter(w => w.studentId !== id)
  setItem(STORAGE_KEYS.workouts, workouts)
}

export function createStudent(userId: string, data: Omit<Student, 'id' | 'userId' | 'createdAt'>): Student {
  const student: Student = {
    ...data,
    id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    createdAt: new Date().toISOString(),
  }
  saveStudent(student)
  return student
}

// Workouts
export function getAllWorkouts(): Workout[] {
  return getItem<Workout>(STORAGE_KEYS.workouts)
}

export function getWorkouts(userId: string): Workout[] {
  return getAllWorkouts().filter(w => w.userId === userId)
}

export function getStudentWorkouts(userId: string, studentId: string): Workout[] {
  return getAllWorkouts().filter(w => w.userId === userId && w.studentId === studentId)
}

export function saveWorkout(workout: Workout): void {
  const workouts = getAllWorkouts()
  const idx = workouts.findIndex(w => w.id === workout.id)
  if (idx >= 0) {
    workouts[idx] = workout
  } else {
    workouts.push(workout)
  }
  setItem(STORAGE_KEYS.workouts, workouts)
}

export function deleteWorkout(id: string): void {
  const workouts = getAllWorkouts().filter(w => w.id !== id)
  setItem(STORAGE_KEYS.workouts, workouts)
}

export function createWorkout(userId: string, data: Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Workout {
  const workout: Workout = {
    ...data,
    id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  saveWorkout(workout)
  return workout
}

export function updateWorkout(workout: Workout): void {
  saveWorkout({ ...workout, updatedAt: new Date().toISOString() })
}
