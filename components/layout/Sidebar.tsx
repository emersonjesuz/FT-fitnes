'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, LayoutDashboard, Users, ClipboardList, LogOut, X, Menu, PlaySquare } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/students', label: 'Alunos', icon: Users },
  { href: '/workouts', label: 'Treinos', icon: ClipboardList },
  { href: '/lessons', label: 'Aulas', icon: PlaySquare },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-600">
        <div className="w-9 h-9 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-4 h-4 text-brand-400" />
        </div>
        <span className="font-display text-xl font-bold">PT<span className="text-brand-500">Pro</span></span>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'P'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-dark-200">Personal Trainer</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-dark-100 hover:text-white hover:bg-dark-700'
              )}
            >
              <Icon size={18} className={active ? 'text-brand-400' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-dark-600">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-dark-100 hover:text-red-400 hover:bg-red-500/5 transition-all w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-dark-700 border border-dark-500 rounded-lg flex items-center justify-center text-white"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={clsx(
        'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-600 flex flex-col transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-dark-200 hover:text-white"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-dark-800 border-r border-dark-600 flex-col flex-shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>
    </>
  )
}
