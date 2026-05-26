import {
  ShieldAlert,
  FileX,
  FileWarning,
  Activity,
  AlertTriangle,
  BarChart3,
  Search,
  Lock,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { ChartCard, BarChart, PieChart } from "./chart-card";

const tipoInconsistencias = [
  { name: "Sem evidência", value: 23 },
  { name: "Divergência físico-financeira", value: 18 },
  { name: "Prazo vencido", value: 14 },
  { name: "Documentação incompleta", value: 11 },
  { name: "Alteração sensível", value: 7 },
];

const distribuicaoRisco = [
  { name: "Baixo", value: 156, color: "#16a34a" },
  { name: "Médio", value: 47, color: "#d97706" },
  { name: "Alto", value: 18, color: "#dc2626" },
  { name: "Crítico", value: 6, color: "#7c1d6f" },
];

export function PainelControleInterno() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-red-600" />
          Painel de Controle Interno
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Auditoria, inconsistências e divergências detectadas no sistema
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label="Inconsistências"
          value="73"
          description="Detectadas automaticamente"
          icon={AlertTriangle}
          variant="danger"
        />
        <KpiCard
          label="Ações sem Evidência"
          value="23"
          description="Mais de 30 dias"
          icon={FileX}
          variant="warning"
        />
        <KpiCard
          label="Divergência Físico-Financeira"
          value="18"
          description="Requer investigação"
          icon={FileWarning}
          variant="danger"
        />
        <KpiCard
          label="Alterações Sensíveis"
          value="42"
          description="Últimos 30 dias"
          icon={Activity}
          variant="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Tipos de Inconsistências"
            subtitle="Distribuição por categoria"
            icon={BarChart3}
          >
            <BarChart data={tipoInconsistencias} color="#dc2626" />
          </ChartCard>
        </div>

        <ChartCard
          title="Distribuição por Risco"
          subtitle="Ações classificadas"
          icon={ShieldAlert}
        >
          <PieChart data={distribuicaoRisco} />
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-red-500" />
            Trilha de Auditoria Recente
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <Search className="h-3.5 w-3.5" />
            Ver tudo
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            {
              acao: "Alteração no valor da Obra Av. Central",
              user: "Carlos M. (Eng. Civil)",
              tempo: "há 12 min",
              tipo: "ALTERADO",
            },
            {
              acao: "Evidência removida de Pavimentação Norte",
              user: "Joana S. (Fiscal)",
              tempo: "há 1h",
              tipo: "REMOVIDO",
            },
            {
              acao: "Status mudou para 'Concluída' - UBS",
              user: "Roberto F. (Secretário)",
              tempo: "há 3h",
              tipo: "STATUS",
            },
            {
              acao: "Acesso fora do horário - prefeito@municipio",
              user: "Sistema",
              tempo: "há 5h",
              tipo: "ACESSO",
            },
          ].map((item, i) => (
            <div key={i} className="px-6 py-3 flex items-center gap-4">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  item.tipo === "ALTERADO"
                    ? "bg-amber-100 text-amber-700"
                    : item.tipo === "REMOVIDO"
                      ? "bg-red-100 text-red-700"
                      : item.tipo === "ACESSO"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                }`}
              >
                {item.tipo}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{item.acao}</p>
                <p className="text-xs text-gray-500">{item.user}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{item.tempo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
