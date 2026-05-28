/**
 * Queries Supabase para Ações Governamentais.
 *
 * Multi-tenant: o `municipio_id` é injetado automaticamente pelo RLS via JWT.
 * Não precisamos passá-lo nos SELECTs.
 *
 * Para INSERTs: o `municipio_id` é obrigatório — extraímos do usuário logado.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  Acao,
  AcaoComIndicadores,
  AcaoListagem,
  FiltrosAcoes,
} from "./types";
import type { AcaoCreateInput, AcaoUpdateInput } from "./schema";

// =============================================================================
// HELPERS internos
// =============================================================================

async function obterMunicipioIdAtual(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Usuário não autenticado");
  }
  const municipioId = data.user.user_metadata?.municipio_id as string | undefined;
  if (!municipioId) {
    throw new Error("municipio_id ausente no JWT do usuário");
  }
  return municipioId;
}

// =============================================================================
// LISTAR — usa a VIEW vw_acoes_indicadores para já trazer os indicadores
// =============================================================================

/**
 * Lista ações do município atual com indicadores derivados.
 * Por padrão lista APENAS ações macro (acao_pai_id IS NULL).
 * Para listar sub-ações de uma macro, passe `acaoPaiId`.
 */
export async function listarAcoes(filtros: FiltrosAcoes = {}): Promise<{
  acoes: AcaoListagem[];
  total: number;
}> {
  const supabase = createClient();

  const {
    busca,
    orgaoId,
    funcaoCodigo,
    status,
    nivelRisco,
    apenasMacro = true,
    acaoPaiId,
    limit = 50,
    offset = 0,
  } = filtros;

  let query = supabase
    .from("vw_acoes_indicadores")
    .select(
      `
        *,
        orgao:orgaos!orgao_id(id, nome, sigla),
        responsavel:usuarios!responsavel_id(id, nome)
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (acaoPaiId) {
    query = query.eq("acao_pai_id", acaoPaiId);
  } else if (apenasMacro) {
    query = query.is("acao_pai_id", null);
  }

  if (busca) {
    query = query.ilike("titulo", `%${busca}%`);
  }
  if (orgaoId) query = query.eq("orgao_id", orgaoId);
  if (funcaoCodigo) query = query.eq("funcao_codigo", funcaoCodigo);
  if (status) query = query.eq("status", status);
  if (nivelRisco) query = query.eq("nivel_risco", nivelRisco);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Falha ao listar ações: ${error.message}`);
  }

  return {
    acoes: (data ?? []) as unknown as AcaoListagem[],
    total: count ?? 0,
  };
}

// =============================================================================
// BUSCAR por ID
// =============================================================================

export async function buscarAcao(id: string): Promise<AcaoListagem | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vw_acoes_indicadores")
    .select(
      `
        *,
        orgao:orgaos!orgao_id(id, nome, sigla),
        responsavel:usuarios!responsavel_id(id, nome)
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar ação: ${error.message}`);
  }
  return (data ?? null) as unknown as AcaoListagem | null;
}

// =============================================================================
// SUB-AÇÕES de uma macro
// =============================================================================

export async function listarSubAcoes(acaoPaiId: string): Promise<AcaoComIndicadores[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vw_acoes_indicadores")
    .select("*")
    .eq("acao_pai_id", acaoPaiId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Falha ao listar sub-ações: ${error.message}`);
  }
  return (data ?? []) as unknown as AcaoComIndicadores[];
}

// =============================================================================
// CRIAR
// =============================================================================

export async function criarAcao(payload: AcaoCreateInput): Promise<Acao> {
  const supabase = createClient();
  const municipio_id = await obterMunicipioIdAtual();

  const { data: userData } = await supabase.auth.getUser();
  const created_by = userData.user?.id ?? null;

  // Cast por causa do tipo genérico de `Database` (placeholder).
  // O CHECK e RLS no banco garantem a integridade do payload.
  const row = { ...payload, municipio_id, created_by } as never;

  const { data, error } = await supabase
    .from("acoes")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Falha ao criar ação: ${error.message}`);
  }
  return data as unknown as Acao;
}

// =============================================================================
// ATUALIZAR
// =============================================================================

export async function atualizarAcao(
  id: string,
  payload: AcaoUpdateInput
): Promise<Acao> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("acoes")
    .update(payload as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Falha ao atualizar ação: ${error.message}`);
  }
  return data as unknown as Acao;
}

// =============================================================================
// EXCLUIR (hard delete)
// Para soft delete (cancelamento) use `atualizarAcao(id, { status: "cancelada" })`.
// =============================================================================

export async function excluirAcao(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("acoes").delete().eq("id", id);
  if (error) {
    throw new Error(`Falha ao excluir ação: ${error.message}`);
  }
}

// =============================================================================
// CATÁLOGOS — para preencher selects no formulário
// =============================================================================

export interface OrgaoOption {
  id: string;
  nome: string;
  sigla: string | null;
}

export async function listarOrgaos(): Promise<OrgaoOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orgaos")
    .select("id, nome, sigla")
    .eq("ativo", true)
    .order("nome");
  if (error) throw new Error(`Falha ao listar órgãos: ${error.message}`);
  return data ?? [];
}

export interface FuncaoOption {
  codigo: string;
  nome: string;
}

export async function listarFuncoes(): Promise<FuncaoOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cat_funcoes")
    .select("codigo, nome")
    .eq("ativo", true)
    .order("codigo");
  if (error) throw new Error(`Falha ao listar funções: ${error.message}`);
  return data ?? [];
}

export interface UsuarioOption {
  id: string;
  nome: string;
  cargo: string | null;
}

export async function listarUsuariosAtivos(): Promise<UsuarioOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, cargo")
    .eq("ativo", true)
    .order("nome");
  if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);
  return data ?? [];
}

export interface SubfuncaoOption {
  codigo: string;
  nome: string;
  funcao_codigo: string;
}

export async function listarSubfuncoes(
  funcaoCodigo?: string
): Promise<SubfuncaoOption[]> {
  const supabase = createClient();
  let query = supabase
    .from("cat_subfuncoes")
    .select("codigo, nome, funcao_codigo")
    .eq("ativo", true)
    .order("codigo");
  if (funcaoCodigo) query = query.eq("funcao_codigo", funcaoCodigo);
  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar subfunções: ${error.message}`);
  return data ?? [];
}

export interface NaturezaDespesaOption {
  codigo: string;
  nome: string;
  categoria: "corrente" | "capital" | null;
}

export async function listarNaturezasDespesa(): Promise<NaturezaDespesaOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cat_naturezas_despesa")
    .select("codigo, nome, categoria")
    .eq("ativo", true)
    .order("codigo");
  if (error) throw new Error(`Falha ao listar naturezas de despesa: ${error.message}`);
  return data ?? [];
}

export interface FonteRecursoOption {
  codigo: string;
  nome: string;
  esfera: string | null;
}

export async function listarFontesRecurso(): Promise<FonteRecursoOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cat_fontes_recurso")
    .select("codigo, nome, esfera")
    .eq("ativo", true)
    .order("codigo");
  if (error) throw new Error(`Falha ao listar fontes de recurso: ${error.message}`);
  return data ?? [];
}

export interface UnidadeOrcamentariaOption {
  id: string;
  codigo: string;
  nome: string;
  orgao_id: string | null;
}

export async function listarUnidadesOrcamentarias(): Promise<UnidadeOrcamentariaOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("unidades_orcamentarias")
    .select("id, codigo, nome, orgao_id")
    .eq("ativo", true)
    .order("codigo");
  if (error) throw new Error(`Falha ao listar unidades orçamentárias: ${error.message}`);
  return data ?? [];
}

/**
 * Lista ações macro (acao_pai_id IS NULL) que podem ser pai de uma nova sub-ação.
 * Se `excluirId` for fornecido, ele é excluído (útil ao editar uma ação existente
 * para que ela não apareça como candidata a pai de si mesma).
 */
export async function listarAcoesPaiCandidatas(
  excluirId?: string
): Promise<{ id: string; titulo: string }[]> {
  const supabase = createClient();
  let query = supabase
    .from("acoes")
    .select("id, titulo")
    .is("acao_pai_id", null)
    .order("titulo");
  if (excluirId) query = query.neq("id", excluirId);
  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar ações pai: ${error.message}`);
  return data ?? [];
}
