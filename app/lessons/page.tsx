"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Lesson } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import { Plus, X, PlaySquare, Edit2, Trash2, ExternalLink, Youtube } from "lucide-react";

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface LessonModalProps {
  lesson?: Lesson | null;
  userId: string;
  onClose: () => void;
  onSave: () => Promise<void>;
}

function LessonModal({ lesson, userId, onClose, onSave }: LessonModalProps) {
  const [nome, setNome] = useState(lesson?.nome || "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Nome obrigatório";
    if (!videoUrl.trim()) e.videoUrl = "Link do vídeo obrigatório";
    else if (!videoUrl.includes("youtube") && !videoUrl.includes("youtu.be")) {
      e.videoUrl = "Use um link do YouTube (youtube.com ou youtu.be)";
    }
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);

    if (lesson) {
      await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), videoUrl: videoUrl.trim() }),
      });
    } else {
      await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, nome: nome.trim(), videoUrl: videoUrl.trim() }),
      });
    }

    await onSave();
    onClose();
  };

  const ytId = getYoutubeId(videoUrl);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <h2 className="font-display text-lg font-bold text-white">
            {lesson ? "Editar Aula" : "Nova Aula"}
          </h2>
          <button onClick={onClose} className="text-dark-200 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">
              Nome da Aula
            </label>
            <input
              className={`input-field ${errors.nome ? "border-red-500" : ""}`}
              placeholder="Ex: Aquecimento para perna"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setErrors((prev) => { const n = {...prev}; delete n.nome; return n; }); }}
            />
            {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">
              Link do YouTube
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Youtube size={16} className="text-red-400" />
              </div>
              <input
                className={`input-field pl-9 ${errors.videoUrl ? "border-red-500" : ""}`}
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => { setVideoUrl(e.target.value); setErrors((prev) => { const n = {...prev}; delete n.videoUrl; return n; }); }}
              />
            </div>
            {errors.videoUrl && <p className="text-red-400 text-xs mt-1">{errors.videoUrl}</p>}
          </div>

          {/* Preview do thumbnail */}
          {ytId && (
            <div className="rounded-xl overflow-hidden border border-dark-600">
              <img
                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt="Preview"
                className="w-full h-40 object-cover"
              />
              <div className="px-3 py-2 bg-dark-700 flex items-center gap-2 text-xs text-dark-300">
                <Youtube size={12} className="text-red-400" />
                Prévia do vídeo
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-dark-600 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
            {lesson ? "Salvar" : "Criar Aula"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LessonsPage() {
  const { user, loading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);

  const load = async () => {
    if (user) {
      const res = await fetch(`/api/lessons?userId=${user.id}`);
      const data = await res.json();
      setLessons(data);
    }
  };

  useEffect(() => { load(); }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta aula?")) return;
    await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Aulas</h1>
            <p className="text-dark-200 text-sm mt-1">
              {lessons.length} aula{lessons.length !== 1 ? "s" : ""} criada{lessons.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Nova Aula
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <PlaySquare size={48} className="text-dark-400 mb-4" />
            <p className="text-white font-medium">Nenhuma aula criada</p>
            <p className="text-dark-300 text-sm mt-1">
              Crie aulas em vídeo para vincular aos exercícios dos seus alunos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => {
              const ytId = getYoutubeId(lesson.videoUrl);
              return (
                <div key={lesson.id} className="card overflow-hidden hover:border-dark-500 transition-colors group">
                  {/* Thumbnail */}
                  <div className="relative bg-dark-700 h-40 overflow-hidden">
                    {ytId ? (
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt={lesson.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Youtube size={32} className="text-dark-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <p className="text-white font-display font-semibold text-sm truncate">{lesson.nome}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 flex items-center justify-between">
                    <a
                      href={lesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-brand-400 transition-colors"
                    >
                      <ExternalLink size={12} /> Ver vídeo
                    </a>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditing(lesson); setModalOpen(true); }}
                        className="w-7 h-7 rounded-lg bg-dark-600 hover:bg-dark-500 flex items-center justify-center text-dark-200 hover:text-white transition-all"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="w-7 h-7 rounded-lg bg-dark-600 hover:bg-red-500/10 flex items-center justify-center text-dark-200 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {modalOpen && (
        <LessonModal
          lesson={editing}
          userId={user!.id}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={load}
        />
      )}
    </div>
  );
}
