import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | MonitorGov360",
    default: "Autenticação | MonitorGov360",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col">
      {/* Header minimalista */}
      <header className="w-full px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 group"
          aria-label="Voltar para a página inicial"
        >
          <ShieldCheck className="h-7 w-7 text-secondary-400 group-hover:text-secondary-300 transition-colors" />
          <span className="text-white font-bold text-lg tracking-tight group-hover:text-white/90 transition-colors">
            MonitorGov<span className="text-secondary-400">360</span>
          </span>
        </Link>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-white/30 text-xs">
          &copy; {new Date().getFullYear()} MonitorGov360. Todos os direitos
          reservados.
        </p>
      </footer>
    </div>
  );
}
