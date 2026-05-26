/**
 * Schema dos tipos de questionário por tipo de ação governamental.
 * Define perguntas dinâmicas que se adaptam ao contexto da ação.
 */

export type TipoPergunta =
  | "texto"
  | "numero"
  | "moeda"
  | "percentual"
  | "data"
  | "select"
  | "multiselect"
  | "textarea"
  | "checkbox"
  | "fotos"
  | "documento";

export interface Pergunta {
  id: string;
  pergunta: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  opcoes?: string[];
  ajuda?: string;
  validacao?: {
    min?: number;
    max?: number;
    maxLength?: number;
  };
}

export interface QuestionarioSchema {
  id: string;
  titulo: string;
  descricao: string;
  tipoAcao: TipoAcao;
  periodicidade: "semanal" | "quinzenal" | "mensal";
  perguntas: Pergunta[];
}

export type TipoAcao =
  | "obra_publica"
  | "programa_social"
  | "saude"
  | "educacao"
  | "aquisicao_bens"
  | "aquisicao_servicos"
  | "evento"
  | "capacitacao"
  | "infraestrutura"
  | "tecnologia"
  | "meio_ambiente"
  | "seguranca"
  | "esporte_cultura"
  | "outro";

export const TIPOS_ACAO_LABELS: Record<TipoAcao, string> = {
  obra_publica: "Obra Pública",
  programa_social: "Programa Social",
  saude: "Ação de Saúde",
  educacao: "Ação Educacional",
  aquisicao_bens: "Aquisição de Bens",
  aquisicao_servicos: "Aquisição de Serviços",
  evento: "Evento",
  capacitacao: "Capacitação",
  infraestrutura: "Infraestrutura",
  tecnologia: "Tecnologia",
  meio_ambiente: "Meio Ambiente",
  seguranca: "Segurança",
  esporte_cultura: "Esporte/Cultura",
  outro: "Outro",
};

// ============== SCHEMAS POR TIPO DE AÇÃO ==============

export const SCHEMA_OBRA_PUBLICA: QuestionarioSchema = {
  id: "q_obra_publica",
  titulo: "Questionário de Acompanhamento de Obra",
  descricao: "Atualize o progresso físico, financeiro e cronograma da obra",
  tipoAcao: "obra_publica",
  periodicidade: "semanal",
  perguntas: [
    {
      id: "fase_atual",
      pergunta: "Em qual fase a obra se encontra?",
      tipo: "select",
      obrigatoria: true,
      opcoes: ["Projeto", "Licitação", "Contratação", "Mobilização", "Execução", "Conclusão", "Operação"],
    },
    {
      id: "perc_fisico",
      pergunta: "Percentual de execução física (%)",
      tipo: "percentual",
      obrigatoria: true,
      validacao: { min: 0, max: 100 },
      ajuda: "Considere o que efetivamente foi construído",
    },
    {
      id: "perc_financeiro",
      pergunta: "Percentual de execução financeira (%)",
      tipo: "percentual",
      obrigatoria: true,
      validacao: { min: 0, max: 100 },
      ajuda: "Considere empenhado vs total previsto",
    },
    {
      id: "data_prevista_termino",
      pergunta: "Data prevista para término",
      tipo: "data",
      obrigatoria: true,
    },
    {
      id: "houve_atraso",
      pergunta: "Houve atraso desde o último ciclo?",
      tipo: "checkbox",
      obrigatoria: false,
    },
    {
      id: "motivo_atraso",
      pergunta: "Motivo do atraso (se houver)",
      tipo: "textarea",
      obrigatoria: false,
      validacao: { maxLength: 1000 },
    },
    {
      id: "fotos_obra",
      pergunta: "Fotos atualizadas da obra",
      tipo: "fotos",
      obrigatoria: true,
      ajuda: "Mínimo 3 fotos com data e geolocalização",
    },
    {
      id: "observacoes",
      pergunta: "Observações adicionais",
      tipo: "textarea",
      obrigatoria: false,
      validacao: { maxLength: 2000 },
    },
  ],
};

export const SCHEMA_PROGRAMA_SOCIAL: QuestionarioSchema = {
  id: "q_programa_social",
  titulo: "Questionário de Programa Social",
  descricao: "Informe atendimentos, cobertura e impacto do programa",
  tipoAcao: "programa_social",
  periodicidade: "mensal",
  perguntas: [
    {
      id: "beneficiarios_previstos",
      pergunta: "Beneficiários previstos no período",
      tipo: "numero",
      obrigatoria: true,
      validacao: { min: 0 },
    },
    {
      id: "beneficiarios_atendidos",
      pergunta: "Beneficiários efetivamente atendidos",
      tipo: "numero",
      obrigatoria: true,
      validacao: { min: 0 },
    },
    {
      id: "valor_repassado",
      pergunta: "Valor total repassado no período (R$)",
      tipo: "moeda",
      obrigatoria: true,
    },
    {
      id: "regiao_atendida",
      pergunta: "Regiões/bairros atendidos",
      tipo: "multiselect",
      obrigatoria: true,
      opcoes: ["Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Rural"],
    },
    {
      id: "comprovantes",
      pergunta: "Comprovantes de pagamento/atendimento",
      tipo: "documento",
      obrigatoria: true,
    },
    {
      id: "dificuldades",
      pergunta: "Dificuldades encontradas",
      tipo: "textarea",
      obrigatoria: false,
      validacao: { maxLength: 1500 },
    },
  ],
};

export const SCHEMA_SAUDE: QuestionarioSchema = {
  id: "q_saude",
  titulo: "Questionário de Ação de Saúde",
  descricao: "Acompanhamento de atendimentos e indicadores de saúde",
  tipoAcao: "saude",
  periodicidade: "quinzenal",
  perguntas: [
    {
      id: "atendimentos_realizados",
      pergunta: "Atendimentos realizados no período",
      tipo: "numero",
      obrigatoria: true,
      validacao: { min: 0 },
    },
    {
      id: "tipo_atendimento",
      pergunta: "Tipo de atendimento",
      tipo: "multiselect",
      obrigatoria: true,
      opcoes: ["Consulta médica", "Exames", "Vacinação", "Procedimentos", "Visita domiciliar"],
    },
    {
      id: "publico_atingido",
      pergunta: "Público-alvo atingido",
      tipo: "select",
      obrigatoria: true,
      opcoes: ["Crianças", "Adolescentes", "Adultos", "Idosos", "Gestantes", "Geral"],
    },
    {
      id: "medicamentos_distribuidos",
      pergunta: "Medicamentos distribuídos (unidades)",
      tipo: "numero",
      obrigatoria: false,
      validacao: { min: 0 },
    },
    {
      id: "registros",
      pergunta: "Registros e relatórios",
      tipo: "documento",
      obrigatoria: true,
    },
  ],
};

export const SCHEMA_AQUISICAO_BENS: QuestionarioSchema = {
  id: "q_aquisicao_bens",
  titulo: "Questionário de Aquisição de Bens",
  descricao: "Acompanhamento de compras e recebimentos",
  tipoAcao: "aquisicao_bens",
  periodicidade: "mensal",
  perguntas: [
    {
      id: "fase_processo",
      pergunta: "Fase do processo de aquisição",
      tipo: "select",
      obrigatoria: true,
      opcoes: ["Planejamento", "Pesquisa de preços", "Licitação", "Contratação", "Entrega", "Recebimento", "Distribuição"],
    },
    {
      id: "valor_empenhado",
      pergunta: "Valor empenhado (R$)",
      tipo: "moeda",
      obrigatoria: true,
    },
    {
      id: "valor_pago",
      pergunta: "Valor pago (R$)",
      tipo: "moeda",
      obrigatoria: true,
    },
    {
      id: "fornecedor",
      pergunta: "Fornecedor / CNPJ",
      tipo: "texto",
      obrigatoria: true,
      validacao: { maxLength: 200 },
    },
    {
      id: "data_entrega_prevista",
      pergunta: "Data prevista para entrega",
      tipo: "data",
      obrigatoria: true,
    },
    {
      id: "comprovantes",
      pergunta: "Notas fiscais e comprovantes",
      tipo: "documento",
      obrigatoria: true,
    },
  ],
};

// Schema genérico para tipos sem schema específico
export const SCHEMA_GENERICO: QuestionarioSchema = {
  id: "q_generico",
  titulo: "Questionário Geral de Ação",
  descricao: "Atualização periódica do andamento da ação",
  tipoAcao: "outro",
  periodicidade: "quinzenal",
  perguntas: [
    {
      id: "status_atual",
      pergunta: "Status atual da ação",
      tipo: "select",
      obrigatoria: true,
      opcoes: ["Planejamento", "Em execução", "Pausada", "Concluída", "Cancelada"],
    },
    {
      id: "percentual",
      pergunta: "Percentual de conclusão (%)",
      tipo: "percentual",
      obrigatoria: true,
      validacao: { min: 0, max: 100 },
    },
    {
      id: "principais_atividades",
      pergunta: "Principais atividades realizadas no período",
      tipo: "textarea",
      obrigatoria: true,
      validacao: { maxLength: 2000 },
    },
    {
      id: "dificuldades",
      pergunta: "Dificuldades encontradas",
      tipo: "textarea",
      obrigatoria: false,
      validacao: { maxLength: 1500 },
    },
    {
      id: "evidencias",
      pergunta: "Evidências (fotos, documentos)",
      tipo: "fotos",
      obrigatoria: false,
    },
  ],
};

export const SCHEMAS_POR_TIPO: Partial<Record<TipoAcao, QuestionarioSchema>> = {
  obra_publica: SCHEMA_OBRA_PUBLICA,
  programa_social: SCHEMA_PROGRAMA_SOCIAL,
  saude: SCHEMA_SAUDE,
  aquisicao_bens: SCHEMA_AQUISICAO_BENS,
};

export function getSchema(tipo: TipoAcao): QuestionarioSchema {
  return SCHEMAS_POR_TIPO[tipo] || { ...SCHEMA_GENERICO, tipoAcao: tipo };
}

// ============== MOCK DE QUESTIONÁRIOS PENDENTES ==============

export interface QuestionarioCiclo {
  id: string;
  acaoId: string;
  acaoTitulo: string;
  tipoAcao: TipoAcao;
  schema: QuestionarioSchema;
  prazoFim: Date;
  status: "pendente" | "em_andamento" | "respondido" | "atrasado";
  ciclo: string;
  responsavel: string;
}

const hoje = new Date();
const adicionarDias = (dias: number) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() + dias);
  return d;
};

export const QUESTIONARIOS_MOCK: QuestionarioCiclo[] = [
  {
    id: "qc_001",
    acaoId: "a_001",
    acaoTitulo: "Pavimentação Av. Central",
    tipoAcao: "obra_publica",
    schema: SCHEMA_OBRA_PUBLICA,
    prazoFim: adicionarDias(0),
    status: "atrasado",
    ciclo: "Semana 21/2026",
    responsavel: "Carlos M. — Eng. Civil",
  },
  {
    id: "qc_002",
    acaoId: "a_002",
    acaoTitulo: "Reforma UBS Jardim Esperança",
    tipoAcao: "obra_publica",
    schema: SCHEMA_OBRA_PUBLICA,
    prazoFim: adicionarDias(1),
    status: "pendente",
    ciclo: "Semana 21/2026",
    responsavel: "Carlos M. — Eng. Civil",
  },
  {
    id: "qc_003",
    acaoId: "a_003",
    acaoTitulo: "Programa Bolsa Família Municipal",
    tipoAcao: "programa_social",
    schema: SCHEMA_PROGRAMA_SOCIAL,
    prazoFim: adicionarDias(3),
    status: "em_andamento",
    ciclo: "Maio/2026",
    responsavel: "Ana P. — Assist. Social",
  },
  {
    id: "qc_004",
    acaoId: "a_004",
    acaoTitulo: "Vacinação Influenza 2026",
    tipoAcao: "saude",
    schema: SCHEMA_SAUDE,
    prazoFim: adicionarDias(5),
    status: "pendente",
    ciclo: "Quinzena 10/2026",
    responsavel: "Dr. João S. — Enfermeiro",
  },
  {
    id: "qc_005",
    acaoId: "a_005",
    acaoTitulo: "Aquisição de Merenda Escolar",
    tipoAcao: "aquisicao_bens",
    schema: SCHEMA_AQUISICAO_BENS,
    prazoFim: adicionarDias(7),
    status: "pendente",
    ciclo: "Maio/2026",
    responsavel: "Mariana L. — Compras",
  },
  {
    id: "qc_006",
    acaoId: "a_006",
    acaoTitulo: "Capacitação de Servidores em LGPD",
    tipoAcao: "capacitacao",
    schema: SCHEMA_GENERICO,
    prazoFim: adicionarDias(10),
    status: "pendente",
    ciclo: "Maio/2026",
    responsavel: "RH Municipal",
  },
];
