"use client";

import { useMemo, useState } from "react";
import {
  History,
  Activity,
  BarChart3,
  Search,
  Download,
  ShieldAlert,
  Edit3,
  LogIn,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  ChartCard,
  LineChart,
  BarChart,
} from "@/components/dashboard/chart-card";
import {
  EVENTOS_MOCK,
  EVOLUCAO_AUDITORIA_MOCK,
  TIPO_EVENTO_LABELS,
  TIPO_EVENTO_CONFIG,
  SEVERIDADE_LABELS,
  SEVERIDADE_CONFIG,
  ENTIDADE_LABELS,
  type TipoEventoAuditoria,
  type SeveridadeEvento,
  type EntidadeTipo,
} from "@/lib/auditoria/mock";

type FiltroTipo = "todos" | TipoEventoAuditoria;
type FiltroSeveridade = "todos" | SeveridadeEvento;
type FiltroEntidade = "todos" | EntidadeTipo;
type FiltroData = "hoje" | "7dias" | "30dias" | "tudo";

const FILTROS_TIPO: { key: FiltroTipo; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "CRIADO", label: "Criado" },
  { key: "ALTERADO", label: "Alterado" },
  { key: "REMOVIDO", label: "Removido" },
  { key: "ACESSO", label: "Acesso" },
  { key: "EXPORTACAO", label: "Exportação" },
  { key: "PERMISSAO", label: "Permissão" },
  { key: "CONFIGURACAO", label: "Configuração" },
];

const FILTROS_SEVERIDADE: { key: FiltroSeveridade; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "critico", label: "Crítico" },
  { key: "atencao", label: "Atenção" },
  { key: "info", label: "Info" },
];

const FILTROS_ENTIDADE: { key: FiltroEntidade; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "acao", label: "Ação" },
  { key: "evidencia", label: "Evidência" },
  { key: "usuario", label: "Usuário" },
  { key: "questionario", label: "Questionário" },
  { key: "contrato", label: "Contrato" },
  { key: "orcamento", label: "Orçamento" },
  { key: "sistema", label: "Sistema" },
];

const FILTROS_DATA: { key: FiltroData; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "7dias", label: "Últimos 7 dias" },
  { key: "30dias", label: "Últimos 30 dias" },
  { key: "tudo", label: "Tudo" },
];

const PAGE_SIZE = 50;

function formatarTimestamp(d: Date): string {
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes} ${hora}:${min}`;
}

function formatarTimestampCompleto(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(d);
}

function dentroDoIntervalo(data: Date, filtro: FiltroData): boolean {
  const agora = Date.now();
  const diffMs = agora - data.getTime();
  const dia = 1000 * 60 * 60 * 24;
  switch (filtro) {
    case "hoje":
      return diffMs <= dia;
    case "7dias":
      return diffMs <= 7 * dia;
    case "30dias":
      return diffMs <= 30 * dia;
    case "tudo":
    default:
      return true;
  }
}

export default function AuditoriaPage() {
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroSeveridade, setFiltroSeveridade] =
    useState<FiltroSeveridade>("todos");
  const [filtroEntidade, setFiltroEntidade] = useState<FiltroEntidade>("todos");
  const [filtroData, setFiltroData] = useState<FiltroData>("tudo");
  const [busca, setBusca] = useState<string>("");
  const [limite, setLimite] = useState<number>(PAGE_SIZE);

  // ============== KPIs ==============
  const kpis = useMemo(() => {
    const trintaDiasAtras = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const eventosUltimoMes = EVENTOS_MOCK.filter(
      (e) => e.ocorreuEm.getTime() >= trintaDiasAtras
    );
    const criticos = EVENTOS_MOCK.filter((e) => e.severidade === "critico");
    const alteracoesSensiveis = EVENTOS_MOCK.filter(
      (e) =>
        e.tipo === "ALTERADO" &&
        (e.severidade === "critico" || e.severidade === "atencao")
    );
    const acessosAnomalos = EVENTOS_MOCK.filter(
      (e) =>
        e.tipo === "ACESSO" &&
        (e.severidade === "critico" || e.severidade === "atencao")
    );
    return {
      total: eventosUltimoMes.length,
      criticos: criticos.length,
      alteracoes: alteracoesSensiveis.length,
      acessos: acessosAnomalos.length,
    };
  }, []);

  // ============== GRÁFICOS ==============
  const dadosEvolucao = useMemo(
    () =>
      EVOLUCAO_AUDITORIA_MOCK.map((e) => ({
        name: e.dia,
        eventos: e.eventos,
      })),
    []
  );

  const dadosPorTipo = useMemo(() => {
    const map = new Map<TipoEventoAuditoria, number>();
    for (const ev of EVENTOS_MOCK) {
      map.set(ev.tipo, (map.get(ev.tipo) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([tipo, value]) => ({
      name: TIPO_EVENTO_LABELS[tipo],
      value,
    }));
  }, []);

  // ============== EVENTOS FILTRADOS ==============
  const eventosFiltrados = useMemo(() => {
    const buscaLower = busca.toLowerCase().trim();
    return EVENTOS_MOCK.filter((ev) => {
      if (filtroTipo !== "todos" && ev.tipo !== filtroTipo) return false;
      if (filtroSeveridade !== "todos" && ev.severidade !== filtroSeveridade)
        return false;
      if (filtroEntidade !== "todos" && ev.entidade.tipo !== filtroEntidade)
        return false;
      if (!dentroDoIntervalo(ev.ocorreuEm, filtroData)) return false;
      if (buscaLower) {
        const inAtor = ev.ator.nome.toLowerCase().includes(buscaLower);
        const inDesc = ev.descricao.toLowerCase().includes(buscaLower);
        if (!inAtor && !inDesc) return false;
      }
      return true;
    }).sort((a, b) => b.ocorreuEm.getTime() - a.ocorreuEm.getTime());
  }, [filtroTipo, filtroSeveridade, filtroEntidade, filtroData, busca]);

  const eventosVisiveis = eventosFiltrados.slice(0, limite);
  const temMais = eventosFiltrados.length > limite;

  function resetarLimite() {
    setLimite(PAGE_SIZE);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-6 w-6 text-primary-600" />
            Trilha de Auditoria
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Acompanhe todos os eventos auditáveis: criações, alterações,
            acessos, exportações e mudanças de permissão
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 transition-colors shrink-0"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de eventos (mês)"
          value={kpis.total}
          description="Eventos nos últimos 30 dias"
          icon={Activity}
          variant="info"
        />
        <KpiCard
          label="Eventos críticos"
          value={kpis.criticos}
          description="Severidade crítica registrada"
          icon={ShieldAlert}
          variant="danger"
        />
        <KpiCard
          label="Alterações sensíveis"
          value={kpis.alteracoes}
          description="Mudanças de valor, prazo ou status"
          icon={Edit3}
          variant="warning"
        />
        <KpiCard
          label="Acessos anômalos"
          value={kpis.acessos}
          description="Logins fora do padrão ou falhas"
          icon={LogIn}
          variant="danger"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Eventos por Dia"
          subtitle="Últimos 14 dias"
          icon={Activity}
        >
          <LineChart
            data={dadosEvolucao}
            lines={[{ dataKey: "eventos", color: "#1E3A5F", label: "Eventos" }]}
          />
        </ChartCard>
        <ChartCard
          title="Distribuição por Tipo"
          subtitle="Total de eventos por categoria"
          icon={BarChart3}
        >
          <BarChart data={dadosPorTipo} color="#C8941A" />
        </ChartCard>
      </div>

      {/* Filtros por tipo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {FILTROS_TIPO.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFiltroTipo(f.key);
              resetarLimite();
            }}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap",
              filtroTipo === f.key
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtros secundários + busca */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por ator ou descrição..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                resetarLimite();
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-500 mr-1">
                Severidade:
              </label>
              <select
                value={filtroSeveridade}
                onChange={(e) => {
                  setFiltroSeveridade(e.target.value as FiltroSeveridade);
                  resetarLimite();
                }}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
              >
                {FILTROS_SEVERIDADE.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-500 mr-1">
                Entidade:
              </label>
              <select
                value={filtroEntidade}
                onChange={(e) => {
                  setFiltroEntidade(e.target.value as FiltroEntidade);
                  resetarLimite();
                }}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
              >
                {FILTROS_ENTIDADE.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-500 mr-1">
                Período:
              </label>
              <select
                value={filtroData}
                onChange={(e) => {
                  setFiltroData(e.target.value as FiltroData);
                  resetarLimite();
                }}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
              >
                {FILTROS_DATA.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de eventos */}
        {eventosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-700">
              Nenhum evento encontrado
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Ajuste os filtros para visualizar eventos da trilha de auditoria.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left">
                    <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      Tipo
                    </th>
                    <th className="px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      Severidade
                    </th>
                    <th className="px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      Descrição
                    </th>
                    <th className="px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      Ator
                    </th>
                    <th className="px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      Entidade
                    </th>
                    <th className="px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      Origem
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                      Quando
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eventosVisiveis.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border",
                            TIPO_EVENTO_CONFIG[ev.tipo].badge
                          )}
                        >
                          {TIPO_EVENTO_LABELS[ev.tipo]}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border",
                            SEVERIDADE_CONFIG[ev.severidade].badge
                          )}
                        >
                          {SEVERIDADE_LABELS[ev.severidade]}
                        </span>
                      </td>
                      <td className="px-3 py-3 max-w-md">
                        <p className="text-sm text-gray-800 truncate" title={ev.descricao}>
                          {ev.descricao}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {ev.ator.nome}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {ev.ator.perfil}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="min-w-0 max-w-[14rem]">
                          <p className="text-xs font-medium text-gray-500">
                            {ENTIDADE_LABELS[ev.entidade.tipo]}
                          </p>
                          <p
                            className="text-sm text-gray-800 truncate"
                            title={ev.entidade.titulo}
                          >
                            {ev.entidade.titulo}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-xs font-mono text-gray-700">{ev.ip}</p>
                        <p className="text-[11px] font-mono text-gray-400">
                          {ev.userAgentResumido}
                        </p>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <span
                          className="text-xs font-medium text-gray-600 tabular-nums"
                          title={formatarTimestampCompleto(ev.ocorreuEm)}
                        >
                          {formatarTimestamp(ev.ocorreuEm)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé com contagem + carregar mais */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Mostrando{" "}
                <span className="font-semibold text-gray-700">
                  {eventosVisiveis.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-gray-700">
                  {eventosFiltrados.length}
                </span>{" "}
                eventos
              </p>
              {temMais && (
                <button
                  type="button"
                  onClick={() => setLimite((l) => l + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 transition-colors"
                >
                  Carregar mais
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
