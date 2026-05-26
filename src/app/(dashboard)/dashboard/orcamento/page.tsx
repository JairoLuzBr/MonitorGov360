"use client";

import {
  Activity,
  PieChart as PieIcon,
  Upload,
  Wallet,
  AlertTriangle,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { CardsExecucao } from "@/components/orcamento/cards-execucao";
import { TabelaEmpenhos } from "@/components/orcamento/tabela-empenhos";
import {
  ChartCard,
  LineChart,
  PieChart,
} from "@/components/dashboard/chart-card";
import { DOTACOES_MOCK, EVOLUCAO_MOCK, formatBRL } from "@/lib/orcamento/mock";

interface Alerta {
  tipo: "Crítico" | "Atenção" | "Informativo";
  titulo: string;
  descricao: string;
  cor: string;
  badge: string;
  icone: typeof AlertTriangle;
  iconeCor: string;
}

const ALERTAS_ORCAMENTARIOS: Alerta[] = [
  {
    tipo: "Crítico",
    titulo: "Empenho sem liquidação há 60 dias",
    descricao:
      "Empenho 2026NE00098 (Construtora Horizonte) — Pavimentação Av. Central sem liquidação adicional desde 28/03",
    cor: "border-red-400 bg-red-50",
    badge: "bg-red-100 text-red-700",
    icone: AlertTriangle,
    iconeCor: "text-red-500",
  },
  {
    tipo: "Atenção",
    titulo: "Divergência físico-financeiro",
    descricao:
      "Pavimentação Av. Central — execução financeira (52%) está adiantada em relação à execução física (38%)",
    cor: "border-amber-400 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    icone: Clock,
    iconeCor: "text-amber-500",
  },
  {
    tipo: "Informativo",
    titulo: "Dotação próxima do limite",
    descricao:
      "Função Educação atingiu 81% do empenhamento da dotação anual — avalie suplementação",
    cor: "border-blue-400 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    icone: AlertCircle,
    iconeCor: "text-blue-500",
  },
];

export default function OrcamentoPage() {
  // Dados para o gráfico de Evolução Mensal
  const evolucaoData = EVOLUCAO_MOCK.map((e) => ({
    name: e.mes,
    Empenhado: e.empenhado,
    Liquidado: e.liquidado,
    Pago: e.pago,
  }));

  // Dados para o gráfico Pizza (Execução por Função)
  // Agrupa dotações por função, somando valor empenhado
  const porFuncaoMap = new Map<string, number>();
  for (const d of DOTACOES_MOCK) {
    porFuncaoMap.set(
      d.funcao,
      (porFuncaoMap.get(d.funcao) ?? 0) + d.valorEmpenhado
    );
  }
  const execucaoPorFuncao = Array.from(porFuncaoMap.entries()).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary-600" />
            Execução Orçamentária
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Acompanhe a execução das dotações: empenho, liquidação e pagamento
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Upload className="h-4 w-4" />
          Importar LOA
        </button>
      </div>

      {/* KPIs */}
      <CardsExecucao />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Evolução Mensal"
          subtitle="Acumulado por etapa (Jan a Jun/2026)"
          icon={Activity}
        >
          <LineChart
            data={evolucaoData}
            lines={[
              { dataKey: "Empenhado", color: "#C8941A", label: "Empenhado" },
              { dataKey: "Liquidado", color: "#1E3A5F", label: "Liquidado" },
              { dataKey: "Pago",      color: "#16a34a", label: "Pago" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Execução por Função"
          subtitle="Distribuição do empenhado por função orçamentária"
          icon={PieIcon}
        >
          <PieChart data={execucaoPorFuncao} />
        </ChartCard>
      </div>

      {/* Tabela e Alertas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabela de Empenhos */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary-500" />
                Empenhos Recentes
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ordenados por data de emissão
              </p>
            </div>
          </div>
          <TabelaEmpenhos limit={10} />
        </div>

        {/* Alertas Orçamentários */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertas Orçamentários
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Inconsistências e pontos de atenção
            </p>
          </div>
          <div className="p-4 space-y-3">
            {ALERTAS_ORCAMENTARIOS.map((alerta) => {
              const Icone = alerta.icone;
              return (
                <div
                  key={alerta.titulo}
                  className={`border-l-4 rounded-r-lg p-3 flex items-start gap-3 ${alerta.cor}`}
                >
                  <Icone
                    className={`h-4 w-4 mt-0.5 shrink-0 ${alerta.iconeCor}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${alerta.badge}`}
                      >
                        {alerta.tipo}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-xs leading-tight">
                      {alerta.titulo}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 leading-snug">
                      {alerta.descricao}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rodapé com dotação total resumo */}
      <div className="text-xs text-gray-400 text-center pt-2">
        Dados consolidados em {new Date().toLocaleDateString("pt-BR")} •
        Dotação total autorizada:{" "}
        <span className="font-semibold text-gray-600">
          {formatBRL(
            DOTACOES_MOCK.reduce((acc, d) => acc + d.valorDotacao, 0)
          )}
        </span>
      </div>
    </div>
  );
}
