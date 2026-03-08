"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStudents, getWorkouts, deleteWorkout, createWorkout, updateWorkout } from "@/lib/storage";
import { Student, Workout, WorkoutDay, Exercise, Lesson } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import {
  Plus, X, ChevronDown, Trash2, Edit2, Download, ClipboardList,
  FileJson, FileText, FileSpreadsheet, FileType2, Eye, GripVertical,
  MessageCircle, PlayCircle,
} from "lucide-react";
import { exportJSON, exportText, exportExcel, exportDOCX, exportWhatsApp } from "@/lib/exports";

const OBJETIVOS = ["Hipertrofia", "Emagrecimento", "Condicionamento", "Força", "Resistência", "Reabilitação"] as const;
const NIVEIS = ["Iniciante", "Intermediário", "Avançado"] as const;
const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const NIVEL_BADGE: Record<string, string> = {
  Iniciante: "bg-green-500/15 text-green-400 border border-green-500/20",
  Intermediário: "bg-brand-500/15 text-brand-400 border border-brand-500/20",
  Avançado: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const OBJETIVO_BADGE: Record<string, string> = {
  Hipertrofia: "bg-purple-500/15 text-purple-400",
  Emagrecimento: "bg-blue-500/15 text-blue-400",
  Condicionamento: "bg-cyan-500/15 text-cyan-400",
  Força: "bg-red-500/15 text-red-400",
  Resistência: "bg-green-500/15 text-green-400",
  Reabilitação: "bg-yellow-500/15 text-yellow-400",
};

function uid() { return Math.random().toString(36).substr(2, 9); }

function newExercise(): Exercise {
  return { id: uid(), exercicio: "", repeticoes: "", series: "", peso: "", descricao: "", aulaId: "" };
}

function newDay(dia: string): WorkoutDay {
  return { id: uid(), diaSemana: dia, descricaoDia: "", exercises: [newExercise()] };
}

/* ---- Workout Form Modal ---- */
interface WorkoutModalProps {
  students: Student[];
  lessons: Lesson[];
  userId: string;
  workout?: Workout | null;
  onClose: () => void;
  onSave: () => Promise<void>;
}

function WorkoutModal({ students, lessons, userId, workout, onClose, onSave }: WorkoutModalProps) {
  const [studentId, setStudentId] = useState(workout?.studentId || "");
  const [objetivo, setObjetivo] = useState<(typeof OBJETIVOS)[number]>(workout?.objetivo || "Hipertrofia");
  const [nivel, setNivel] = useState<(typeof NIVEIS)[number]>(workout?.nivel || "Iniciante");
  const [dias, setDias] = useState<WorkoutDay[]>(workout?.dias || []);
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDD, setShowStudentDD] = useState(false);
  // DnD state
  const dragExIdx = useRef<{ diaId: string; exIdx: number } | null>(null);

  const selectedStudent = students.find((s) => s.id === studentId);
  const filteredStudents = students.filter((s) => s.nome.toLowerCase().includes(studentSearch.toLowerCase()));
  const usedDias = dias.map((d) => d.diaSemana);
  const availableDias = DIAS.filter((d) => !usedDias.includes(d));

  const addDia = () => {
    if (availableDias.length === 0) return;
    const next = availableDias[0];
    const newDias = [...dias, newDay(next)];
    // Ordenar por dia da semana
    newDias.sort((a, b) => DIAS.indexOf(a.diaSemana) - DIAS.indexOf(b.diaSemana));
    setDias(newDias);
  };

  const removeDia = (id: string) => setDias((d) => d.filter((x) => x.id !== id));

  const updateDiaDia = (id: string, diaSemana: string) => {
    // Não permitir duplicar dias
    const alreadyUsed = dias.some((d) => d.id !== id && d.diaSemana === diaSemana);
    if (alreadyUsed) return;
    setDias((prev) => {
      const updated = prev.map((x) => (x.id === id ? { ...x, diaSemana } : x));
      return [...updated].sort((a, b) => DIAS.indexOf(a.diaSemana) - DIAS.indexOf(b.diaSemana));
    });
  };

  const updateDiaDesc = (id: string, descricaoDia: string) =>
    setDias((d) => d.map((x) => (x.id === id ? { ...x, descricaoDia } : x)));

  const addExercise = (diaId: string) =>
    setDias((d) => d.map((x) => (x.id === diaId ? { ...x, exercises: [...x.exercises, newExercise()] } : x)));

  const removeExercise = (diaId: string, exId: string) =>
    setDias((d) => d.map((x) => (x.id === diaId ? { ...x, exercises: x.exercises.filter((e) => e.id !== exId) } : x)));

  const updateExercise = (diaId: string, exId: string, field: keyof Exercise, value: string) =>
    setDias((d) =>
      d.map((x) =>
        x.id === diaId
          ? { ...x, exercises: x.exercises.map((e) => (e.id === exId ? { ...e, [field]: value } : e)) }
          : x
      )
    );

  // Ao escolher aula, preencher aulaUrl e aulaNome automaticamente
  const updateExerciseAula = (diaId: string, exId: string, aulaId: string) => {
    const aula = lessons.find((l) => l.id === aulaId);
    setDias((d) =>
      d.map((x) =>
        x.id === diaId
          ? {
              ...x,
              exercises: x.exercises.map((e) =>
                e.id === exId
                  ? { ...e, aulaId, aulaUrl: aula?.videoUrl || "", aulaNome: aula?.nome || "" }
                  : e
              ),
            }
          : x
      )
    );
  };

  // Drag and drop de exercícios
  const handleDragStart = (diaId: string, exIdx: number) => {
    dragExIdx.current = { diaId, exIdx };
  };

  const handleDragOver = (e: React.DragEvent, diaId: string, exIdx: number) => {
    e.preventDefault();
    if (!dragExIdx.current || dragExIdx.current.diaId !== diaId) return;
    if (dragExIdx.current.exIdx === exIdx) return;

    setDias((prev) =>
      prev.map((x) => {
        if (x.id !== diaId) return x;
        const exs = [...x.exercises];
        const [dragged] = exs.splice(dragExIdx.current!.exIdx, 1);
        exs.splice(exIdx, 0, dragged);
        dragExIdx.current = { diaId, exIdx };
        return { ...x, exercises: exs };
      })
    );
  };

  const handleSave = async () => {
    if (!studentId) { alert("Selecione um aluno"); return; }
    if (dias.length === 0) { alert("Adicione pelo menos um dia de treino"); return; }

    if (workout) {
      await updateWorkout({ ...workout, studentId, objetivo, nivel, dias });
    } else {
      await createWorkout(userId, { studentId, objetivo, nivel, dias });
    }
    await onSave();
    onClose();
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="modal-content bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-dark-600 sticky top-0 bg-dark-800 z-10">
          <h2 className="font-display text-lg font-bold text-white">{workout ? "Editar Treino" : "Criar Treino"}</h2>
          <button onClick={onClose} className="text-dark-200 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Student selector */}
          <div>
            <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">Aluno</label>
            <div className="relative">
              <button type="button" onClick={() => setShowStudentDD(!showStudentDD)} className="input-field flex items-center justify-between text-left">
                <span className={selectedStudent ? "text-white" : "text-dark-300"}>
                  {selectedStudent ? selectedStudent.nome : "Selecionar aluno..."}
                </span>
                <ChevronDown size={14} className="text-dark-300 flex-shrink-0" />
              </button>
              {showStudentDD && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-dark-700 border border-dark-500 rounded-xl z-20 shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-dark-600">
                    <input className="input-field text-xs py-1.5" placeholder="Buscar aluno..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} autoFocus />
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <button key={s.id} type="button" onClick={() => { setStudentId(s.id); setShowStudentDD(false); setStudentSearch(""); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-dark-600 transition-colors flex items-center gap-3 ${studentId === s.id ? "text-brand-400" : "text-white"}`}>
                        <div className="w-7 h-7 bg-brand-500/20 rounded-lg flex items-center justify-center text-brand-400 font-bold text-xs flex-shrink-0">{s.nome[0]}</div>
                        <div><p className="font-medium">{s.nome}</p><p className="text-xs text-dark-300">{s.biotipo} · {s.peso}kg</p></div>
                      </button>
                    ))}
                    {filteredStudents.length === 0 && <p className="px-4 py-3 text-sm text-dark-300">Nenhum aluno encontrado</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Objetivo + Nivel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">Objetivo</label>
              <div className="relative">
                <select className="select-field" value={objetivo} onChange={(e) => setObjetivo(e.target.value as any)}>
                  {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">Nível</label>
              <div className="relative">
                <select className="select-field" value={nivel} onChange={(e) => setNivel(e.target.value as any)}>
                  {NIVEIS.map((n) => <option key={n}>{n}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Dias de treino */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-dark-100 uppercase tracking-wider">Dias de treino</label>
              <button type="button" onClick={addDia} disabled={availableDias.length === 0}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus size={13} /> Adicionar dia
              </button>
            </div>

            {dias.length === 0 && (
              <div className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center">
                <p className="text-dark-300 text-sm">Nenhum dia adicionado. Clique em &ldquo;Adicionar dia&rdquo;.</p>
              </div>
            )}

            <div className="space-y-4">
              {dias.map((dia) => (
                <div key={dia.id} className="bg-dark-700/50 border border-dark-600 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-dark-700 border-b border-dark-600 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Seletor de dia sem duplicar */}
                      <div className="relative">
                        <select
                          className="bg-transparent text-brand-400 font-display font-semibold text-sm focus:outline-none cursor-pointer pr-5"
                          value={dia.diaSemana}
                          onChange={(e) => updateDiaDia(dia.id, e.target.value)}
                        >
                          {DIAS.map((d) => {
                            const alreadyUsed = dias.some((x) => x.id !== dia.id && x.diaSemana === d);
                            return (
                              <option key={d} value={d} disabled={alreadyUsed} className="bg-dark-800 text-white disabled:text-dark-500">
                                {d}{alreadyUsed ? " (usado)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      {/* Descrição do dia */}
                      <input
                        className="flex-1 bg-transparent text-dark-200 text-xs focus:outline-none placeholder-dark-500 min-w-0"
                        placeholder="Descrição do dia (ex: Perna e Ombro)"
                        value={dia.descricaoDia || ""}
                        onChange={(e) => updateDiaDesc(dia.id, e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-dark-300">{dia.exercises.length} ex.</span>
                      <button onClick={() => removeDia(dia.id)} className="text-dark-300 hover:text-red-400 transition-colors"><X size={14} /></button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    {dia.exercises.map((ex, eIdx) => (
                      <div
                        key={ex.id}
                        draggable
                        onDragStart={() => handleDragStart(dia.id, eIdx)}
                        onDragOver={(e) => handleDragOver(e, dia.id, eIdx)}
                        className="bg-dark-800/60 rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing border border-transparent hover:border-dark-500 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <GripVertical size={14} className="text-dark-500 flex-shrink-0" />
                            <span className="text-xs text-dark-300 font-medium">#{eIdx + 1}</span>
                          </div>
                          {dia.exercises.length > 1 && (
                            <button onClick={() => removeExercise(dia.id, ex.id)} className="text-dark-300 hover:text-red-400 transition-colors"><X size={12} /></button>
                          )}
                        </div>
                        <input
                          className="input-field text-xs py-2"
                          placeholder="Nome do exercício (ex: Supino reto)"
                          value={ex.exercicio}
                          onChange={(e) => updateExercise(dia.id, ex.id, "exercicio", e.target.value)}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input className="input-field text-xs py-2" placeholder="Séries" value={ex.series} onChange={(e) => updateExercise(dia.id, ex.id, "series", e.target.value)} />
                          <input className="input-field text-xs py-2" placeholder="Reps" value={ex.repeticoes} onChange={(e) => updateExercise(dia.id, ex.id, "repeticoes", e.target.value)} />
                          <input className="input-field text-xs py-2" placeholder="Peso" value={ex.peso} onChange={(e) => updateExercise(dia.id, ex.id, "peso", e.target.value)} />
                        </div>
                        <input
                          className="input-field text-xs py-2"
                          placeholder="Observação (opcional)"
                          value={ex.descricao || ""}
                          onChange={(e) => updateExercise(dia.id, ex.id, "descricao", e.target.value)}
                        />
                        {/* Campo Aula */}
                        {lessons.length > 0 && (
                          <div className="relative">
                            <select
                              className="select-field text-xs py-2"
                              value={ex.aulaId || ""}
                              onChange={(e) => updateExerciseAula(dia.id, ex.id, e.target.value)}
                            >
                              <option value="">Nenhuma aula vinculada</option>
                              {lessons.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                            </select>
                            <PlayCircle size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
                          </div>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addExercise(dia.id)}
                      className="w-full py-2 border border-dashed border-dark-500 rounded-lg text-xs text-dark-300 hover:text-white hover:border-dark-300 transition-all flex items-center justify-center gap-1">
                      <Plus size={12} /> Adicionar exercício
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-dark-600 flex gap-3 sticky bottom-0 bg-dark-800">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSave} className="btn-primary flex-1">{workout ? "Salvar alterações" : "Criar treino"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---- View Workout Modal ---- */
function ViewWorkoutModal({ workout, student, onClose, onEdit }: { workout: Workout; student: Student; onClose: () => void; onEdit: () => void; }) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      if (type === "json") exportJSON(workout, student);
      else if (type === "text") exportText(workout, student);
      else if (type === "excel") await exportExcel(workout, student);
      else if (type === "docx") await exportDOCX(workout, student);
      else if (type === "whatsapp") exportWhatsApp(workout, student);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar");
    }
    setExporting(null);
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="modal-content bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div>
            <h2 className="font-display text-lg font-bold text-white">{student.nome}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${NIVEL_BADGE[workout.nivel]}`}>{workout.nivel}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${OBJETIVO_BADGE[workout.objetivo] || "bg-dark-600 text-dark-100"}`}>{workout.objetivo}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"><Edit2 size={13} /> Editar</button>
            <button onClick={onClose} className="text-dark-200 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Export buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { type: "excel", label: "Excel", icon: FileSpreadsheet, color: "text-green-400" },
              { type: "json", label: "JSON", icon: FileJson, color: "text-blue-400" },
              { type: "text", label: "Texto", icon: FileText, color: "text-yellow-400" },
              { type: "docx", label: "DOCX", icon: FileType2, color: "text-purple-400" },
              { type: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500" },
            ].map(({ type, label, icon: Icon, color }) => (
              <button key={type} onClick={() => handleExport(type)} disabled={exporting !== null}
                className="bg-dark-700 hover:bg-dark-600 border border-dark-500 rounded-lg py-2.5 flex flex-col items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-50">
                {exporting === type ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Icon size={18} className={color} />}
                <span className="text-dark-100">{label}</span>
              </button>
            ))}
          </div>

          {/* Workout days */}
          {workout.dias.map((dia) => (
            <div key={dia.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-display font-bold text-brand-400 uppercase text-sm">{dia.diaSemana}</span>
                {dia.descricaoDia && <span className="text-dark-300 text-xs">— {dia.descricaoDia}</span>}
                <div className="flex-1 h-px bg-dark-600" />
                <span className="text-xs text-dark-300">{dia.exercises.length} exerc.</span>
              </div>
              <div className="space-y-2">
                {dia.exercises.map((ex) => (
                  <div key={ex.id} className="bg-dark-700/60 rounded-lg px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-white">{ex.exercicio || "Sem nome"}</p>
                        {ex.descricao && <p className="text-xs text-dark-300 mt-0.5 italic">{ex.descricao}</p>}
                        {ex.aulaUrl && (
                          <a href={ex.aulaUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                            <PlayCircle size={12} /> {ex.aulaNome || "Ver aula"}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-dark-200 flex-shrink-0 ml-3">
                        <span className="bg-dark-600 px-2 py-0.5 rounded">{ex.series}×{ex.repeticoes}</span>
                        {ex.peso && <span className="bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded">{ex.peso}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Main Page ---- */
export default function WorkoutsPage() {
  const { user, loading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [viewing, setViewing] = useState<Workout | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (user) {
      const [loadedStudents, loadedWorkouts, lessonsRes] = await Promise.all([
        getStudents(user.id),
        getWorkouts(user.id),
        fetch(`/api/lessons?userId=${user.id}`).then((r) => r.json()),
      ]);
      setStudents(loadedStudents);
      setWorkouts(loadedWorkouts);
      setLessons(lessonsRes);
    }
  };

  useEffect(() => { load(); }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  const filtered = workouts.filter((w) => {
    const student = students.find((s) => s.id === w.studentId);
    return !search || student?.nome.toLowerCase().includes(search.toLowerCase()) || w.objetivo.toLowerCase().includes(search.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este treino?")) { await deleteWorkout(id); await load(); }
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Treinos</h1>
            <p className="text-dark-200 text-sm mt-1">{workouts.length} ficha{workouts.length !== 1 ? "s" : ""} criada{workouts.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} disabled={students.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={16} /> Criar treino
          </button>
        </div>

        {students.length === 0 && (
          <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 mb-6 text-sm text-brand-400">
            Cadastre pelo menos um aluno antes de criar treinos.
          </div>
        )}

        <div className="relative mb-6">
          <input className="input-field pl-4" placeholder="Buscar por aluno ou objetivo..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ClipboardList size={48} className="text-dark-400 mb-4" />
            <p className="text-white font-medium">{search ? "Nenhum treino encontrado" : "Nenhum treino criado"}</p>
            <p className="text-dark-300 text-sm mt-1">
              {search ? "Tente outra busca" : students.length > 0 ? 'Clique em "Criar treino" para começar' : "Cadastre um aluno primeiro"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((workout) => {
              const student = students.find((s) => s.id === workout.studentId);
              const totalExercises = workout.dias.reduce((a, d) => a + d.exercises.length, 0);
              return (
                <div key={workout.id} className="card p-5 hover:border-dark-500 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center font-bold text-brand-400 flex-shrink-0">
                        {student?.nome?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-white text-sm">{student?.nome || "Aluno removido"}</p>
                        <p className="text-xs text-dark-300">{new Date(workout.createdAt).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setViewing(workout)} className="w-8 h-8 rounded-lg bg-dark-600 hover:bg-dark-500 flex items-center justify-center text-dark-200 hover:text-white transition-all"><Eye size={13} /></button>
                      <button onClick={() => { setEditing(workout); setModalOpen(true); }} className="w-8 h-8 rounded-lg bg-dark-600 hover:bg-dark-500 flex items-center justify-center text-dark-200 hover:text-white transition-all"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(workout.id)} className="w-8 h-8 rounded-lg bg-dark-600 hover:bg-red-500/10 flex items-center justify-center text-dark-200 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${NIVEL_BADGE[workout.nivel]}`}>{workout.nivel}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${OBJETIVO_BADGE[workout.objetivo] || "bg-dark-600 text-dark-100"}`}>{workout.objetivo}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-dark-700/60 rounded-lg py-2">
                      <p className="text-lg font-bold text-white font-display">{workout.dias.length}</p>
                      <p className="text-xs text-dark-300">dias</p>
                    </div>
                    <div className="bg-dark-700/60 rounded-lg py-2">
                      <p className="text-lg font-bold text-white font-display">{totalExercises}</p>
                      <p className="text-xs text-dark-300">exercícios</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {modalOpen && (
        <WorkoutModal students={students} lessons={lessons} userId={user!.id} workout={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }} onSave={load} />
      )}

      {viewing && (() => {
        const student = students.find((s) => s.id === viewing.studentId);
        return student ? (
          <ViewWorkoutModal workout={viewing} student={student} onClose={() => setViewing(null)}
            onEdit={() => { setEditing(viewing); setViewing(null); setModalOpen(true); }} />
        ) : null;
      })()}
    </div>
  );
}
