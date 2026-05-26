"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUESTIONARIOS_MOCK,
  TIPOS_ACAO_LABELS,
  type QuestionarioCiclo,
} from "@/lib/questionarios/schema";

type FiltroStatus = "todos" | "pendente" | "em_andamento" | "respondido" | "atrasado";

const STATUS_CONFIG: Record<
  QuestionarioCiclo["status"],
  { label: string; classes: string; icon: typeof Clock }
> = {
  pendente: {
    label: "Pendente",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  em_andamento: {
    label: "Em andamento",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
    icon: ClipboardList,
  },
  respondido: {
    label: "Respondido",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  atrasado: {
    label: "Atrasado",
    classes: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  },
};

function diasAteoVencimento(prazo: Date): { texto: string; urgente: boolean } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(prazo);
  fim.setHours(0, 0, 0, 0);
  const diffMs = fim.getTime() - hoje.getTime();
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (dias < 0) return { texto: `${Math.abs(dias)} dias em atraso`, urgente: true };
  if (dias === 0) return { texto: "Vence hoje", urgente: true };
  if (dias === 1) return { texto: "Vence amanhã", urgente: true };
  if (dias <= 3) return { texto: `${dias} dias`, urgente: true };
  return { texto: `${dias} dias`, urgente: false };
}

export default function QuestionariosPage() {
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const [busca, setBusca] = useState("");

  const questionariosFiltrados = QUESTIONARIOS_MOCK.filter((q) => {
    if (filtro !== "todos" && q.status !== filtro) return false;
    if (busca && !q.acaoTitulo.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const contadores = {
    todos: QUESTIONARIOS_MOCK.length,
    pendente: QUESTIONARIOS_MOCK.filter((q) => q.status === "pendente").length,
    em_andamento: QUESTIONARIOS_MOCK.filter((q) => q.status === "em_andamento").length,
    atrasado: QUESTIONARIOS_MOCK.filter((q) => q.status === "atrasado").length,
    respondido: QUESTIONARIOS_MOCK.filter((q) => q.status === "respondido").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary-600" />
          Questionários
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Responda os questionários cíclicos das ações sob sua responsabilidade
        </p>
      </div>

      {/* Filtros por status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(
          [
            { key: "todos", label: "Todos", count: contadores.todos },
            { key: "atrasado", label: "Atrasados", count: contadores.atrasado },
            { key: "pendente", label: "Pendentes", count: contadores.pendente },
            { key: "em_andamento", label: "Em andamento", count: contadores.em_andamento },
            { key: "respondido", label: "Respondidos", count: contadores.respondido },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key as FiltroStatus)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap",
              filtro === f.key
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
            <span
              className={cn(
                "text-xs font-semibold px-1.5 rounded-full min-w-[1.5rem] text-center",
                filtro === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por ação..."
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

        {/* Lista */}
        {questionariosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum questionário encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {questionariosFiltrados.map((q) => {
              const statusCfg = STATUS_CONFIG[q.status];
              const StatusIcon = statusCfg.icon;
              const prazo = diasAteoVencimento(q.prazoFim);
              return (
                <Link
                  key={q.id}
                  href={`/dashboard/questionarios/${q.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                      statusCfg.classes
                    )}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full border",
                          statusCfg.classes
                        )}
                      >
                        {statusCfg.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {TIPOS_ACAO_LABELS[q.tipoAcao]}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 truncate">{q.acaoTitulo}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {q.ciclo}
                      </span>
                      <span>•</span>
                      <span>{q.responsavel}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        prazo.urgente ? "text-red-600" : "text-gray-500"
                      )}
                    >
                      {prazo.texto}
                    </span>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
