"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStudents, getWorkouts } from "@/lib/storage";
import { Student, Workout } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import { Users, Dumbbell, TrendingUp, Award, Plus } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#ea580c", "#c2410c", "#9a3412"];

const NIVEL_COLORS: Record<string, string> = {
  Iniciante: "#22c55e",
  Intermediário: "#f97316",
  Avançado: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-xs">
        <p className="text-white font-medium">{label}</p>
        <p className="text-brand-400">
          {payload[0].value} {payload[0].value === 1 ? "item" : "itens"}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [loadedStudents, loadedWorkouts] = await Promise.all([getStudents(user.id), getWorkouts(user.id)]);
      setStudents(loadedStudents);
      setWorkouts(loadedWorkouts);
    };

    load();
  }, [user]);

  if (loading)
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );

  const isEmpty = students.length === 0 && workouts.length === 0;

  // Chart data
  const biotipoData = ["Ectomorfo", "Mesomorfo", "Endomorfo"]
    .map((b) => ({
      name: b,
      value: students.filter((s) => s.biotipo === b).length,
    }))
    .filter((d) => d.value > 0);

  const objetivoData = ["Hipertrofia", "Emagrecimento", "Condicionamento", "Força", "Resistência", "Reabilitação"]
    .map((o) => ({
      name: o,
      value: workouts.filter((w) => w.objetivo === o).length,
    }))
    .filter((d) => d.value > 0);

  const nivelData = ["Iniciante", "Intermediário", "Avançado"]
    .map((n) => ({
      name: n,
      value: workouts.filter((w) => w.nivel === n).length,
    }))
    .filter((d) => d.value > 0);

  // Students workout count
  const topStudents = students
    .map((s) => ({
      name: s.nome.split(" ")[0],
      treinos: workouts.filter((w) => w.studentId === s.id).length,
    }))
    .sort((a, b) => b.treinos - a.treinos)
    .slice(0, 6);

  const stats = [
    {
      label: "Total de Alunos",
      value: students.length,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Total de Treinos",
      value: workouts.length,
      icon: Dumbbell,
      color: "text-brand-400",
      bg: "bg-brand-500/10 border-brand-500/20",
    },
    {
      label: "Média de Treinos/Aluno",
      value: students.length ? (workouts.length / students.length).toFixed(1) : 0,
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      label: "Alunos Avançados",
      value: workouts.filter((w) => w.nivel === "Avançado").length,
      icon: Award,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto pt-16 lg:pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-white">Olá, {user?.username} 👋</h1>
          <p className="text-dark-200 text-sm mt-1">Aqui está um resumo da sua base de alunos.</p>
        </div>

        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-24 h-24 bg-brand-500/10 rounded-3xl border border-brand-500/20 flex items-center justify-center mb-6">
              <Dumbbell className="w-12 h-12 text-brand-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-3">Comece sua jornada</h2>
            <p className="text-dark-200 max-w-md mb-8 leading-relaxed">
              Você ainda não cadastrou alunos ou treinos. Comece adicionando seu primeiro aluno e criando fichas de treino
              personalizadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/students" className="btn-primary flex items-center gap-2">
                <Plus size={16} />
                Adicionar primeiro aluno
              </Link>
              <Link href="/workouts" className="btn-secondary flex items-center gap-2">
                <Dumbbell size={16} />
                Ver treinos
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className={`card p-4 border ${stat.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-dark-200 font-medium">{stat.label}</p>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <p className={`font-display text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Treinos por objetivo */}
              {objetivoData.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-white mb-4">Treinos por Objetivo</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={objetivoData} barSize={24}>
                      <XAxis dataKey="name" tick={{ fill: "#71717f", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#71717f", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                      <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Biotipo */}
              {biotipoData.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-white mb-4">Alunos por Biotipo</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={biotipoData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {biotipoData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Nivel */}
              {nivelData.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-white mb-4">Treinos por Nível</h3>
                  <div className="space-y-3">
                    {["Iniciante", "Intermediário", "Avançado"].map((nivel) => {
                      const count = workouts.filter((w) => w.nivel === nivel).length;
                      const pct = workouts.length ? (count / workouts.length) * 100 : 0;
                      return (
                        <div key={nivel}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-dark-100">{nivel}</span>
                            <span className="font-medium" style={{ color: NIVEL_COLORS[nivel] }}>
                              {count}
                            </span>
                          </div>
                          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: NIVEL_COLORS[nivel] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top students */}
              {topStudents.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-white mb-4">Treinos por Aluno</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topStudents} barSize={24} layout="vertical">
                      <XAxis
                        type="number"
                        tick={{ fill: "#71717f", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: "#a1a1af", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                      <Bar dataKey="treinos" fill="#ea580c" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
