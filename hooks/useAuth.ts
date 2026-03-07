'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout as doLogout } from '@/lib/storage'
import { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) {
      router.push('/login')
    } else {
      setUser(u)
    }
    setLoading(false)
  }, [router])

  const logout = () => {
    doLogout()
    router.push('/login')
  }

  return { user, loading, logout }
}
