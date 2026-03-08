"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Dumbbell, ClipboardList, PlaySquare, TrendingUp, Award, CheckCircle, Shield, LogOut } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#ea580c", "#a855f7", "#22c55e"];

interface Stats {
  totalStudents: number;
  totalPersonals: number;
  totalWorkouts: number;
  totalLessons: number;
  totalActivities: number;
  concludedActivities: number;
  completionRate: number;
  avgStudentsPerPersonal: number;
  workoutsByObj: { name: string; value: number }[];
  workoutsByNivel: { name: string; value: number }[];
  recentStudents: { id: string; nome: string; createdAt: string }[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const logout = () => {
    sessionStorage.removeItem("admin_token");
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total de Alunos", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Personal Trainers", value: stats?.totalPersonals ?? 0, icon: Award, color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
    { label: "Total de Treinos", value: stats?.totalWorkouts ?? 0, icon: ClipboardList, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "Aulas Criadas", value: stats?.totalLessons ?? 0, icon: PlaySquare, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Média Alunos/Personal", value: stats?.avgStudentsPerPersonal ?? 0, icon: TrendingUp, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { label: "Taxa de Conclusão", value: `${stats?.completionRate ?? 0}%`, icon: CheckCircle, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="bg-dark-800 border-b border-dark-600 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="font-display font-bold text-white">Painel Administrativo</p>
              <p className="text-dark-300 text-xs">PT<span className="text-brand-500">Pro</span> · Visão Master</p>
            </div>
          </div>
          <button onClick={logout} className="text-dark-300 hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-300 text-sm mt-1">Visão geral da plataforma</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${bg} mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold font-display text-white">{value}</p>
              <p className="text-dark-300 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Treinos por objetivo */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white mb-4">Treinos por Objetivo</h3>
            {(stats?.workoutsByObj?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats?.workoutsByObj}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats?.workoutsByObj.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1e1e2e", border: "1px solid #333", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-dark-400 text-sm text-center py-8">Sem dados</p>
            )}
          </div>

          {/* Treinos por nível */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white mb-4">Treinos por Nível</h3>
            {(stats?.workoutsByNivel?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.workoutsByNivel}>
                  <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "#1e1e2e", border: "1px solid #333", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-dark-400 text-sm text-center py-8">Sem dados</p>
            )}
          </div>
        </div>

        {/* Atividades */}
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Engajamento dos Alunos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-dark-700/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white font-display">{stats?.totalActivities ?? 0}</p>
              <p className="text-dark-300 text-xs mt-1">Interações totais</p>
            </div>
            <div className="bg-dark-700/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400 font-display">{stats?.concludedActivities ?? 0}</p>
              <p className="text-dark-300 text-xs mt-1">Treinos concluídos</p>
            </div>
            <div className="bg-dark-700/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-brand-400 font-display">{stats?.completionRate ?? 0}%</p>
              <p className="text-dark-300 text-xs mt-1">Taxa de conclusão</p>
            </div>
          </div>
          {/* Barra de progresso */}
          {(stats?.totalActivities ?? 0) > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-dark-300 mb-1">
                <span>Progresso geral da plataforma</span>
                <span>{stats?.completionRate}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full"
                  style={{ width: `${stats?.completionRate ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
