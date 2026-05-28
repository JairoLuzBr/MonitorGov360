/**
 * Tipos das Ações Governamentais.
 *
 * Fonte da verdade: schema SQL (migrations 001 + 005).
 * Mantenha sincronizado com o banco.
 */

// =============================================================================
// ENUMS (string literal unions — alinhados ao CHECK constraint do banco)
// =============================================================================

export const TIPOS_ACAO = [
  "obra_publica",
  "servico_engenharia",
  "programa_social",
  "acao_saude",
  "acao_educacional",
  "aquisicao_bens",
  "contrato_continuado",
  "convenio_transferencia",
  "acao_emergencial",
  "meta_estrategica",
  "servico_continuado",
  "projeto_especial",
  "reforma_adaptacao",
  "manutencao_equipamento",
] as const;
export type TipoAcao = (typeof TIPOS_ACAO)[number];

export const STATUS_ACAO = [
  "planejada",
  "em_licitacao",
  "em_execucao",
  "paralisada",
  "concluida",
  "cancelada",
] as const;
export type StatusAcao = (typeof STATUS_ACAO)[number];

export const NIVEIS_RISCO = ["baixo", "medio", "alto", "critico"] as const;
export type NivelRisco = (typeof NIVEIS_RISCO)[number];

export const FONTES_RECURSO_LEGADO = [
  "tesouro_municipal",
  "federal",
  "estadual",
  "emenda",
  "convenio",
] as const;
export type FonteRecursoLegado = (typeof FONTES_RECURSO_LEGADO)[number];

export const ORIGENS_ACAO = ["manual", "api", "csv"] as const;
export type OrigemAcao = (typeof ORIGENS_ACAO)[number];

// =============================================================================
// RÓTULOS pt-BR para uso na UI
// =============================================================================

export const TIPO_ACAO_LABELS: Record<TipoAcao, string> = {
  obra_publica: "Obra Pública",
  servico_engenharia: "Serviço de Engenharia",
  programa_social: "Programa Social",
  acao_saude: "Ação de Saúde",
  acao_educacional: "Ação Educacional",
  aquisicao_bens: "Aquisição de Bens",
  contrato_continuado: "Contrato Continuado",
  convenio_transferencia: "Convênio / Transferência",
  acao_emergencial: "Ação Emergencial",
  meta_estrategica: "Meta Estratégica",
  servico_continuado: "Serviço Continuado",
  projeto_especial: "Projeto Especial",
  reforma_adaptacao: "Reforma / Adaptação",
  manutencao_equipamento: "Manutenção de Equipamento",
};

export const STATUS_ACAO_LABELS: Record<StatusAcao, string> = {
  planejada: "Planejada",
  em_licitacao: "Em licitação",
  em_execucao: "Em execução",
  paralisada: "Paralisada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const NIVEL_RISCO_LABELS: Record<NivelRisco, string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
  critico: "Crítico",
};

export const ORIGEM_ACAO_LABELS: Record<OrigemAcao, string> = {
  manual: "Manual",
  api: "API",
  csv: "CSV",
};

// =============================================================================
// ENTIDADE PRINCIPAL: Acao (Row da tabela `acoes`)
// =============================================================================

export interface Acao {
  id: string;
  municipio_id: string;
  orgao_id: string;
  acao_pai_id: string | null;
  tipo: TipoAcao;
  titulo: string;
  descricao: string | null;
  responsavel_id: string | null;
  responsavel_secundario_id: string | null;
  status: StatusAcao;
  nivel_risco: NivelRisco;
  data_inicio: string | null;
  data_prevista_fim: string | null;
  data_real_fim: string | null;
  localizacao_bairro: string | null;
  localizacao_endereco: string | null;
  localizacao_lat: number | null;
  localizacao_lng: number | null;
  percentual_fisico: number;
  percentual_financeiro: number;
  meta_quantitativa: number | null;
  unidade_meta: string | null;
  numero_contrato: string | null;
  numero_licitacao: string | null;
  fonte_recurso: FonteRecursoLegado | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Migration 005 — Classificação orçamentária expandida
  unidade_orcamentaria_id: string | null;
  funcao_codigo: string | null;
  funcao_nome: string | null;
  subfuncao_codigo: string | null;
  subfuncao_nome: string | null;
  programa_codigo: string | null;
  programa_nome: string | null;
  acao_orcamentaria_codigo: string | null;
  acao_orcamentaria_nome: string | null;
  natureza_despesa_codigo: string | null;
  natureza_despesa_nome: string | null;
  origem: OrigemAcao;
  origem_referencia: string | null;

  // Migration 005 — Valores orçamentários (apenas em macro)
  valor_fixado: number;
  valor_atualizado: number;
  valor_empenhado: number;
  valor_liquidado: number;
  valor_pago: number;
}

// =============================================================================
// VIEW: vw_acoes_indicadores (acao + indicadores derivados)
// =============================================================================

export interface AcaoComIndicadores extends Acao {
  indicador_eficiencia: number | null;
  liquidez_orcamentaria: number | null;
  execucao_financeira_real: number | null;
  divergencia_fisico_financeira: number;
  saldo_a_empenhar: number;
  saldo_a_pagar: number;
}

// =============================================================================
// LISTAGEM: Acao + dados auxiliares dos joins (orgao, responsavel)
// =============================================================================

export interface AcaoListagem extends AcaoComIndicadores {
  orgao?: { id: string; nome: string; sigla: string | null } | null;
  responsavel?: { id: string; nome: string } | null;
}

// =============================================================================
// FILTROS de listagem
// =============================================================================

export interface FiltrosAcoes {
  busca?: string;
  orgaoId?: string;
  funcaoCodigo?: string;
  status?: StatusAcao;
  nivelRisco?: NivelRisco;
  apenasMacro?: boolean;
  /** ID do pai — para listar sub-ações de uma macro específica */
  acaoPaiId?: string;
  limit?: number;
  offset?: number;
}

// =============================================================================
// PAYLOADS: Insert e Update
// =============================================================================

export type AcaoInsertPayload = Omit<
  Acao,
  | "id"
  | "municipio_id"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "indicador_eficiencia"
>;

export type AcaoUpdatePayload = Partial<AcaoInsertPayload>;
