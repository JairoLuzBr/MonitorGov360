"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  FolderOpen,
  Loader2,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AcaoComIndicadores,
  type AcaoListagem,
  type NivelRisco,
  type StatusAcao,
  NIVEL_RISCO_LABELS,
  STATUS_ACAO_LABELS,
  TIPO_ACAO_LABELS,
} from "@/lib/acoes/types";
import { listarSubAcoes } from "@/lib/acoes/queries";

interface AcoesTabelaProps {
  acoes: AcaoListagem[];
}

const STATUS_CLASSES: Record<StatusAcao, string> = {
  planejada:     "bg-gray-100 text-gray-700 border-gray-200",
  em_licitacao:  "bg-blue-50 text-blue-700 border-blue-200",
  em_execucao:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  paralisada:    "bg-amber-50 text-amber-800 border-amber-200",
  concluida:     "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelada:     "bg-red-50 text-red-700 border-red-200",
};

const RISCO_CLASSES: Record<NivelRisco, string> = {
  baixo:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  medio:   "bg-amber-50 text-amber-700 border-amber-200",
  alto:    "bg-orange-50 text-orange-700 border-orange-200",
  critico: "bg-red-50 text-red-700 border-red-200",
};

function formatPct(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return `${Number(valor).toFixed(1)}%`;
}

function formatIE(valor: number | null | undefined): { texto: string; classe: string } {
  if (valor == null) return { texto: "—", classe: "text-gray-400" };
  const num = Number(valor);
  let classe = "text-gray-700";
  if (num >= 1) classe = "text-emerald-700 font-semibold";
  else if (num >= 0.8) classe = "text-amber-700";
  else classe = "text-red-700";
  return { texto: num.toFixed(2), classe };
}

export function AcoesTabela({ acoes }: AcoesTabelaProps) {
  // Estado das macros expandidas e cache das sub-ações carregadas.
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [subAcoesPorMacro, setSubAcoesPorMacro] = useState<
    Record<string, AcaoComIndicadores[]>
  >({});
  const [carregandoIds, setCarregandoIds] = useState<Set<string>>(new Set());

  async function alternarExpansao(macroId: string) {
    setExpandidas((prev) => {
      const novo = new Set(prev);
      if (novo.has(macroId)) {
        novo.delete(macroId);
      } else {
        novo.add(macroId);
      }
      return novo;
    });

    // Carrega sub-ações sob demanda (lazy)
    if (!subAcoesPorMacro[macroId] && !carregandoIds.has(macroId)) {
      setCarregandoIds((p) => new Set(p).add(macroId));
      try {
        const subs = await listarSubAcoes(macroId);
        setSubAcoesPorMacro((p) => ({ ...p, [macroId]: subs }));
      } catch (e) {
        console.error("Falha ao carregar sub-ações:", e);
      } finally {
        setCarregandoIds((p) => {
          const novo = new Set(p);
          novo.delete(macroId);
          return novo;
        });
      }
    }
  }

  if (acoes.length === 0) {
    return (
      <div className="p-12 text-center">
        <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-gray-700">
          Nenhuma ação encontrada
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Ajuste os filtros ou cadastre a primeira ação governamental do município.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="w-8 px-2 py-3"></th>
            <th className="text-left font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
              Ação
            </th>
            <th className="text-left font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
              Órgão
            </th>
            <th className="text-left font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
              Função
            </th>
            <th className="text-center font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
              Status
            </th>
            <th className="text-right font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
              % Físico
            </th>
            <th className="text-right font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
              % Financ.
            </th>
            <th className="text-right font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
              IE
            </th>
            <th className="text-center font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
              Risco
            </th>
            <th className="px-2 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {acoes.map((acao) => {
            const aberta = expandidas.has(acao.id);
            const subs = subAcoesPorMacro[acao.id];
            const carregando = carregandoIds.has(acao.id);
            return (
              <ContextoMacro key={acao.id}>
                <LinhaAcao
                  acao={acao}
                  expandida={aberta}
                  carregandoSubs={carregando}
                  onToggleExpansao={() => alternarExpansao(acao.id)}
                />

                {/* Linhas das sub-ações quando expandido */}
                {aberta && carregando && (
                  <tr>
                    <td colSpan={10} className="bg-gray-50/30 px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Carregando sub-ações...
                      </span>
                    </td>
                  </tr>
                )}
                {aberta && !carregando && subs && subs.length === 0 && (
                  <tr>
                    <td colSpan={10} className="bg-gray-50/30 px-4 py-3 pl-12">
                      <span className="text-xs text-gray-500 italic">
                        Nenhuma sub-ação cadastrada para esta macro.
                      </span>
                    </td>
                  </tr>
                )}
                {aberta && subs && subs.length > 0 && (
                  <>
                    {subs.map((sub) => (
                      <LinhaSubAcao key={sub.id} sub={sub} />
                    ))}
                  </>
                )}
              </ContextoMacro>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Linha de uma ação macro
// =============================================================================

function LinhaAcao({
  acao,
  expandida,
  carregandoSubs,
  onToggleExpansao,
}: {
  acao: AcaoListagem;
  expandida: boolean;
  carregandoSubs: boolean;
  onToggleExpansao: () => void;
}) {
  const ie = formatIE(acao.indicador_eficiencia);
  return (
    <tr
      className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors"
    >
      <td className="w-8 px-2 py-3 text-center align-top pt-4">
        <button
          type="button"
          onClick={onToggleExpansao}
          className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50"
          aria-label={expandida ? "Recolher sub-ações" : "Expandir sub-ações"}
        >
          {carregandoSubs ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : expandida ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </td>
      <td className="px-4 py-3 max-w-xs">
        <Link
          href={`/dashboard/acoes/${acao.id}`}
          className="font-medium text-gray-900 hover:text-primary-700 line-clamp-1"
        >
          {acao.titulo}
        </Link>
        <div className="text-xs text-gray-500 mt-0.5">
          {TIPO_ACAO_LABELS[acao.tipo]}
          {acao.localizacao_bairro && (
            <span className="inline-flex items-center gap-0.5 ml-2">
              <MapPin className="h-3 w-3" />
              {acao.localizacao_bairro}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-700">
        {acao.orgao?.sigla ?? acao.orgao?.nome ?? "—"}
      </td>
      <td className="px-4 py-3 text-gray-700">
        {acao.funcao_codigo ? (
          <span>
            <span className="text-xs text-gray-400">{acao.funcao_codigo}</span>{" "}
            {acao.funcao_nome}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
            STATUS_CLASSES[acao.status]
          )}
        >
          {STATUS_ACAO_LABELS[acao.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
        {formatPct(acao.percentual_fisico)}
      </td>
      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
        {formatPct(acao.percentual_financeiro)}
      </td>
      <td className={cn("px-4 py-3 text-right tabular-nums", ie.classe)}>
        <span className="inline-flex items-center gap-1">
          {acao.indicador_eficiencia != null && (
            <TrendingUp className="h-3 w-3" />
          )}
          {ie.texto}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
            RISCO_CLASSES[acao.nivel_risco]
          )}
        >
          {NIVEL_RISCO_LABELS[acao.nivel_risco]}
        </span>
      </td>
      <td className="px-2 py-3">
        <Link
          href={`/dashboard/acoes/${acao.id}`}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50"
          aria-label="Ver detalhes"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

// =============================================================================
// Linha de uma sub-ação (compacta, indentada)
// =============================================================================

function LinhaSubAcao({ sub }: { sub: AcaoComIndicadores }) {
  return (
    <tr className="border-b border-gray-50 bg-gray-50/30 hover:bg-gray-50/60 transition-colors">
      <td className="w-8 px-2 py-2"></td>
      <td className="px-4 py-2 pl-8 max-w-xs">
        <div className="flex items-start gap-1.5">
          <CornerDownRight className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <Link
              href={`/dashboard/acoes/${sub.id}`}
              className="font-medium text-sm text-gray-800 hover:text-primary-700 line-clamp-1"
            >
              {sub.titulo}
            </Link>
            <div className="text-xs text-gray-500 mt-0.5">
              {TIPO_ACAO_LABELS[sub.tipo]}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2 text-xs text-gray-500" colSpan={2}>
        Sub-ação
      </td>
      <td className="px-4 py-2 text-center">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
            STATUS_CLASSES[sub.status]
          )}
        >
          {STATUS_ACAO_LABELS[sub.status]}
        </span>
      </td>
      <td className="px-4 py-2 text-right text-gray-700 tabular-nums text-xs">
        {formatPct(sub.percentual_fisico)}
      </td>
      <td className="px-4 py-2 text-right text-gray-700 tabular-nums text-xs">
        {formatPct(sub.percentual_financeiro)}
      </td>
      <td className="px-4 py-2 text-right text-gray-400 text-xs">—</td>
      <td className="px-4 py-2 text-center">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
            RISCO_CLASSES[sub.nivel_risco]
          )}
        >
          {NIVEL_RISCO_LABELS[sub.nivel_risco]}
        </span>
      </td>
      <td className="px-2 py-2">
        <Link
          href={`/dashboard/acoes/${sub.id}`}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50"
          aria-label="Ver detalhes da sub-ação"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

// Fragment wrapper que permite agrupar várias <tr> sob uma mesma key.
function ContextoMacro({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
