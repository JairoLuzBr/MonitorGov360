"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { ChevronLeft, CornerDownRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AcaoForm } from "@/components/acoes/acao-form";
import { buscarAcao, criarAcao } from "@/lib/acoes/queries";
import type { AcaoCreateInput } from "@/lib/acoes/schema";
import type { AcaoListagem } from "@/lib/acoes/types";

export default function NovaAcaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 text-gray-500 p-10">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      }
    >
      <NovaAcaoConteudo />
    </Suspense>
  );
}

function NovaAcaoConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paiId = searchParams.get("pai");

  const [pai, setPai] = useState<AcaoListagem | null>(null);
  const [carregandoPai, setCarregandoPai] = useState(!!paiId);
  const [paiInvalido, setPaiInvalido] = useState<string | null>(null);

  // Quando vier com ?pai={id}, carregamos a macro para:
  //   1) pré-preencher no form (acao_pai_id + valores zerados)
  //   2) garantir que NÃO é uma sub-ação (profundidade máxima = 1)
  useEffect(() => {
    if (!paiId) return;
    setCarregandoPai(true);
    buscarAcao(paiId)
      .then((p) => {
        if (!p) {
          setPaiInvalido("Ação macro pai não encontrada.");
          return;
        }
        if (p.acao_pai_id) {
          setPaiInvalido(
            "A ação selecionada é uma sub-ação. Não é possível criar sub-sub-ações."
          );
          return;
        }
        setPai(p);
      })
      .catch((e) => setPaiInvalido((e as Error).message))
      .finally(() => setCarregandoPai(false));
  }, [paiId]);

  async function handleSubmit(values: AcaoCreateInput) {
    try {
      const acao = await criarAcao(values);
      toast.success("Ação criada com sucesso!");
      // Se foi criada como sub-ação, volta para o detalhe da macro pai
      router.push(`/dashboard/acoes/${acao.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (carregandoPai) {
    return (
      <div className="flex items-center gap-3 text-gray-500 p-10">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Carregando dados da ação macro...</span>
      </div>
    );
  }

  if (paiInvalido) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
        <h3 className="text-base font-semibold text-red-700">{paiInvalido}</h3>
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

  const defaultValues: Partial<AcaoCreateInput> | undefined = pai
    ? {
        acao_pai_id: pai.id,
        orgao_id: pai.orgao_id,
        funcao_codigo: pai.funcao_codigo,
        funcao_nome: pai.funcao_nome,
        subfuncao_codigo: pai.subfuncao_codigo,
        subfuncao_nome: pai.subfuncao_nome,
        programa_codigo: pai.programa_codigo,
        programa_nome: pai.programa_nome,
        fonte_recurso: pai.fonte_recurso,
        // Valores ficam zerados (default do form já cobre)
      }
    : undefined;

  const voltarHref = pai ? `/dashboard/acoes/${pai.id}` : "/dashboard/acoes";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={voltarHref}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {pai ? "Nova Sub-ação" : "Nova Ação Governamental"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pai
              ? "Detalhamento operacional vinculado a uma macro existente."
              : "Preencha os dados em 7 etapas. Campos com * são obrigatórios."}
          </p>
        </div>
      </div>

      {pai && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-primary-800">
          <CornerDownRight className="h-4 w-4" />
          <span>
            Vinculando à macro:{" "}
            <Link
              href={`/dashboard/acoes/${pai.id}`}
              className="font-semibold underline hover:text-primary-900"
            >
              {pai.titulo}
            </Link>
          </span>
        </div>
      )}

      <AcaoForm
        modo="criar"
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
