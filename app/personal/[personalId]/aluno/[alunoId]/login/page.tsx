"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Dumbbell, Eye, EyeOff, Lock } from "lucide-react";

export default function AlunoLoginPage() {
  const router = useRouter();
  const params = useParams();
  const personalId = params.personalId as string;
  const alunoId = params.alunoId as string;

  const [nomeAluno, setNomeAluno] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingName, setLoadingName] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Carregar nome do aluno para exibir na tela
    fetch(`/api/personal/${personalId}/aluno/${alunoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.nome) setNomeAluno(data.nome);
        else setError("Link inválido ou aluno não encontrado.");
      })
      .catch(() => setError("Erro ao carregar dados. Verifique o link."))
      .finally(() => setLoadingName(false));
  }, [personalId, alunoId]);

  const handleLogin = async () => {
    if (!senha.trim()) {
      setError("Por favor, digite sua senha 🔑");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/personal/${personalId}/aluno/${alunoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Ops! Algo deu errado 😅");
        setLoading(false);
        return;
      }

      // Salvar sessão do aluno
      sessionStorage.setItem(
        "aluno_session",
        JSON.stringify({ ...data.student, personalId })
      );

      router.push(`/personal/${personalId}/aluno/${alunoId}/treinos`);
    } catch {
      setError("Erro de conexão. Tente novamente!");
      setLoading(false);
    }
  };

  if (loadingName) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!nomeAluno && !loadingName) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 text-lg font-medium">{error || "Link inválido"}</p>
          <p className="text-dark-300 text-sm mt-2">
            Solicite um novo link ao seu personal trainer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500/10 rounded-2xl border border-brand-500/20 mb-4">
            <Dumbbell className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            PT<span className="text-brand-500">Pro</span>
          </h1>
          <p className="text-dark-300 text-sm mt-1">Área do Aluno</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
          {/* Boas-vindas */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-brand-400">
                {nomeAluno[0]?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Olá, {nomeAluno.split(" ")[0]}! 👋
            </h2>
            <p className="text-dark-300 text-sm mt-1">
              Que bom ter você aqui! Digite sua senha para acessar seus treinos.
            </p>
          </div>

          {/* Campo senha */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-100 mb-1.5 uppercase tracking-wider">
                Sua Senha
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showSenha ? "text" : "password"}
                  className="input-field pl-9 pr-10"
                  placeholder="Digite sua senha..."
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-white transition-colors"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? "Entrando..." : "Acessar meus treinos 💪"}
            </button>
          </div>

          <p className="text-center text-dark-400 text-xs mt-6">
            Problemas para entrar? Fale com seu personal trainer.
          </p>
        </div>
      </div>
    </div>
  );
}
