"use client";

import { CheckCircle2, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NIVEL_RISCO_LABELS,
  STATUS_ACAO_LABELS,
  type AcaoListagem,
} from "@/lib/acoes/types";

interface AcaoResumoCardsProps {
  acao: AcaoListagem;
}

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatIE(valor: number | null): { texto: string; classe: string; descricao: string } {
  if (valor == null) {
    return {
      texto: "—",
      classe: "text-gray-500",
      descricao: "Sem valor pago ainda",
    };
  }
  const num = Number(valor);
  if (num >= 1) {
    return {
      texto: num.toFixed(2),
      classe: "text-emerald-600",
      descricao: "Eficiente — entrega mais do que paga",
    };
  }
  if (num >= 0.8) {
    return {
      texto: num.toFixed(2),
      classe: "text-amber-600",
      descricao: "Próximo do equilíbrio",
    };
  }
  return {
    texto: num.toFixed(2),
    classe: "text-red-600",
    descricao: "Atenção — paga mais do que entrega",
  };
}

export function AcaoResumoCards({ acao }: AcaoResumoCardsProps) {
  const ie = formatIE(acao.indicador_eficiencia);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Status + risco */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Status
          </div>
          <CheckCircle2 className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {STATUS_ACAO_LABELS[acao.status]}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Risco: <span className="font-medium">{NIVEL_RISCO_LABELS[acao.nivel_risco]}</span>
        </div>
      </div>

      {/* Execução física */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Execução
          </div>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-gray-900 tabular-nums">
          {Number(acao.percentual_fisico).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Financeira: <span className="font-medium tabular-nums">{Number(acao.percentual_financeiro).toFixed(1)}%</span>
        </div>
      </div>

      {/* Indicador de eficiência */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Indicador de eficiência
          </div>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </div>
        <div className={cn("text-2xl font-bold tabular-nums", ie.classe)}>
          {ie.texto}
        </div>
        <div className="text-xs text-gray-500 mt-2">{ie.descricao}</div>
      </div>

      {/* Orçamento */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Orçamento
          </div>
          <Wallet className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-gray-900 tabular-nums">
          {formatBRL(Number(acao.valor_pago))}
        </div>
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          de {formatBRL(Number(acao.valor_atualizado))}
        </div>
      </div>
    </div>
  );
}
