"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Dumbbell, CheckCircle, Clock, PlayCircle, ChevronDown, ChevronUp, LogOut, Trophy, TrendingUp, X } from "lucide-react";
import { Workout, WorkoutDay } from "@/types";

interface AlunoSession {
  id: string;
  nome: string;
  userId: string;
  personalId: string;
}

interface ActivityMap {
  [treinoId: string]: { concluido: boolean; tempoVisualizacao: number };
}

const DIAS_ORDER = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function AlunoTreinosPage() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId as string;
  const personalId = params.personalId as string;

  const [session, setSession] = useState<AlunoSession | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activities, setActivities] = useState<ActivityMap>({});
  const [expandedDias, setExpandedDias] = useState<Record<string, boolean>>({});
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const timersRef = useRef<Record<string, number>>({});
  const timerIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const stored = sessionStorage.getItem("aluno_session");
    if (!stored) {
      router.push(`/personal/${personalId}/aluno/${alunoId}/login`);
      return;
    }
    const sess = JSON.parse(stored) as AlunoSession;
    if (sess.id !== alunoId) {
      router.push(`/personal/${personalId}/aluno/${alunoId}/login`);
      return;
    }
    setSession(sess);

    // Carregar treinos e atividades
    Promise.all([
      fetch(`/api/workouts?userId=${sess.userId}`).then((r) => r.json()),
      fetch(`/api/student-activity?alunoId=${alunoId}`).then((r) => r.json()),
    ]).then(([wks, acts]) => {
      // Filtrar treinos deste aluno
      const myWorkouts = (wks as Workout[]).filter((w) => w.studentId === alunoId);
      setWorkouts(myWorkouts);

      const actMap: ActivityMap = {};
      for (const act of acts) {
        actMap[act.treinoId] = {
          concluido: act.concluido,
          tempoVisualizacao: act.tempoVisualizacao,
        };
      }
      setActivities(actMap);
      setLoading(false);
    });
  }, [alunoId, personalId, router]);

  const startTimer = (treinoId: string) => {
    if (timerIntervalsRef.current[treinoId]) return;
    timersRef.current[treinoId] = activities[treinoId]?.tempoVisualizacao ?? 0;

    timerIntervalsRef.current[treinoId] = setInterval(() => {
      timersRef.current[treinoId] = (timersRef.current[treinoId] ?? 0) + 1;
    }, 1000);
  };

  const stopTimer = (treinoId: string) => {
    if (timerIntervalsRef.current[treinoId]) {
      clearInterval(timerIntervalsRef.current[treinoId]);
      delete timerIntervalsRef.current[treinoId];
      // Salvar tempo
      saveActivity(treinoId, activities[treinoId]?.concluido ?? false, timersRef.current[treinoId] ?? 0);
    }
  };

  const toggleDia = (diaKey: string, treinoId: string) => {
    const willOpen = !expandedDias[diaKey];
    setExpandedDias((prev) => ({ ...prev, [diaKey]: willOpen }));
    if (willOpen) startTimer(treinoId);
    else stopTimer(treinoId);
  };

  const saveActivity = async (treinoId: string, concluido: boolean, tempo?: number) => {
    const tempoVisualizacao = tempo ?? timersRef.current[treinoId] ?? activities[treinoId]?.tempoVisualizacao ?? 0;
    await fetch("/api/student-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alunoId, treinoId, tempoVisualizacao, concluido }),
    });
    setActivities((prev) => ({ ...prev, [treinoId]: { concluido, tempoVisualizacao } }));
  };

  const toggleConcluido = (treinoId: string) => {
    const current = activities[treinoId]?.concluido ?? false;
    saveActivity(treinoId, !current);
  };

  const getEmbedUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  const openVideo = (url: string, title: string) => {
    const embedUrl = getEmbedUrl(url);
    if (embedUrl) setVideoModal({ url: embedUrl, title });
    else window.open(url, "_blank");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const logout = () => {
    sessionStorage.removeItem("aluno_session");
    router.push(`/personal/${personalId}/aluno/${alunoId}/login`);
  };

  const totalTreinos = workouts.length;
  const concluidos = Object.values(activities).filter((a) => a.concluido).length;
  const progressoPct = totalTreinos > 0 ? Math.round((concluidos / totalTreinos) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-600 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500/20 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">
                PT<span className="text-brand-500">Pro</span>
              </p>
              <p className="text-dark-300 text-xs">Olá, {session?.nome.split(" ")[0]}! 💪</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-dark-300 hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progresso geral */}
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-400" />
            <h2 className="font-display font-bold text-white">Sua Evolução</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-dark-700/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white font-display">{totalTreinos}</p>
              <p className="text-xs text-dark-300 mt-0.5">treinos</p>
            </div>
            <div className="bg-dark-700/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400 font-display">{concluidos}</p>
              <p className="text-xs text-dark-300 mt-0.5">concluídos</p>
            </div>
            <div className="bg-dark-700/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-brand-400 font-display">{progressoPct}%</p>
              <p className="text-xs text-dark-300 mt-0.5">progresso</p>
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="w-full bg-dark-700 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressoPct}%` }}
            />
          </div>
          {progressoPct === 100 && (
            <div className="flex items-center gap-2 mt-3 text-yellow-400 text-sm font-medium">
              <Trophy size={16} /> Parabéns! Você completou todos os treinos! 🏆
            </div>
          )}
        </div>

        {/* Lista de treinos */}
        <div>
          <h2 className="font-display font-bold text-white text-lg mb-4">Meus Treinos</h2>

          {workouts.length === 0 ? (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 text-center">
              <Dumbbell size={40} className="text-dark-400 mx-auto mb-3" />
              <p className="text-white font-medium">Nenhum treino disponível ainda</p>
              <p className="text-dark-300 text-sm mt-1">Seu personal trainer irá adicionar seus treinos em breve!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => {
                const act = activities[workout.id];
                const sortedDias = [...workout.dias].sort(
                  (a, b) => DIAS_ORDER.indexOf(a.diaSemana) - DIAS_ORDER.indexOf(b.diaSemana)
                );

                return (
                  <div key={workout.id} className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden">
                    {/* Header do treino */}
                    <div className="p-4 border-b border-dark-600">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-brand-500/15 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
                              {workout.nivel}
                            </span>
                            <span className="text-xs bg-dark-700 text-dark-200 px-2 py-0.5 rounded-full">
                              {workout.objetivo}
                            </span>
                          </div>
                          <p className="text-dark-300 text-xs mt-1">
                            {workout.dias.length} dia{workout.dias.length !== 1 ? "s" : ""} ·{" "}
                            {workout.dias.reduce((a, d) => a + d.exercises.length, 0)} exercícios
                          </p>
                          {act?.tempoVisualizacao ? (
                            <p className="text-dark-400 text-xs mt-0.5 flex items-center gap-1">
                              <Clock size={11} /> {formatTime(act.tempoVisualizacao)} estudados
                            </p>
                          ) : null}
                        </div>
                        <button
                          onClick={() => toggleConcluido(workout.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                            act?.concluido
                              ? "bg-green-500/15 text-green-400 border-green-500/20"
                              : "bg-dark-700 text-dark-300 border-dark-600 hover:border-brand-500/30 hover:text-brand-400"
                          }`}
                        >
                          <CheckCircle size={13} />
                          {act?.concluido ? "Concluído!" : "Concluir"}
                        </button>
                      </div>
                    </div>

                    {/* Dias do treino */}
                    <div className="divide-y divide-dark-700">
                      {sortedDias.map((dia) => {
                        const key = `${workout.id}-${dia.id}`;
                        const open = expandedDias[key];

                        return (
                          <div key={dia.id}>
                            <button
                              onClick={() => toggleDia(key, workout.id)}
                              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-dark-700/40 transition-colors"
                            >
                              <div>
                                <span className="font-display font-semibold text-brand-400 text-sm">
                                  {dia.diaSemana}
                                </span>
                                {dia.descricaoDia && (
                                  <span className="text-dark-300 text-xs ml-2">— {dia.descricaoDia}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-dark-300">
                                <span className="text-xs">{dia.exercises.length} exerc.</span>
                                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </button>

                        {open && (
                              <div className="px-4 pb-4 space-y-4">
                                {dia.exercises.map((ex, idx) => (
                                  <div key={ex.id} className="bg-dark-700/60 rounded-xl overflow-hidden border border-dark-600/50 hover:border-brand-500/20 transition-colors">
                                    <div className="p-4">
                                      {/* Header do exercicio */}
                                      <div className="flex items-start justify-between mb-4">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 flex items-center justify-center bg-brand-500/10 text-brand-400 font-bold text-xs rounded-full">
                                              {idx + 1}
                                            </span>
                                            <h3 className="font-display font-semibold text-white text-base">
                                              {ex.exercicio}
                                            </h3>
                                          </div>
                                          {ex.descricao && (
                                            <p className="text-dark-300 text-sm mt-1 ml-7 italic border-l-2 border-dark-600 pl-2">
                                              {ex.descricao}
                                            </p>
                                          )}
                                        </div>
                                        {ex.aulaUrl && (
                                          <button
                                            onClick={() => openVideo(ex.aulaUrl!, ex.exercicio)}
                                            className="ml-2 flex flex-col items-center gap-1 group text-brand-400 hover:text-brand-300 transition-colors"
                                            title="Ver vídeo da aula"
                                          >
                                            <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                                              <PlayCircle size={18} />
                                            </div>
                                            <span className="text-[10px] font-medium text-dark-300 group-hover:text-brand-300">
                                              Vídeo
                                            </span>
                                          </button>
                                        )}
                                      </div>

                                      {/* Métricas */}
                                      <div className="grid grid-cols-3 gap-3 ml-7">
                                        <div className="bg-dark-800 rounded-lg p-2 text-center border border-dark-600">
                                          <p className="text-[10px] uppercase tracking-wider text-dark-400 font-bold mb-0.5">Séries</p>
                                          <p className="text-white font-bold font-display">{ex.series}</p>
                                        </div>
                                        <div className="bg-dark-800 rounded-lg p-2 text-center border border-dark-600">
                                          <p className="text-[10px] uppercase tracking-wider text-dark-400 font-bold mb-0.5">Repetições</p>
                                          <p className="text-white font-bold font-display">{ex.repeticoes}</p>
                                        </div>
                                        {ex.peso ? (
                                          <div className="bg-dark-800 rounded-lg p-2 text-center border border-dark-600">
                                            <p className="text-[10px] uppercase tracking-wider text-dark-400 font-bold mb-0.5">Carga (kg)</p>
                                            <p className="text-brand-400 font-bold font-display">{ex.peso}</p>
                                          </div>
                                        ) : (
                                          <div className="bg-dark-800/50 rounded-lg p-2 text-center border border-dashed border-dark-600">
                                            <p className="text-[10px] uppercase tracking-wider text-dark-400 font-bold mb-0.5">Carga</p>
                                            <p className="text-dark-500 font-display text-sm">-</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Video Modal */}
      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-dark-600">
            <div className="p-4 border-b border-dark-600 flex items-center justify-between">
              <h3 className="font-display font-bold text-white pr-4 truncate">{videoModal.title}</h3>
              <button
                onClick={() => setVideoModal(null)}
                className="text-dark-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              {videoModal.url.includes("youtube.com/embed") ? (
                <iframe
                  src={videoModal.url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={videoModal.url} controls className="w-full h-full" autoPlay />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
