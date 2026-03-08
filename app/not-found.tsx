import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-dark-900 border-b border-dark-600">
      <h2 className="text-xl font-bold font-display text-white">404 - Página não encontrada</h2>
      <p className="mt-2 text-dark-300">Desculpe, não conseguimos encontrar a página que você está procurando.</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
        Voltar para a home
      </Link>
    </div>
  );
}
