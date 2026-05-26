"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  Info,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALERTAS_MOCK,
  SEVERIDADE_CONFIG,
  STATUS_ALERTA_LABELS,
  TIPO_ALERTA_LABELS,
  type Severidade,
  type StatusAlerta,
} from "@/lib/alertas/mock";
import { KpiCard } from "@/components/dashboard/kpi-card";

type FiltroSeveridade = "todos" | Severidade | "resolvidos";
type FiltroStatus = "todos" | StatusAlerta;

const ICONES_SEVERIDADE: Record<Severidade, LucideIcon> = {
  critico: AlertTriangle,
  atencao: Clock,
  info: Info,
};

const BADGE_STATUS: Record<StatusAlerta, string> = {
  aberto: "bg-red-50 text-red-700 border-red-200",
  em_andamento: "bg-blue-50 text-blue-700 border-blue-200",
  resolvido: "bg-emerald-50 text-emerald-700 border-emerald-200",
  descartado: "bg-gray-100 text-gray-600 border-gray-200",
};

function tempoDecorrido(data: Date): string {
  const ms = Date.now() - new Date(data).getTime();
  const horas = Math.floor(ms / (1000 * 60 * 60));
  if (horas < 1) return "agora há pouco";
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "há 1 dia";
  return `há ${dias} dias`;
}

export default function AlertasPage() {
  const [filtroSev, setFiltroSev] = useState<FiltroSeveridade>("todos");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [busca, setBusca] = useState("");

  const alertasFiltrados = useMemo(() => {
    return ALERTAS_MOCK.filter((a) => {
      if (filtroSev === "resolvidos") {
        if (a.status !== "resolvido") return false;
      } else if (filtroSev !== "todos") {
        if (a.severidade !== filtroSev) return false;
      }
      if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
      if (busca) {
        const termo = busca.toLowerCase();
        const matchTitulo = a.titulo.toLowerCase().includes(termo);
        const matchAcao = a.acaoVinculada.titulo.toLowerCase().includes(termo);
        if (!matchTitulo && !matchAcao) return false;
      }
      return true;
    });
  }, [filtroSev, filtroStatus, busca]);

  const kpis = useMemo(() => {
    const criticos = ALERTAS_MOCK.filter(
      (a) => a.severidade === "critico" && a.status !== "resolvido" && a.status !== "descartado"
    ).length;
    const emAndamento = ALERTAS_MOCK.filter((a) => a.status === "em_andamento").length;
    const limiteMes = new Date();
    limiteMes.setDate(limiteMes.getDate() - 30);
    const resolvidosMes = ALERTAS_MOCK.filter(
      (a) => a.status === "resolvido" && a.criadoEm.getTime() >= limiteMes.getTime()
    ).length;
    const totalAberto = ALERTAS_MOCK.filter(
      (a) => a.status === "aberto" || a.status === "em_andamento"
    ).length;
    return { criticos, emAndamento, resolvidosMes, totalAberto };
  }, []);

  const contadoresSev = useMemo(
    () => ({
      todos: ALERTAS_MOCK.length,
      critico: ALERTAS_MOCK.filter((a) => a.severidade === "critico").length,
      atencao: ALERTAS_MOCK.filter((a) => a.severidade === "atencao").length,
      info: ALERTAS_MOCK.filter((a) => a.severidade === "info").length,
      resolvidos: ALERTAS_MOCK.filter((a) => a.status === "resolvido").length,
    }),
    []
  );

  const filtrosSeveridade: { key: FiltroSeveridade; label: string; count: number }[] = [
    { key: "todos", label: "Todos", count: contadoresSev.todos },
    { key: "critico", label: "Críticos", count: contadoresSev.critico },
    { key: "atencao", label: "Atenção", count: contadoresSev.atencao },
    { key: "info", label: "Info", count: contadoresSev.info },
    { key: "resolvidos", label: "Resolvidos", count: contadoresSev.resolvidos },
  ];

  const filtrosStatus: { key: FiltroStatus; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "aberto", label: "Abertos" },
    { key: "em_andamento", label: "Em andamento" },
    { key: "resolvido", label: "Resolvidos" },
    { key: "descartado", label: "Descartados" },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary-600" />
          Alertas
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Detecção automática de divergências, atrasos e omissões nas ações governamentais
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Críticos"
          value={kpis.criticos}
          description="Aguardando atendimento"
          icon={AlertTriangle}
          variant="danger"
        />
        <KpiCard
          label="Em andamento"
          value={kpis.emAndamento}
          description="Em tratamento agora"
          icon={Clock}
          variant="warning"
        />
        <KpiCard
          label="Resolvidos no mês"
          value={kpis.resolvidosMes}
          description="Últimos 30 dias"
          icon={CheckCircle2}
          variant="success"
        />
        <KpiCard
          label="Total aberto"
          value={kpis.totalAberto}
          description="Aberto + Em andamento"
          icon={Bell}
          variant="info"
        />
      </div>

      {/* Filtros por severidade */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filtrosSeveridade.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltroSev(f.key)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap",
              filtroSev === f.key
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
            <span
              className={cn(
                "text-xs font-semibold px-1.5 rounded-full min-w-[1.5rem] text-center",
                filtroSev === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros por status */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Status:
        </span>
        {filtrosStatus.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltroStatus(f.key)}
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
              filtroStatus === f.key
                ? "bg-secondary-500 text-white border-secondary-500"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Busca + Lista */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por título do alerta ou ação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-lg"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {alertasFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-700">
              Nenhum alerta encontrado
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Tente ajustar os filtros ou limpar a busca para visualizar mais resultados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alertasFiltrados.map((alerta) => {
              const sevCfg = SEVERIDADE_CONFIG[alerta.severidade];
              const Icone = ICONES_SEVERIDADE[alerta.severidade];
              return (
                <Link
                  key={alerta.id}
                  href={`/dashboard/alertas/${alerta.id}`}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                      sevCfg.iconClasses
                    )}
                  >
                    <Icone className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full border",
                          sevCfg.badge
                        )}
                      >
                        {sevCfg.label}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full border",
                          BADGE_STATUS[alerta.status]
                        )}
                      >
                        {STATUS_ALERTA_LABELS[alerta.status]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {TIPO_ALERTA_LABELS[alerta.tipo]}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {alerta.titulo}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="truncate">
                        Ação: <strong className="text-gray-700">{alerta.acaoVinculada.titulo}</strong>
                      </span>
                      <span>•</span>
                      <span>{tempoDecorrido(alerta.criadoEm)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {alerta.providencias.length}{" "}
                        {alerta.providencias.length === 1 ? "providência" : "providências"}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
