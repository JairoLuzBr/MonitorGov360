"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  CornerDownRight,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AcaoForm } from "@/components/acoes/acao-form";
import { AcaoResumoCards } from "@/components/acoes/acao-resumo-cards";
import { SubAcoesBloco } from "@/components/acoes/sub-acoes-bloco";
import { atualizarAcao, buscarAcao, excluirAcao } from "@/lib/acoes/queries";
import type { AcaoListagem } from "@/lib/acoes/types";
import {
  STATUS_ACAO_LABELS,
  TIPO_ACAO_LABELS,
} from "@/lib/acoes/types";
import type { AcaoCreateInput } from "@/lib/acoes/schema";

export default function DetalheAcaoPage() {
  const params = useParams<{ id: string }>();
  const acaoId = params?.id;
  const router = useRouter();

  const [acao, setAcao] = useState<AcaoListagem | null>(null);
  const [pai, setPai] = useState<AcaoListagem | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    if (!acaoId) return;
    setCarregando(true);
    setErro(null);
    try {
      const dados = await buscarAcao(acaoId);
      if (!dados) {
        setErro("Ação não encontrada.");
      } else {
        setAcao(dados);
        // Se for sub-ação, busca o pai para mostrar o banner
        if (dados.acao_pai_id) {
          buscarAcao(dados.acao_pai_id)
            .then((p) => setPai(p))
            .catch(() => setPai(null));
        } else {
          setPai(null);
        }
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [acaoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSubmit(values: AcaoCreateInput) {
    if (!acaoId) return;
    try {
      await atualizarAcao(acaoId, values);
      toast.success("Ação atualizada com sucesso!");
      setEditando(false);
      await carregar();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleExcluir() {
    if (!acaoId) return;
    setExcluindo(true);
    try {
      await excluirAcao(acaoId);
      toast.success("Ação excluída.");
      router.push("/dashboard/acoes");
    } catch (e) {
      toast.error((e as Error).message);
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-3" />
        <span className="text-sm">Carregando ação...</span>
      </div>
    );
  }

  if (erro || !acao) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-gray-800">{erro ?? "Ação não disponível"}</h3>
        <Link
          href="/dashboard/acoes"
          className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm mt-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para listagem
        </Link>
      </div>
    );
  }

  // Monta defaultValues do form a partir da ação atual
  const defaultValues: Partial<AcaoCreateInput> = {
    tipo: acao.tipo,
    titulo: acao.titulo,
    descricao: acao.descricao,
    acao_pai_id: acao.acao_pai_id,
    orgao_id: acao.orgao_id,
    unidade_orcamentaria_id: acao.unidade_orcamentaria_id,
    funcao_codigo: acao.funcao_codigo,
    funcao_nome: acao.funcao_nome,
    subfuncao_codigo: acao.subfuncao_codigo,
    subfuncao_nome: acao.subfuncao_nome,
    programa_codigo: acao.programa_codigo,
    programa_nome: acao.programa_nome,
    acao_orcamentaria_codigo: acao.acao_orcamentaria_codigo,
    acao_orcamentaria_nome: acao.acao_orcamentaria_nome,
    natureza_despesa_codigo: acao.natureza_despesa_codigo,
    natureza_despesa_nome: acao.natureza_despesa_nome,
    responsavel_id: acao.responsavel_id,
    responsavel_secundario_id: acao.responsavel_secundario_id,
    status: acao.status,
    nivel_risco: acao.nivel_risco,
    percentual_fisico: Number(acao.percentual_fisico),
    percentual_financeiro: Number(acao.percentual_financeiro),
    data_inicio: acao.data_inicio,
    data_prevista_fim: acao.data_prevista_fim,
    data_real_fim: acao.data_real_fim,
    meta_quantitativa: acao.meta_quantitativa ?? null,
    unidade_meta: acao.unidade_meta,
    localizacao_bairro: acao.localizacao_bairro,
    localizacao_endereco: acao.localizacao_endereco,
    localizacao_lat: acao.localizacao_lat,
    localizacao_lng: acao.localizacao_lng,
    fonte_recurso: acao.fonte_recurso,
    valor_fixado: Number(acao.valor_fixado),
    valor_atualizado: Number(acao.valor_atualizado),
    valor_empenhado: Number(acao.valor_empenhado),
    valor_liquidado: Number(acao.valor_liquidado),
    valor_pago: Number(acao.valor_pago),
    numero_contrato: acao.numero_contrato,
    numero_licitacao: acao.numero_licitacao,
    observacoes: acao.observacoes,
    origem: acao.origem,
    origem_referencia: acao.origem_referencia,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/acoes"
            className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span>{TIPO_ACAO_LABELS[acao.tipo]}</span>
              <span>·</span>
              <span>{STATUS_ACAO_LABELS[acao.status]}</span>
              {acao.localizacao_bairro && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {acao.localizacao_bairro}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{acao.titulo}</h1>
            {acao.orgao && (
              <p className="text-sm text-gray-500 mt-0.5">
                {acao.orgao.sigla ? `${acao.orgao.sigla} — ` : ""}
                {acao.orgao.nome}
                {acao.responsavel && ` · Responsável: ${acao.responsavel.nome}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!editando ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(true)}
                className="inline-flex items-center gap-2 text-sm text-red-700 hover:text-red-800 bg-white border border-red-200 hover:bg-red-50 font-medium px-3 py-2 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-lg"
            >
              <X className="h-4 w-4" />
              Cancelar edição
            </button>
          )}
        </div>
      </div>

      {/* Banner: pertence a uma macro */}
      {acao.acao_pai_id && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-primary-800">
            <CornerDownRight className="h-4 w-4" />
            <span>
              Sub-ação de:{" "}
              {pai ? (
                <Link
                  href={`/dashboard/acoes/${pai.id}`}
                  className="font-semibold underline hover:text-primary-900"
                >
                  {pai.titulo}
                </Link>
              ) : (
                <span className="text-primary-700">carregando...</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <AcaoResumoCards acao={acao} />

      {/* Conteúdo: modo visualização ou edição */}
      {editando ? (
        <AcaoForm
          modo="editar"
          acaoId={acao.id}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        />
      ) : (
        <VisualizacaoDetalhes acao={acao} />
      )}

      {/* Sub-ações — só aparece em modo visualização e quando é uma macro */}
      {!editando && !acao.acao_pai_id && (
        <SubAcoesBloco macroId={acao.id} />
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmandoExclusao && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Excluir esta ação?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Esta operação é <strong>permanente</strong>. Sub-ações vinculadas também serão excluídas.
              Para apenas cancelar, edite e mude o status para <em>Cancelada</em>.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                disabled={excluindo}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluir}
                disabled={excluindo}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {excluindo && <Loader2 className="h-4 w-4 animate-spin" />}
                Excluir definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// VISUALIZAÇÃO somente-leitura dos dados detalhados
// =============================================================================

function VisualizacaoDetalhes({ acao }: { acao: AcaoListagem }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SecaoInfo titulo="Classificação Orçamentária">
        <Linha label="Função">
          {acao.funcao_codigo ? `${acao.funcao_codigo} — ${acao.funcao_nome ?? ""}` : "—"}
        </Linha>
        <Linha label="Subfunção">
          {acao.subfuncao_codigo
            ? `${acao.subfuncao_codigo} — ${acao.subfuncao_nome ?? ""}`
            : "—"}
        </Linha>
        <Linha label="Programa">
          {acao.programa_codigo
            ? `${acao.programa_codigo} — ${acao.programa_nome ?? ""}`
            : "—"}
        </Linha>
        <Linha label="Ação orçamentária">
          {acao.acao_orcamentaria_codigo
            ? `${acao.acao_orcamentaria_codigo} — ${acao.acao_orcamentaria_nome ?? ""}`
            : "—"}
        </Linha>
        <Linha label="Natureza despesa">
          {acao.natureza_despesa_codigo
            ? `${acao.natureza_despesa_codigo} — ${acao.natureza_despesa_nome ?? ""}`
            : "—"}
        </Linha>
        <Linha label="Fonte de recurso">{acao.fonte_recurso ?? "—"}</Linha>
      </SecaoInfo>

      <SecaoInfo titulo="Orçamento">
        <Linha label="Valor fixado">{fmtMoney(acao.valor_fixado)}</Linha>
        <Linha label="Valor atualizado">{fmtMoney(acao.valor_atualizado)}</Linha>
        <Linha label="Empenhado">{fmtMoney(acao.valor_empenhado)}</Linha>
        <Linha label="Liquidado">{fmtMoney(acao.valor_liquidado)}</Linha>
        <Linha label="Pago">{fmtMoney(acao.valor_pago)}</Linha>
        <Linha label="Saldo a empenhar">{fmtMoney(acao.saldo_a_empenhar)}</Linha>
        <Linha label="Saldo a pagar">{fmtMoney(acao.saldo_a_pagar)}</Linha>
      </SecaoInfo>

      <SecaoInfo titulo="Cronograma & Meta">
        <Linha label="Início">{acao.data_inicio ?? "—"}</Linha>
        <Linha label="Prev. fim">{acao.data_prevista_fim ?? "—"}</Linha>
        <Linha label="Fim real">{acao.data_real_fim ?? "—"}</Linha>
        <Linha label="Meta">
          {acao.meta_quantitativa != null
            ? `${acao.meta_quantitativa} ${acao.unidade_meta ?? ""}`
            : "—"}
        </Linha>
      </SecaoInfo>

      <SecaoInfo titulo="Contratual & Origem">
        <Linha label="Contrato">{acao.numero_contrato ?? "—"}</Linha>
        <Linha label="Licitação">{acao.numero_licitacao ?? "—"}</Linha>
        <Linha label="Origem">{acao.origem}</Linha>
        <Linha label="Ref. externa">{acao.origem_referencia ?? "—"}</Linha>
      </SecaoInfo>

      {acao.descricao && (
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Descrição</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{acao.descricao}</p>
        </div>
      )}

      {acao.observacoes && (
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Observações</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{acao.observacoes}</p>
        </div>
      )}
    </div>
  );
}

function SecaoInfo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
      </div>
      <dl className="p-5 space-y-2">{children}</dl>
    </div>
  );
}

function Linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px,1fr] gap-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-800 tabular-nums">{children}</dd>
    </div>
  );
}

function fmtMoney(v: number): string {
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
