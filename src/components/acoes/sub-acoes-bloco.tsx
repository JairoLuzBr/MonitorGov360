"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  CornerDownRight,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listarSubAcoes } from "@/lib/acoes/queries";
import {
  STATUS_ACAO_LABELS,
  type AcaoComIndicadores,
  type StatusAcao,
} from "@/lib/acoes/types";

interface SubAcoesBlocoProps {
  macroId: string;
}

const STATUS_CLASSES: Record<StatusAcao, string> = {
  planejada:     "bg-gray-100 text-gray-700 border-gray-200",
  em_licitacao:  "bg-blue-50 text-blue-700 border-blue-200",
  em_execucao:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  paralisada:    "bg-amber-50 text-amber-800 border-amber-200",
  concluida:     "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelada:     "bg-red-50 text-red-700 border-red-200",
};

export function SubAcoesBloco({ macroId }: SubAcoesBlocoProps) {
  const [subs, setSubs] = useState<AcaoComIndicadores[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarSubAcoes(macroId)
      .then((s) => {
        if (!cancelado) setSubs(s);
      })
      .catch((e) => !cancelado && setErro((e as Error).message));
    return () => {
      cancelado = true;
    };
  }, [macroId]);

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <header className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CornerDownRight className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">
            Sub-ações
            {subs && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({subs.length})
              </span>
            )}
          </h3>
        </div>
        <Link
          href={`/dashboard/acoes/nova?pai=${macroId}`}
          className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova sub-ação
        </Link>
      </header>

      {subs === null && !erro && (
        <div className="p-6 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando sub-ações...
        </div>
      )}

      {erro && (
        <div className="p-6 text-sm text-red-600">{erro}</div>
      )}

      {subs && subs.length === 0 && (
        <div className="p-8 text-center">
          <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">
            Sem sub-ações ainda
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Quebre essa ação macro em etapas operacionais menores. Sub-ações herdam o
            contexto orçamentário da macro.
          </p>
          <Link
            href={`/dashboard/acoes/nova?pai=${macroId}`}
            className="inline-flex items-center gap-1.5 mt-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Criar primeira sub-ação
          </Link>
        </div>
      )}

      {subs && subs.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {subs.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/acoes/${s.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {s.titulo}
                  </div>
                  {s.descricao && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {s.descricao}
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium shrink-0",
                    STATUS_CLASSES[s.status]
                  )}
                >
                  {STATUS_ACAO_LABELS[s.status]}
                </span>
                <div className="text-xs text-gray-500 tabular-nums shrink-0 hidden sm:block">
                  Fís: {Number(s.percentual_fisico).toFixed(0)}% · Fin:{" "}
                  {Number(s.percentual_financeiro).toFixed(0)}%
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
