import type { Metadata } from "next";
import {
  BarChart3,
  FolderOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Dados fictícios — serão substituídos por dados reais do Supabase
const stats = [
  {
    label: "Total de Ações",
    value: "247",
    icon: FolderOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
    descricao: "Cadastradas no sistema",
  },
  {
    label: "Em Execução",
    value: "89",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
    descricao: "36% do total",
  },
  {
    label: "Alertas Ativos",
    value: "12",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    descricao: "3 críticos",
  },
  {
    label: "Concluídas",
    value: "134",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    descricao: "54% do total",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Visão geral das ações governamentais do município
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{stat.descricao}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seções principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ações recentes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary-500" />
              Ações Recentes
            </h2>
            <a
              href="/dashboard/acoes"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
            >
              Ver todas
            </a>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                {
                  titulo: "Pavimentação Av. Central",
                  tipo: "Obra Pública",
                  status: "Em Execução",
                  percentual: 65,
                  statusColor: "text-green-600 bg-green-50",
                },
                {
                  titulo: "Programa Bolsa Família Municipal",
                  tipo: "Programa Social",
                  status: "Em Execução",
                  percentual: 80,
                  statusColor: "text-green-600 bg-green-50",
                },
                {
                  titulo: "Reforma UBS Jardim Esperança",
                  tipo: "Ação Saúde",
                  status: "Paralisada",
                  percentual: 40,
                  statusColor: "text-amber-600 bg-amber-50",
                },
                {
                  titulo: "Aquisição de Merenda Escolar",
                  tipo: "Aquisição de Bens",
                  status: "Concluída",
                  percentual: 100,
                  statusColor: "text-emerald-600 bg-emerald-50",
                },
              ].map((acao) => (
                <div
                  key={acao.titulo}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {acao.titulo}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{acao.tipo}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${acao.percentual}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {acao.percentual}%
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${acao.statusColor}`}
                    >
                      {acao.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertas recentes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertas
            </h2>
            <a
              href="/dashboard/alertas"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
            >
              Ver todos
            </a>
          </div>
          <div className="p-4 space-y-3">
            {[
              {
                titulo: "Prazo vencendo",
                desc: "Reforma UBS — 3 dias",
                cor: "border-red-400 bg-red-50",
                icone: <Clock className="h-3.5 w-3.5 text-red-500" />,
              },
              {
                titulo: "Atraso no cronograma",
                desc: "Pavimentação Bairro Norte",
                cor: "border-amber-400 bg-amber-50",
                icone: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
              },
              {
                titulo: "Documentação pendente",
                desc: "Contrato 2024/089",
                cor: "border-blue-400 bg-blue-50",
                icone: <AlertTriangle className="h-3.5 w-3.5 text-blue-500" />,
              },
            ].map((alerta) => (
              <div
                key={alerta.titulo}
                className={`border-l-4 rounded-r-lg p-3 ${alerta.cor}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {alerta.icone}
                  <span className="text-xs font-semibold text-gray-700">
                    {alerta.titulo}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{alerta.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
