"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  FileUp,
  Loader2,
  Plug,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listarAcoes,
  listarFuncoes,
  listarOrgaos,
  type FuncaoOption,
  type OrgaoOption,
} from "@/lib/acoes/queries";
import {
  STATUS_ACAO,
  STATUS_ACAO_LABELS,
  type AcaoListagem,
  type StatusAcao,
} from "@/lib/acoes/types";
import { AcoesTabela } from "@/components/acoes/acoes-tabela";

type FiltroStatus = StatusAcao | "todos";

export default function AcoesPage() {
  // Estado
  const [acoes, setAcoes] = useState<AcaoListagem[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Catálogos
  const [orgaos, setOrgaos] = useState<OrgaoOption[]>([]);
  const [funcoes, setFuncoes] = useState<FuncaoOption[]>([]);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [orgaoId, setOrgaoId] = useState<string>("");
  const [funcaoCodigo, setFuncaoCodigo] = useState<string>("");

  // Debounce simples na busca
  const [buscaDebounced, setBuscaDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  // Carrega catálogos uma única vez
  useEffect(() => {
    Promise.all([listarOrgaos(), listarFuncoes()])
      .then(([os, fs]) => {
        setOrgaos(os);
        setFuncoes(fs);
      })
      .catch((e) => console.warn("Falha ao carregar catálogos:", e));
  }, []);

  // Carrega a lista sempre que algum filtro mudar
  const carregarAcoes = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const { acoes, total } = await listarAcoes({
        busca: buscaDebounced || undefined,
        orgaoId: orgaoId || undefined,
        funcaoCodigo: funcaoCodigo || undefined,
        status: filtroStatus === "todos" ? undefined : filtroStatus,
        apenasMacro: true,
      });
      setAcoes(acoes);
      setTotal(total);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }, [buscaDebounced, orgaoId, funcaoCodigo, filtroStatus]);

  useEffect(() => {
    carregarAcoes();
  }, [carregarAcoes]);

  const chipsStatus: { key: FiltroStatus; label: string }[] = useMemo(
    () => [
      { key: "todos", label: "Todas" },
      ...STATUS_ACAO.map((s) => ({ key: s, label: STATUS_ACAO_LABELS[s] })),
    ],
    []
  );

  const filtrosAtivos =
    !!buscaDebounced || !!orgaoId || !!funcaoCodigo || filtroStatus !== "todos";

  function limparFiltros() {
    setBusca("");
    setOrgaoId("");
    setFuncaoCodigo("");
    setFiltroStatus("todos");
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ações Governamentais</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gerencie as ações do município com responsáveis, prazos, evidências e
            indicadores de execução.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            title="Disponível na Fase A.5"
            className="inline-flex items-center gap-2 bg-white text-gray-500 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 opacity-70 cursor-not-allowed"
          >
            <FileUp className="h-4 w-4" />
            Importar CSV
          </button>
          <button
            type="button"
            disabled
            title="Disponível na Fase A.6"
            className="inline-flex items-center gap-2 bg-white text-gray-500 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 opacity-70 cursor-not-allowed"
          >
            <Plug className="h-4 w-4" />
            API
          </button>
          <Link
            href="/dashboard/acoes/nova"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Ação
          </Link>
        </div>
      </div>

      {/* Chips de status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {chipsStatus.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFiltroStatus(c.key)}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap",
              filtroStatus === c.key
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Barra de filtros */}
        <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-1 lg:grid-cols-[1fr,220px,220px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pelo título da ação..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <select
            value={orgaoId}
            onChange={(e) => setOrgaoId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
          >
            <option value="">Todos os órgãos</option>
            {orgaos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.sigla ? `${o.sigla} — ${o.nome}` : o.nome}
              </option>
            ))}
          </select>
          <select
            value={funcaoCodigo}
            onChange={(e) => setFuncaoCodigo(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
          >
            <option value="">Todas as funções</option>
            {funcoes.map((f) => (
              <option key={f.codigo} value={f.codigo}>
                {f.codigo} — {f.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Resumo de contagem + clear */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            {carregando ? "Carregando..." : `${total} ${total === 1 ? "ação" : "ações"} encontrada${total === 1 ? "" : "s"}`}
          </span>
          {filtrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="text-primary-600 hover:underline font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Conteúdo */}
        {carregando ? (
          <div className="p-12 flex flex-col items-center gap-2 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <span className="text-sm">Carregando ações...</span>
          </div>
        ) : erro ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-800">
              Não foi possível carregar as ações
            </h3>
            <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{erro}</p>
            <button
              type="button"
              onClick={carregarAcoes}
              className="mt-4 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <AcoesTabela acoes={acoes} />
        )}
      </div>
    </div>
  );
}
