"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Info,
  Calendar,
  Tag,
  Link2,
  Shield,
  ChevronUp,
  Play,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
  Paperclip,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import {
  ALERTAS_MOCK,
  ESCALONAMENTO_LABELS,
  SEVERIDADE_CONFIG,
  STATUS_ALERTA_LABELS,
  TIPO_ALERTA_LABELS,
  type Alerta,
  type Providencia,
  type Severidade,
  type StatusAlerta,
} from "@/lib/alertas/mock";

const ICONES_SEVERIDADE: Record<Severidade, LucideIcon> = {
  critico: AlertTriangle,
  atencao: Clock,
  info: Info,
};

const GRADIENTE_HEADER: Record<Severidade, string> = {
  critico: "from-red-700 to-red-500",
  atencao: "from-amber-700 to-amber-500",
  info: "from-blue-700 to-blue-500",
};

const BADGE_STATUS: Record<StatusAlerta, string> = {
  aberto: "bg-red-50 text-red-700 border-red-200",
  em_andamento: "bg-blue-50 text-blue-700 border-blue-200",
  resolvido: "bg-emerald-50 text-emerald-700 border-emerald-200",
  descartado: "bg-gray-100 text-gray-600 border-gray-200",
};

function novoId(): string {
  return `p_${Math.random().toString(36).slice(2, 9)}`;
}

export default function AlertaDetalhePage() {
  const params = useParams<{ id: string }>();
  const alertaOriginal = useMemo<Alerta | undefined>(
    () => ALERTAS_MOCK.find((a) => a.id === params.id),
    [params.id]
  );

  const [status, setStatus] = useState<StatusAlerta>(
    alertaOriginal?.status ?? "aberto"
  );
  const [providencias, setProvidencias] = useState<Providencia[]>(
    alertaOriginal?.providencias ?? []
  );
  const [novaDescricao, setNovaDescricao] = useState("");

  if (!alertaOriginal) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/alertas"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para alertas
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-700">Alerta não encontrado</h2>
          <p className="text-sm text-gray-500 mt-1">
            O alerta solicitado não existe ou já foi removido.
          </p>
        </div>
      </div>
    );
  }

  const sevCfg = SEVERIDADE_CONFIG[alertaOriginal.severidade];
  const IconeSev = ICONES_SEVERIDADE[alertaOriginal.severidade];

  function handleIniciar() {
    setStatus("em_andamento");
  }

  function handleResolver() {
    setStatus("resolvido");
  }

  function handleDescartar() {
    setStatus("descartado");
  }

  function handleAdicionarProvidencia() {
    const descricao = novaDescricao.trim();
    if (!descricao) return;
    const nova: Providencia = {
      id: novoId(),
      autor: "Você (usuário atual)",
      data: new Date(),
      descricao,
    };
    setProvidencias((atual) => [...atual, nova]);
    setNovaDescricao("");
  }

  const podeIniciar = status === "aberto";
  const podeResolver = status === "aberto" || status === "em_andamento";
  const podeDescartar = status === "aberto" || status === "em_andamento";
  const finalizado = status === "resolvido" || status === "descartado";

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/dashboard/alertas"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para alertas
      </Link>

      {/* Header com gradiente */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          className={cn(
            "bg-gradient-to-r px-6 py-5 text-white",
            GRADIENTE_HEADER[alertaOriginal.severidade]
          )}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
              <IconeSev className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                  {sevCfg.label}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    BADGE_STATUS[status]
                  )}
                >
                  {STATUS_ALERTA_LABELS[status]}
                </span>
                <span className="text-xs text-white/80">
                  {TIPO_ALERTA_LABELS[alertaOriginal.tipo]}
                </span>
              </div>
              <h1 className="text-xl font-bold leading-snug">{alertaOriginal.titulo}</h1>
              <p className="text-sm text-white/80 mt-1">{alertaOriginal.descricao}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card de informações */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary-600" />
          Informações do alerta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Tipo</p>
              <p className="font-medium text-gray-800">
                {TIPO_ALERTA_LABELS[alertaOriginal.tipo]}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Link2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Ação vinculada</p>
              <p className="font-medium text-gray-800">{alertaOriginal.acaoVinculada.titulo}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <Sparkles className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Regra que disparou</p>
              <p className="font-medium text-gray-800">{alertaOriginal.regraDispara}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ChevronUp className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Escalonamento atual</p>
              <p className="font-medium text-gray-800">
                {ESCALONAMENTO_LABELS[alertaOriginal.escalonamento]}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Severidade</p>
              <p className="font-medium text-gray-800">{sevCfg.label}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Criado em</p>
              <p className="font-medium text-gray-800">
                {formatDateTime(alertaOriginal.criadoEm)}
              </p>
            </div>
          </div>
          {alertaOriginal.prazoResolucao && (
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Prazo de resolução</p>
                <p className="font-medium text-gray-800">
                  {formatDateTime(alertaOriginal.prazoResolucao)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card de Ações */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Play className="h-4 w-4 text-primary-600" />
          Ações
        </h2>
        {finalizado ? (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              status === "resolvido"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}
          >
            Este alerta foi marcado como{" "}
            <strong>{STATUS_ALERTA_LABELS[status].toLowerCase()}</strong>. Nenhuma ação adicional
            disponível.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleIniciar}
              disabled={!podeIniciar}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors",
                podeIniciar
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Play className="h-4 w-4" />
              Iniciar atendimento
            </button>
            <button
              type="button"
              onClick={handleResolver}
              disabled={!podeResolver}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors",
                podeResolver
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar como resolvido
            </button>
            <button
              type="button"
              onClick={handleDescartar}
              disabled={!podeDescartar}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border",
                podeDescartar
                  ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              )}
            >
              <XCircle className="h-4 w-4" />
              Descartar alerta
            </button>
          </div>
        )}
      </div>

      {/* Timeline de providências */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-600" />
          Timeline de Providências
          <span className="text-xs font-medium text-gray-500">
            ({providencias.length})
          </span>
        </h2>

        {providencias.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">
              Nenhuma providência registrada
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Comece a documentar as ações tomadas: cada providência fortalece a rastreabilidade e
              acelera a resolução do alerta.
            </p>
          </div>
        ) : (
          <ol className="relative border-l-2 border-gray-100 ml-3 space-y-6">
            {providencias.map((p) => (
              <li key={p.id} className="ml-6">
                <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-primary-500 border-2 border-white shadow" />
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{p.autor}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(p.data)}</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{p.descricao}</p>
                  {p.anexos && p.anexos.length > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary-700 bg-primary-50 border border-primary-100 px-2 py-1 rounded-md">
                      <Paperclip className="h-3 w-3" />
                      {p.anexos.length}{" "}
                      {p.anexos.length === 1 ? "anexo" : "anexos"}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Adicionar providência */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <label
            htmlFor="nova-providencia"
            className="text-sm font-semibold text-gray-800 mb-2 block"
          >
            Adicionar providência
          </label>
          <textarea
            id="nova-providencia"
            value={novaDescricao}
            onChange={(e) => setNovaDescricao(e.target.value)}
            rows={3}
            placeholder="Descreva a ação tomada, decisão registrada ou comunicação enviada..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleAdicionarProvidencia}
              disabled={!novaDescricao.trim()}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors",
                novaDescricao.trim()
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
              Registrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
