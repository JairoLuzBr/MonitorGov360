import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Camera,
  FolderOpen,
  Activity,
  Upload,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { ChartCard, BarChart } from "./chart-card";

const minhasAcoes = [
  { name: "Concluídas", value: 18 },
  { name: "Em Execução", value: 7 },
  { name: "Pendentes", value: 4 },
];

export function PainelFiscal() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Painel</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Suas tarefas, questionários pendentes e ações sob sua responsabilidade
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label="Questionários Pendentes"
          value="6"
          description="2 com prazo crítico"
          icon={ClipboardList}
          variant="warning"
        />
        <KpiCard
          label="Ações Sob Responsabilidade"
          value="11"
          description="3 em andamento"
          icon={FolderOpen}
          variant="info"
        />
        <KpiCard
          label="Evidências Enviadas"
          value="34"
          description="Neste mês"
          icon={Camera}
          variant="success"
          trend={{ value: 15, label: "vs mês ant." }}
        />
        <KpiCard
          label="Concluídas"
          value="18"
          description="No mês"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4 text-amber-500" />
              Questionários Pendentes
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              {
                titulo: "Reforma UBS Jardim Esperança",
                tipo: "Quinzenal",
                prazo: "Hoje",
                urgencia: "alta",
              },
              {
                titulo: "Pavimentação Av. Central",
                tipo: "Semanal",
                prazo: "Amanhã",
                urgencia: "alta",
              },
              {
                titulo: "Programa Bolsa Família Municipal",
                tipo: "Mensal",
                prazo: "3 dias",
                urgencia: "media",
              },
              {
                titulo: "Aquisição de Merenda Escolar",
                tipo: "Semanal",
                prazo: "5 dias",
                urgencia: "baixa",
              },
              {
                titulo: "Capacitação de Servidores",
                tipo: "Mensal",
                prazo: "1 semana",
                urgencia: "baixa",
              },
            ].map((q) => (
              <div
                key={q.titulo}
                className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{q.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{q.tipo}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                    q.urgencia === "alta"
                      ? "bg-red-100 text-red-700"
                      : q.urgencia === "media"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {q.prazo}
                </span>
              </div>
            ))}
          </div>
        </div>

        <ChartCard
          title="Minhas Ações"
          subtitle="Status atual"
          icon={Activity}
        >
          <BarChart data={minhasAcoes} color="#1E3A5F" />
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary-500" />
            Atividade Recente
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Nova Evidência
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { acao: "Anexou foto na Pavimentação Av. Central", tempo: "há 30 min", tipo: "evidencia" },
            { acao: "Respondeu questionário UBS Jardim", tempo: "há 2h", tipo: "questionario" },
            { acao: "Atualizou status para 'Concluída'", tempo: "ontem", tipo: "status" },
            { acao: "Adicionou observação no laudo técnico", tempo: "há 2 dias", tipo: "obs" },
          ].map((item, i) => (
            <div key={i} className="px-6 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
              <p className="flex-1 text-sm text-gray-700 truncate">{item.acao}</p>
              <span className="text-xs text-gray-400 shrink-0">{item.tempo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
