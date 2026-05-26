import {
  FolderOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  DollarSign,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { ChartCard, BarChart, PieChart, LineChart } from "./chart-card";

const execucaoSecretarias = [
  { name: "Saúde", value: 87 },
  { name: "Educação", value: 73 },
  { name: "Obras", value: 65 },
  { name: "Assist. Social", value: 58 },
  { name: "Cultura", value: 42 },
  { name: "Esporte", value: 38 },
];

const distribuicaoStatus = [
  { name: "Concluídas", value: 134, color: "#16a34a" },
  { name: "Em Execução", value: 89, color: "#1E3A5F" },
  { name: "Paralisadas", value: 18, color: "#d97706" },
  { name: "Atrasadas", value: 6, color: "#dc2626" },
];

const evolucaoMensal = [
  { name: "Jan", planejado: 24, executado: 18 },
  { name: "Fev", planejado: 28, executado: 25 },
  { name: "Mar", planejado: 32, executado: 30 },
  { name: "Abr", planejado: 36, executado: 31 },
  { name: "Mai", planejado: 40, executado: 38 },
];

export function PainelPrefeito() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Executivo</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Visão estratégica da execução de governo do município
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label="Total de Ações"
          value="247"
          description="Cadastradas no sistema"
          icon={FolderOpen}
          variant="info"
          trend={{ value: 12, label: "vs mês anterior" }}
        />
        <KpiCard
          label="Em Execução"
          value="89"
          description="36% do total"
          icon={TrendingUp}
          variant="success"
        />
        <KpiCard
          label="Alertas Críticos"
          value="6"
          description="Requerem ação imediata"
          icon={AlertTriangle}
          variant="danger"
        />
        <KpiCard
          label="Execução Financeira"
          value="R$ 18,2M"
          description="73% do orçamento previsto"
          icon={DollarSign}
          variant="warning"
          trend={{ value: 8, label: "no trimestre" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Execução por Secretaria"
            subtitle="Percentual de ações concluídas vs planejadas"
            icon={BarChart3}
          >
            <BarChart data={execucaoSecretarias} color="#1E3A5F" />
          </ChartCard>
        </div>

        <ChartCard
          title="Status das Ações"
          subtitle="Distribuição atual"
          icon={PieIcon}
        >
          <PieChart data={distribuicaoStatus} />
        </ChartCard>
      </div>

      <ChartCard
        title="Evolução Mensal"
        subtitle="Ações planejadas vs executadas em 2026"
        icon={Activity}
      >
        <LineChart
          data={evolucaoMensal}
          lines={[
            { dataKey: "planejado", color: "#94a3b8", label: "Planejado" },
            { dataKey: "executado", color: "#1E3A5F", label: "Executado" },
          ]}
        />
      </ChartCard>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary-500" />
            Ranking de Secretarias
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {execucaoSecretarias.map((sec, idx) => (
            <div key={sec.name} className="px-6 py-3 flex items-center gap-4">
              <span className="text-xs font-bold text-gray-400 w-6">#{idx + 1}</span>
              <span className="flex-1 text-sm font-medium text-gray-700">{sec.name}</span>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${sec.value}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-800 w-12 text-right tabular-nums">
                {sec.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
