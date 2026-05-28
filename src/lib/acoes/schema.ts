/**
 * Schemas Zod para Ações Governamentais.
 *
 * Usados em:
 *   - Formulário de criação/edição (React Hook Form + zodResolver)
 *   - Importação CSV (validação linha a linha)
 *   - Endpoint da API externa (validação do payload JSON)
 */

import { z } from "zod";
import {
  TIPOS_ACAO,
  STATUS_ACAO,
  NIVEIS_RISCO,
  FONTES_RECURSO_LEGADO,
  ORIGENS_ACAO,
} from "./types";

/** Converte string vazia ou undefined em null antes de validar. */
const nullify = (v: unknown) => (v === "" || v === undefined ? null : v);

const uuidSchema = z.string().uuid({ message: "UUID inválido" });
const optionalUuid = z.preprocess(nullify, uuidSchema.nullable().optional());

const optionalString = (max: number) =>
  z.preprocess(nullify, z.string().max(max).nullable().optional());

const dateSchema = z.preprocess(
  nullify,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Use o formato YYYY-MM-DD" })
    .nullable()
    .optional()
);

const percentualSchema = z
  .number()
  .min(0, { message: "Mínimo 0%" })
  .max(100, { message: "Máximo 100%" });

const valorMonetarioSchema = z.number().min(0, { message: "Valor não pode ser negativo" });

// =============================================================================
// SCHEMA: Identificação
// =============================================================================

const identificacaoSchema = z.object({
  tipo: z.enum(TIPOS_ACAO),
  titulo: z
    .string()
    .min(5, { message: "Título precisa ter pelo menos 5 caracteres" })
    .max(200),
  descricao: optionalString(2000),
  acao_pai_id: optionalUuid,
});

// =============================================================================
// SCHEMA: Classificação Orçamentária
// =============================================================================

const classificacaoOrcamentariaSchema = z.object({
  orgao_id: uuidSchema,
  unidade_orcamentaria_id: optionalUuid,
  funcao_codigo: optionalString(2),
  funcao_nome: optionalString(200),
  subfuncao_codigo: optionalString(3),
  subfuncao_nome: optionalString(200),
  programa_codigo: optionalString(20),
  programa_nome: optionalString(200),
  acao_orcamentaria_codigo: optionalString(20),
  acao_orcamentaria_nome: optionalString(200),
  natureza_despesa_codigo: optionalString(20),
  natureza_despesa_nome: optionalString(200),
});

// =============================================================================
// SCHEMA: Responsáveis
// =============================================================================

const responsaveisSchema = z.object({
  responsavel_id: optionalUuid,
  responsavel_secundario_id: optionalUuid,
});

// =============================================================================
// SCHEMA: Execução (status, datas, indicadores físicos)
// =============================================================================

const execucaoSchema = z.object({
  status: z.enum(STATUS_ACAO),
  nivel_risco: z.enum(NIVEIS_RISCO),
  percentual_fisico: percentualSchema.default(0),
  percentual_financeiro: percentualSchema.default(0),
  data_inicio: dateSchema,
  data_prevista_fim: dateSchema,
  data_real_fim: dateSchema,
  meta_quantitativa: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().nullable().optional()
  ),
  unidade_meta: optionalString(50),
});

// =============================================================================
// SCHEMA: Localização
// =============================================================================

const optionalCoord = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().min(min).max(max).nullable().optional()
  );

const localizacaoSchema = z.object({
  localizacao_bairro: optionalString(120),
  localizacao_endereco: optionalString(255),
  localizacao_lat: optionalCoord(-90, 90),
  localizacao_lng: optionalCoord(-180, 180),
});

// =============================================================================
// SCHEMA: Recursos (fonte, valores orçamentários)
// =============================================================================

const recursosSchema = z.object({
  fonte_recurso: z.preprocess(
    nullify,
    z.enum(FONTES_RECURSO_LEGADO).nullable().optional()
  ),
  valor_fixado: valorMonetarioSchema.default(0),
  valor_atualizado: valorMonetarioSchema.default(0),
  valor_empenhado: valorMonetarioSchema.default(0),
  valor_liquidado: valorMonetarioSchema.default(0),
  valor_pago: valorMonetarioSchema.default(0),
});

// =============================================================================
// SCHEMA: Dados contratuais
// =============================================================================

const contratoSchema = z.object({
  numero_contrato: optionalString(50),
  numero_licitacao: optionalString(50),
  observacoes: optionalString(2000),
});

// =============================================================================
// SCHEMA COMPLETO: criação de ação
// =============================================================================

// Objeto-base (antes do superRefine) — permite reaproveitar para o .partial()
const acaoBaseSchema = identificacaoSchema
  .merge(classificacaoOrcamentariaSchema)
  .merge(responsaveisSchema)
  .merge(execucaoSchema)
  .merge(localizacaoSchema)
  .merge(recursosSchema)
  .merge(contratoSchema)
  .extend({
    origem: z.enum(ORIGENS_ACAO).default("manual"),
    origem_referencia: optionalString(255),
  });

function validacoesCruzadas(data: z.infer<typeof acaoBaseSchema>, ctx: z.RefinementCtx) {
  // Sub-ações não podem ter valores orçamentários (espelha CHECK do banco)
  if (data.acao_pai_id) {
    const valores = [
      data.valor_fixado,
      data.valor_atualizado,
      data.valor_empenhado,
      data.valor_liquidado,
      data.valor_pago,
    ];
    if (valores.some((v) => v && v > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Sub-ações não podem ter valores orçamentários. Os valores ficam na ação macro.",
        path: ["valor_fixado"],
      });
    }
  }

  // Datas: prevista_fim >= inicio
  if (
    data.data_inicio &&
    data.data_prevista_fim &&
    data.data_prevista_fim < data.data_inicio
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data prevista de fim não pode ser anterior à data de início",
      path: ["data_prevista_fim"],
    });
  }
}

export const acaoCreateSchema = acaoBaseSchema.superRefine(validacoesCruzadas);

export type AcaoCreateInput = z.infer<typeof acaoCreateSchema>;

// =============================================================================
// SCHEMA: atualização de ação (todos os campos opcionais)
// As validações cruzadas ainda se aplicam (datas e sub-ação sem valor).
// =============================================================================

export const acaoUpdateSchema = acaoBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    // Reaplica as validações que fazem sentido em update parcial
    if (data.data_inicio && data.data_prevista_fim && data.data_prevista_fim < data.data_inicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data prevista de fim não pode ser anterior à data de início",
        path: ["data_prevista_fim"],
      });
    }
  });

export type AcaoUpdateInput = z.infer<typeof acaoUpdateSchema>;

// =============================================================================
// SCHEMA: filtros da listagem
// =============================================================================

export const filtrosAcoesSchema = z.object({
  busca: z.string().max(200).optional(),
  orgaoId: uuidSchema.optional(),
  funcaoCodigo: z.string().max(2).optional(),
  status: z.enum(STATUS_ACAO).optional(),
  nivelRisco: z.enum(NIVEIS_RISCO).optional(),
  apenasMacro: z.boolean().default(true),
  acaoPaiId: uuidSchema.optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export type FiltrosAcoesInput = z.infer<typeof filtrosAcoesSchema>;
