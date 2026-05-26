/**
 * Tipos TypeScript principais do MonitorGov360
 */

// =============================================================================
// ENUMS
// =============================================================================

export enum PerfilUsuario {
  SUPER_ADMIN = "super_admin",
  ADMIN_MUNICIPAL = "admin_municipal",
  GESTOR_SECRETARIA = "gestor_secretaria",
  COORDENADOR_OBRAS = "coordenador_obras",
  COORDENADOR_SOCIAL = "coordenador_social",
  COORDENADOR_SAUDE = "coordenador_saude",
  COORDENADOR_EDUCACAO = "coordenador_educacao",
  FISCAL_OBRA = "fiscal_obra",
  TECNICO_CAMPO = "tecnico_campo",
  ANALISTA = "analista",
  CONTROLADOR_INTERNO = "controlador_interno",
  VEREADOR = "vereador",
  PREFEITO = "prefeito",
  CIDADAO = "cidadao",
  AUDITOR = "auditor",
  ASSESSOR_COMUNICACAO = "assessor_comunicacao",
}

export enum TipoAcao {
  OBRA_PUBLICA = "obra_publica",
  SERVICO_ENGENHARIA = "servico_engenharia",
  PROGRAMA_SOCIAL = "programa_social",
  ACAO_SAUDE = "acao_saude",
  ACAO_EDUCACIONAL = "acao_educacional",
  AQUISICAO_BENS = "aquisicao_bens",
  CONTRATO_CONTINUADO = "contrato_continuado",
  CONVENIO_TRANSFERENCIA = "convenio_transferencia",
  ACAO_EMERGENCIAL = "acao_emergencial",
  META_ESTRATEGICA = "meta_estrategica",
  REFORMA = "reforma",
  PAVIMENTACAO = "pavimentacao",
  SANEAMENTO = "saneamento",
  HABITACAO = "habitacao",
  CULTURA_LAZER = "cultura_lazer",
  MEIO_AMBIENTE = "meio_ambiente",
}

export enum StatusAcao {
  PLANEJADA = "planejada",
  EM_LICITACAO = "em_licitacao",
  CONTRATADA = "contratada",
  EM_EXECUCAO = "em_execucao",
  PARALISADA = "paralisada",
  CONCLUIDA = "concluida",
  CANCELADA = "cancelada",
}

export enum PrioridadeAcao {
  BAIXA = "baixa",
  MEDIA = "media",
  ALTA = "alta",
  CRITICA = "critica",
}

export enum TipoEvidencia {
  FOTO = "foto",
  VIDEO = "video",
  DOCUMENTO = "documento",
  MEDICAO = "medicao",
  RELATORIO = "relatorio",
  CONTRATO = "contrato",
  NOTA_FISCAL = "nota_fiscal",
}

export enum TipoAlerta {
  PRAZO_PROXIMO = "prazo_proximo",
  PRAZO_VENCIDO = "prazo_vencido",
  ATRASO_FISICO = "atraso_fisico",
  ATRASO_FINANCEIRO = "atraso_financeiro",
  PENDENCIA_DOCUMENTAL = "pendencia_documental",
  PARALIZACAO = "paralizacao",
  IRREGULARIDADE = "irregularidade",
  SISTEMA = "sistema",
}

export enum StatusAlerta {
  ATIVO = "ativo",
  RECONHECIDO = "reconhecido",
  RESOLVIDO = "resolvido",
  DESCARTADO = "descartado",
}

// =============================================================================
// ENTIDADES PRINCIPAIS
// =============================================================================

export interface Municipio {
  id: string;
  nome: string;
  codigo_ibge: string;
  uf: string;
  populacao?: number;
  logo_url?: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Usuario {
  id: string;
  email: string;
  nome_completo: string;
  perfil: PerfilUsuario;
  municipio_id: string;
  orgao_id?: string | null;
  foto_url?: string | null;
  telefone?: string | null;
  cargo?: string | null;
  ativo: boolean;
  ultimo_acesso?: string | null;
  criado_em: string;
  atualizado_em: string;
  // Relações
  municipio?: Municipio;
  orgao?: Orgao;
}

export interface Orgao {
  id: string;
  municipio_id: string;
  nome: string;
  sigla: string;
  tipo: string; // secretaria, autarquia, fundacao, etc.
  responsavel_id?: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  // Relações
  municipio?: Municipio;
  responsavel?: Usuario;
}

export interface Acao {
  id: string;
  municipio_id: string;
  orgao_id: string;
  titulo: string;
  descricao?: string | null;
  tipo: TipoAcao;
  status: StatusAcao;
  prioridade: PrioridadeAcao;
  responsavel_id: string;
  data_inicio_previsto?: string | null;
  data_fim_previsto?: string | null;
  data_inicio_real?: string | null;
  data_fim_real?: string | null;
  percentual_fisico: number; // 0-100
  percentual_financeiro: number; // 0-100
  latitude?: number | null;
  longitude?: number | null;
  endereco?: string | null;
  bairro?: string | null;
  populacao_beneficiada?: number | null;
  tags?: string[] | null;
  criado_em: string;
  atualizado_em: string;
  // Relações
  municipio?: Municipio;
  orgao?: Orgao;
  responsavel?: Usuario;
  orcamento?: Orcamento;
  evidencias?: Evidencia[];
  alertas?: Alerta[];
}

export interface Orcamento {
  id: string;
  acao_id: string;
  valor_previsto: number;
  valor_empenhado: number;
  valor_liquidado: number;
  valor_pago: number;
  fonte_recurso?: string | null;
  numero_contrato?: string | null;
  numero_licitacao?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Evidencia {
  id: string;
  acao_id: string;
  tipo: TipoEvidencia;
  titulo: string;
  descricao?: string | null;
  arquivo_url: string;
  arquivo_tamanho?: number | null;
  arquivo_mime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  data_captura?: string | null;
  enviado_por_id: string;
  criado_em: string;
  // Relações
  enviado_por?: Usuario;
}

export interface Alerta {
  id: string;
  municipio_id: string;
  acao_id?: string | null;
  tipo: TipoAlerta;
  status: StatusAlerta;
  titulo: string;
  mensagem: string;
  prioridade: PrioridadeAcao;
  destinatario_id?: string | null;
  reconhecido_por_id?: string | null;
  reconhecido_em?: string | null;
  resolvido_em?: string | null;
  criado_em: string;
  // Relações
  acao?: Pick<Acao, "id" | "titulo" | "tipo" | "status">;
  destinatario?: Pick<Usuario, "id" | "nome_completo" | "email">;
}

export interface Pendencia {
  id: string;
  acao_id: string;
  titulo: string;
  descricao?: string | null;
  responsavel_id: string;
  data_limite?: string | null;
  concluida: boolean;
  concluida_em?: string | null;
  criado_em: string;
  atualizado_em: string;
  // Relações
  responsavel?: Pick<Usuario, "id" | "nome_completo">;
}

// =============================================================================
// QUESTIONÁRIOS
// =============================================================================

export interface Questionario {
  id: string;
  municipio_id: string;
  titulo: string;
  descricao?: string | null;
  tipo_acao?: TipoAcao | null;
  perguntas: Pergunta[];
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Pergunta {
  id: string;
  ordem: number;
  texto: string;
  tipo: "texto" | "numero" | "booleano" | "selecao" | "multipla_escolha" | "data" | "arquivo";
  obrigatoria: boolean;
  opcoes?: string[] | null;
  validacao?: Record<string, unknown> | null;
}

export interface CicloQuestionario {
  id: string;
  questionario_id: string;
  acao_id: string;
  periodo: string; // ex: "2024-Q1", "2024-01"
  data_inicio: string;
  data_fim: string;
  status: "aberto" | "em_preenchimento" | "submetido" | "aprovado" | "rejeitado";
  criado_em: string;
  // Relações
  questionario?: Questionario;
  respostas?: RespostaQuestionario[];
}

export interface RespostaQuestionario {
  id: string;
  ciclo_id: string;
  pergunta_id: string;
  resposta: unknown; // pode ser string, number, boolean, string[], etc.
  evidencia_id?: string | null;
  respondido_por_id: string;
  respondido_em: string;
  // Relações
  respondido_por?: Pick<Usuario, "id" | "nome_completo">;
}

// =============================================================================
// AUDITORIA
// =============================================================================

export interface Auditoria {
  id: string;
  tabela: string;
  registro_id: string;
  operacao: "INSERT" | "UPDATE" | "DELETE";
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  usuario_id?: string | null;
  ip_origem?: string | null;
  criado_em: string;
  // Relações
  usuario?: Pick<Usuario, "id" | "nome_completo" | "email">;
}

// =============================================================================
// FCM / PUSH NOTIFICATIONS
// =============================================================================

export interface FcmToken {
  id: string;
  usuario_id: string;
  token: string;
  plataforma: "web" | "android" | "ios";
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

// =============================================================================
// TIPOS DE UTILIDADE
// =============================================================================

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};

export type ActionState<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
