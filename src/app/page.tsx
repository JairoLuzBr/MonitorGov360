import Link from "next/link";
import {
  ShieldCheck,
  BarChart3,
  FileSearch,
  Bell,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-secondary-500" />
          <span className="text-white font-bold text-xl tracking-tight">
            MonitorGov<span className="text-secondary-400">360</span>
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm text-white/80 hover:text-white transition-colors"
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-secondary-500/20 border border-secondary-500/30 rounded-full px-4 py-1.5 mb-8">
          <span className="text-secondary-400 text-sm font-medium">
            Transparência e Gestão Pública
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white max-w-4xl leading-tight mb-6">
          Monitor
          <span className="text-secondary-400">Gov</span>
          <span className="text-white">360</span>
        </h1>

        <p className="text-xl md:text-2xl text-white/70 max-w-2xl mb-4 font-light">
          Do planejamento à entrega real
        </p>

        <p className="text-base text-white/50 max-w-xl mb-12 leading-relaxed">
          Plataforma integrada de monitoramento de ações governamentais
          municipais. Acompanhe obras, programas sociais, ações de saúde e
          educação com transparência e eficiência.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-secondary-500/25 hover:scale-[1.02] text-base"
          >
            Acessar Plataforma
            <ChevronRight className="h-5 w-5" />
          </Link>
          <a
            href="#funcionalidades"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            Conheça as funcionalidades
          </a>
        </div>
      </section>

      {/* Features */}
      <section
        id="funcionalidades"
        className="w-full max-w-7xl mx-auto px-6 py-20"
      >
        <h2 className="text-center text-2xl font-semibold text-white/80 mb-12">
          Principais Funcionalidades
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6 text-secondary-400" />}
            title="Dashboard em Tempo Real"
            description="Acompanhe o andamento de todas as ações governamentais com indicadores e gráficos atualizados em tempo real."
          />
          <FeatureCard
            icon={<FileSearch className="h-6 w-6 text-secondary-400" />}
            title="Gestão de Ações"
            description="Cadastre e monitore obras públicas, programas sociais, ações de saúde, educação e muito mais."
          />
          <FeatureCard
            icon={<Bell className="h-6 w-6 text-secondary-400" />}
            title="Alertas e Notificações"
            description="Receba alertas automáticos sobre prazos críticos, atrasos e pendências que necessitam de atenção."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6 text-secondary-400" />}
            title="Controle de Acesso"
            description="Perfis hierárquicos com controle granular de permissões para diferentes níveis da gestão municipal."
          />
          <FeatureCard
            icon={<FileSearch className="h-6 w-6 text-secondary-400" />}
            title="Evidências Fotográficas"
            description="Registre o progresso das ações com fotos georreferenciadas e documentos comprobatórios."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6 text-secondary-400" />}
            title="Relatórios e Transparência"
            description="Gere relatórios detalhados para prestação de contas e portal da transparência."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-secondary-500" />
            <span className="text-white/60 text-sm">
              MonitorGov360 &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-white/40 text-xs text-center">
            Plataforma para gestão e transparência de ações governamentais
            municipais
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors duration-200">
      <div className="w-12 h-12 bg-primary-800/60 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
