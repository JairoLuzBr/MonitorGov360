import {
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FileText,
  Camera,
  Calendar,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { ChartCard, BarChart, LineChart } from "./chart-card";

const programasExecucao = [
  { name: "Bolsa Família", value: 92 },
  { name: "Merenda Escolar", value: 87 },
  { name: "UBS Reforma", value: 45 },
  { name: "Pavimentação", value: 68 },
  { name: "Iluminação", value: 81 },
];

const evidenciasSemana = [
  { name: "Seg", fotos: 12, docs: 5 },
  { name: "Ter", fotos: 18, docs: 8 },
  { name: "Qua", fotos: 15, docs: 4 },
  { name: "Qui", fotos: 22, docs: 11 },
  { name: "Sex", fotos: 19, docs: 7 },
];

export function PainelSecretario() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel da Secretaria</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Acompanhamento das ações sob responsabilidade da sua pasta
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label="Ações da Pasta"
          value="42"
          description="8 em fase crítica"
          icon={FolderOpen}
          variant="info"
        />
        <KpiCard
          label="Questionários da Semana"
          value="14"
          description="6 pendentes de resposta"
          icon={Calendar}
          variant="warning"
        />
        <KpiCard
          label="Evidências Coletadas"
          value="128"
          description="Esta semana"
          icon={Camera}
          variant="success"
          trend={{ value: 23, label: "vs semana ant." }}
        />
        <KpiCard
          label="Pendências"
          value="11"
          description="Aguardando providências"
          icon={AlertCircle}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Execução por Programa"
          subtitle="Percentual atual de cada programa"
          icon={BarChart3}
        >
          <BarChart data={programasExecucao} color="#C8941A" />
        </ChartCard>

        <ChartCard
          title="Evidências da Semana"
          subtitle="Fotos e documentos enviados"
          icon={Camera}
        >
          <LineChart
            data={evidenciasSemana}
            lines={[
              { dataKey: "fotos", color: "#1E3A5F", label: "Fotos" },
              { dataKey: "docs", color: "#C8941A", label: "Documentos" },
            ]}
          />
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-amber-500" />
            Próximas Ações
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { acao: "Responder questionário UBS Jardim Esperança", prazo: "Hoje", urgencia: "alta" },
            { acao: "Anexar evidência da Obra Av. Central", prazo: "Amanhã", urgencia: "media" },
            { acao: "Atualizar status do Programa Cesta Básica", prazo: "2 dias", urgencia: "baixa" },
            { acao: "Validar relatório mensal", prazo: "5 dias", urgencia: "baixa" },
          ].map((item) => (
            <div key={item.acao} className="px-6 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{item.acao}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  item.urgencia === "alta"
                    ? "bg-red-100 text-red-700"
                    : item.urgencia === "media"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {item.prazo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
