/**
 * Tipos e dados mockados para a feature de Trilha de Auditoria.
 * Eventos auditáveis em fiscalização governamental.
 */

export type TipoEventoAuditoria =
  | "CRIADO"
  | "ALTERADO"
  | "REMOVIDO"
  | "ACESSO"
  | "EXPORTACAO"
  | "PERMISSAO"
  | "CONFIGURACAO";

export type SeveridadeEvento = "info" | "atencao" | "critico";

export type EntidadeTipo =
  | "acao"
  | "evidencia"
  | "usuario"
  | "questionario"
  | "contrato"
  | "orcamento"
  | "sistema";

export interface AtorEvento {
  id: string;
  nome: string;
  perfil: string;
}

export interface EntidadeEvento {
  tipo: EntidadeTipo;
  id: string;
  titulo: string;
}

export interface EventoAuditoria {
  id: string;
  tipo: TipoEventoAuditoria;
  severidade: SeveridadeEvento;
  ator: AtorEvento;
  entidade: EntidadeEvento;
  descricao: string;
  contexto?: Record<string, string>;
  ip: string;
  userAgentResumido: string;
  ocorreuEm: Date;
}

export interface EvolucaoDiaria {
  dia: string;
  eventos: number;
}

// ============== LABELS E CONFIGURAÇÕES ==============

export const TIPO_EVENTO_LABELS: Record<TipoEventoAuditoria, string> = {
  CRIADO: "Criado",
  ALTERADO: "Alterado",
  REMOVIDO: "Removido",
  ACESSO: "Acesso",
  EXPORTACAO: "Exportação",
  PERMISSAO: "Permissão",
  CONFIGURACAO: "Configuração",
};

export const TIPO_EVENTO_CONFIG: Record<
  TipoEventoAuditoria,
  { badge: string }
> = {
  CRIADO: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ALTERADO: { badge: "bg-blue-50 text-blue-700 border-blue-200" },
  REMOVIDO: { badge: "bg-red-50 text-red-700 border-red-200" },
  ACESSO: { badge: "bg-slate-50 text-slate-700 border-slate-200" },
  EXPORTACAO: { badge: "bg-violet-50 text-violet-700 border-violet-200" },
  PERMISSAO: { badge: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIGURACAO: { badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
};

export const SEVERIDADE_LABELS: Record<SeveridadeEvento, string> = {
  info: "Info",
  atencao: "Atenção",
  critico: "Crítico",
};

export const SEVERIDADE_CONFIG: Record<SeveridadeEvento, { badge: string }> = {
  info: { badge: "bg-blue-50 text-blue-700 border-blue-200" },
  atencao: { badge: "bg-amber-50 text-amber-700 border-amber-200" },
  critico: { badge: "bg-red-50 text-red-700 border-red-200" },
};

export const ENTIDADE_LABELS: Record<EntidadeTipo, string> = {
  acao: "Ação",
  evidencia: "Evidência",
  usuario: "Usuário",
  questionario: "Questionário",
  contrato: "Contrato",
  orcamento: "Orçamento",
  sistema: "Sistema",
};

// ============== ATORES (USUÁRIOS) ==============

const ATORES: Record<string, AtorEvento> = {
  roberto: { id: "u_001", nome: "Roberto F.", perfil: "Secretário" },
  carlos: { id: "u_002", nome: "Carlos M.", perfil: "Eng. Civil" },
  joana: { id: "u_003", nome: "Joana S.", perfil: "Fiscal" },
  ana: { id: "u_004", nome: "Ana P.", perfil: "Assist. Social" },
  mariana: { id: "u_005", nome: "Mariana L.", perfil: "Compras" },
  joao: { id: "u_006", nome: "Dr. João S.", perfil: "Enfermeiro" },
};

// ============== HELPERS DE DATA ==============

const horasAtras = (h: number): Date => new Date(Date.now() - 1000 * 60 * 60 * h);

// ============== EVENTOS MOCKADOS ==============

export const EVENTOS_MOCK: EventoAuditoria[] = [
  // ===== Críticos (pelo menos 5) =====
  {
    id: "ev_001",
    tipo: "ACESSO",
    severidade: "critico",
    ator: ATORES.roberto,
    entidade: {
      tipo: "sistema",
      id: "sis_login",
      titulo: "Login fora do horário",
    },
    descricao:
      "Acesso bem-sucedido fora do horário comercial (02:43) a partir de IP não habitual",
    contexto: {
      horario: "02:43",
      regiao: "São Paulo - SP",
      tentativas: "1",
    },
    ip: "201.55.42.18",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(2),
  },
  {
    id: "ev_002",
    tipo: "ALTERADO",
    severidade: "critico",
    ator: ATORES.mariana,
    entidade: {
      tipo: "contrato",
      id: "ct_2026_005",
      titulo: "Contrato 2026/005 — Merenda Escolar",
    },
    descricao:
      "Valor total do contrato alterado de R$ 1.240.000,00 para R$ 1.890.000,00 (+52%)",
    contexto: {
      valor_anterior: "R$ 1.240.000,00",
      valor_novo: "R$ 1.890.000,00",
      variacao: "+52,4%",
    },
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(5),
  },
  {
    id: "ev_003",
    tipo: "REMOVIDO",
    severidade: "critico",
    ator: ATORES.carlos,
    entidade: {
      tipo: "evidencia",
      id: "ev_022",
      titulo: "Foto da obra — Av. Central km 3",
    },
    descricao:
      "Evidência fotográfica removida 4 dias após upload — ação vinculada ainda em execução",
    contexto: {
      acao_vinculada: "Pavimentação Av. Central",
      idade_evidencia: "4 dias",
    },
    ip: "10.0.0.42",
    userAgentResumido: "Firefox / Linux",
    ocorreuEm: horasAtras(8),
  },
  {
    id: "ev_004",
    tipo: "PERMISSAO",
    severidade: "critico",
    ator: ATORES.roberto,
    entidade: {
      tipo: "usuario",
      id: "u_009",
      titulo: "Lucas T. — Estagiário",
    },
    descricao:
      "Concedida permissão de Administrador para usuário com perfil de Estagiário",
    contexto: {
      perfil_anterior: "Estagiário",
      permissao_concedida: "ADMIN_FULL",
    },
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(12),
  },
  {
    id: "ev_005",
    tipo: "ACESSO",
    severidade: "critico",
    ator: { id: "u_999", nome: "Tentativa anônima", perfil: "Desconhecido" },
    descricao:
      "5 tentativas de login falhadas consecutivas para o usuário 'roberto.f@municipio.gov.br'",
    entidade: {
      tipo: "sistema",
      id: "sis_login",
      titulo: "Falha de autenticação",
    },
    contexto: {
      usuario_alvo: "roberto.f@municipio.gov.br",
      tentativas: "5",
    },
    ip: "45.187.122.91",
    userAgentResumido: "curl / Linux",
    ocorreuEm: horasAtras(14),
  },

  // ===== Eventos de alteração (atenção) =====
  {
    id: "ev_006",
    tipo: "ALTERADO",
    severidade: "atencao",
    ator: ATORES.carlos,
    entidade: {
      tipo: "acao",
      id: "a_001",
      titulo: "Pavimentação Av. Central",
    },
    descricao:
      "Prazo de conclusão estendido de 30/06/2026 para 31/08/2026 (+62 dias)",
    contexto: {
      prazo_anterior: "30/06/2026",
      prazo_novo: "31/08/2026",
    },
    ip: "10.0.0.42",
    userAgentResumido: "Firefox / Linux",
    ocorreuEm: horasAtras(18),
  },
  {
    id: "ev_007",
    tipo: "ALTERADO",
    severidade: "atencao",
    ator: ATORES.ana,
    entidade: {
      tipo: "acao",
      id: "a_003",
      titulo: "Programa Bolsa Família Municipal",
    },
    descricao: "Status alterado de 'Em andamento' para 'Concluído'",
    contexto: {
      status_anterior: "em_andamento",
      status_novo: "concluido",
    },
    ip: "192.168.1.108",
    userAgentResumido: "Safari / iPhone",
    ocorreuEm: horasAtras(22),
  },
  {
    id: "ev_008",
    tipo: "ALTERADO",
    severidade: "info",
    ator: ATORES.joana,
    entidade: {
      tipo: "questionario",
      id: "q_014",
      titulo: "Questionário ciclo 21/2026",
    },
    descricao: "Resposta da pergunta 3 atualizada após revisão do fiscal",
    ip: "192.168.1.110",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(24),
  },

  // ===== Eventos de criação =====
  {
    id: "ev_009",
    tipo: "CRIADO",
    severidade: "info",
    ator: ATORES.carlos,
    entidade: {
      tipo: "evidencia",
      id: "ev_045",
      titulo: "Foto — frente de obra Av. Central",
    },
    descricao: "Nova evidência fotográfica anexada à ação",
    ip: "10.0.0.42",
    userAgentResumido: "Chrome 120 / Android",
    ocorreuEm: horasAtras(26),
  },
  {
    id: "ev_010",
    tipo: "CRIADO",
    severidade: "info",
    ator: ATORES.ana,
    entidade: {
      tipo: "acao",
      id: "a_011",
      titulo: "Distribuição de cestas básicas — junho/2026",
    },
    descricao: "Nova ação cadastrada para o mês de junho",
    ip: "192.168.1.108",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(30),
  },
  {
    id: "ev_011",
    tipo: "CRIADO",
    severidade: "info",
    ator: ATORES.joana,
    entidade: {
      tipo: "questionario",
      id: "q_022",
      titulo: "Questionário fiscalização semana 21",
    },
    descricao: "Novo ciclo de questionário criado para fiscalização",
    ip: "192.168.1.110",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(34),
  },
  {
    id: "ev_012",
    tipo: "CRIADO",
    severidade: "info",
    ator: ATORES.roberto,
    entidade: {
      tipo: "usuario",
      id: "u_011",
      titulo: "Patrícia S. — Fiscal de Obras",
    },
    descricao: "Novo usuário cadastrado com perfil Fiscal",
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(40),
  },

  // ===== Eventos de remoção =====
  {
    id: "ev_013",
    tipo: "REMOVIDO",
    severidade: "atencao",
    ator: ATORES.mariana,
    entidade: {
      tipo: "evidencia",
      id: "ev_018",
      titulo: "Nota fiscal duplicada — 005220",
    },
    descricao: "Evidência removida — duplicidade identificada com NF 005221",
    contexto: {
      motivo: "Documento duplicado",
    },
    ip: "192.168.1.112",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(48),
  },
  {
    id: "ev_014",
    tipo: "REMOVIDO",
    severidade: "info",
    ator: ATORES.joana,
    entidade: {
      tipo: "questionario",
      id: "q_007",
      titulo: "Questionário rascunho — ciclo 19",
    },
    descricao: "Rascunho de questionário não publicado descartado",
    ip: "192.168.1.110",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(56),
  },

  // ===== Eventos de acesso =====
  {
    id: "ev_015",
    tipo: "ACESSO",
    severidade: "info",
    ator: ATORES.carlos,
    entidade: {
      tipo: "sistema",
      id: "sis_login",
      titulo: "Login bem-sucedido",
    },
    descricao: "Acesso ao sistema realizado com sucesso",
    ip: "10.0.0.42",
    userAgentResumido: "Firefox / Linux",
    ocorreuEm: horasAtras(60),
  },
  {
    id: "ev_016",
    tipo: "ACESSO",
    severidade: "atencao",
    ator: ATORES.joao,
    entidade: {
      tipo: "sistema",
      id: "sis_login",
      titulo: "Falha de autenticação",
    },
    descricao: "Tentativa de login falhou — senha incorreta",
    contexto: {
      tentativas: "1",
    },
    ip: "192.168.1.120",
    userAgentResumido: "Safari / iPhone",
    ocorreuEm: horasAtras(72),
  },
  {
    id: "ev_017",
    tipo: "ACESSO",
    severidade: "info",
    ator: ATORES.roberto,
    entidade: {
      tipo: "sistema",
      id: "sis_login",
      titulo: "Login bem-sucedido",
    },
    descricao: "Acesso ao sistema realizado com sucesso",
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(80),
  },
  {
    id: "ev_018",
    tipo: "ACESSO",
    severidade: "info",
    ator: ATORES.ana,
    entidade: {
      tipo: "sistema",
      id: "sis_login",
      titulo: "Login bem-sucedido",
    },
    descricao: "Acesso ao sistema realizado com sucesso",
    ip: "192.168.1.108",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(88),
  },

  // ===== Eventos de exportação =====
  {
    id: "ev_019",
    tipo: "EXPORTACAO",
    severidade: "info",
    ator: ATORES.roberto,
    entidade: {
      tipo: "orcamento",
      id: "rel_orc_05",
      titulo: "Relatório orçamentário — maio/2026",
    },
    descricao: "Relatório consolidado de execução orçamentária exportado em PDF",
    contexto: {
      formato: "PDF",
      paginas: "32",
    },
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(96),
  },
  {
    id: "ev_020",
    tipo: "EXPORTACAO",
    severidade: "atencao",
    ator: ATORES.mariana,
    entidade: {
      tipo: "contrato",
      id: "rel_ct_lista",
      titulo: "Lista completa de contratos ativos",
    },
    descricao:
      "Exportação de 247 contratos em CSV — volume elevado fora do horário comercial",
    contexto: {
      formato: "CSV",
      registros: "247",
      horario: "20:42",
    },
    ip: "192.168.1.112",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(104),
  },
  {
    id: "ev_021",
    tipo: "EXPORTACAO",
    severidade: "info",
    ator: ATORES.joana,
    entidade: {
      tipo: "acao",
      id: "rel_acoes_q2",
      titulo: "Relatório de ações — Q2/2026",
    },
    descricao: "Relatório trimestral de ações exportado em formato Excel",
    contexto: {
      formato: "XLSX",
    },
    ip: "192.168.1.110",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(120),
  },

  // ===== Eventos de permissão =====
  {
    id: "ev_022",
    tipo: "PERMISSAO",
    severidade: "atencao",
    ator: ATORES.roberto,
    entidade: {
      tipo: "usuario",
      id: "u_007",
      titulo: "Marina C. — Auditora",
    },
    descricao: "Permissão de exportação de dados sensíveis revogada",
    contexto: {
      permissao: "EXPORT_SENSITIVE",
      acao: "revogacao",
    },
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(128),
  },
  {
    id: "ev_023",
    tipo: "PERMISSAO",
    severidade: "info",
    ator: ATORES.roberto,
    entidade: {
      tipo: "usuario",
      id: "u_004",
      titulo: "Ana P. — Assist. Social",
    },
    descricao: "Permissão de leitura de orçamento da Saúde concedida",
    contexto: {
      permissao: "READ_ORCAMENTO_SAUDE",
      acao: "concessao",
    },
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(136),
  },

  // ===== Eventos de configuração =====
  {
    id: "ev_024",
    tipo: "CONFIGURACAO",
    severidade: "atencao",
    ator: ATORES.roberto,
    entidade: {
      tipo: "sistema",
      id: "sis_cfg_alertas",
      titulo: "Parâmetros de alertas críticos",
    },
    descricao:
      "Limite de alerta de divergência físico-financeiro alterado de 10% para 20%",
    contexto: {
      parametro: "limite_divergencia",
      valor_anterior: "10",
      valor_novo: "20",
    },
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(144),
  },
  {
    id: "ev_025",
    tipo: "CONFIGURACAO",
    severidade: "info",
    ator: ATORES.roberto,
    entidade: {
      tipo: "sistema",
      id: "sis_cfg_email",
      titulo: "Notificações por e-mail",
    },
    descricao: "Notificações de questionários pendentes ativadas no sistema",
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(160),
  },
  {
    id: "ev_026",
    tipo: "CONFIGURACAO",
    severidade: "info",
    ator: ATORES.roberto,
    entidade: {
      tipo: "sistema",
      id: "sis_cfg_ciclo",
      titulo: "Periodicidade dos ciclos",
    },
    descricao: "Periodicidade do ciclo de fiscalização ajustada para semanal",
    contexto: {
      parametro: "periodicidade_ciclo",
      valor_anterior: "quinzenal",
      valor_novo: "semanal",
    },
    ip: "192.168.1.105",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(176),
  },

  // ===== Mais eventos variados =====
  {
    id: "ev_027",
    tipo: "ALTERADO",
    severidade: "info",
    ator: ATORES.joao,
    entidade: {
      tipo: "acao",
      id: "a_004",
      titulo: "Vacinação Influenza 2026",
    },
    descricao: "Meta de doses aplicadas atualizada de 4.200 para 5.000",
    contexto: {
      meta_anterior: "4200",
      meta_nova: "5000",
    },
    ip: "192.168.1.120",
    userAgentResumido: "Safari / iPhone",
    ocorreuEm: horasAtras(196),
  },
  {
    id: "ev_028",
    tipo: "CRIADO",
    severidade: "info",
    ator: ATORES.mariana,
    entidade: {
      tipo: "contrato",
      id: "ct_2026_018",
      titulo: "Contrato 2026/018 — Materiais escolares",
    },
    descricao: "Novo contrato cadastrado no sistema após assinatura",
    ip: "192.168.1.112",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(220),
  },
  {
    id: "ev_029",
    tipo: "EXPORTACAO",
    severidade: "info",
    ator: ATORES.ana,
    entidade: {
      tipo: "acao",
      id: "rel_acoes_social",
      titulo: "Relatório de ações sociais",
    },
    descricao: "Relatório de ações da Assistência Social exportado em PDF",
    contexto: {
      formato: "PDF",
    },
    ip: "192.168.1.108",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(244),
  },
  {
    id: "ev_030",
    tipo: "ACESSO",
    severidade: "info",
    ator: ATORES.joana,
    entidade: {
      tipo: "sistema",
      id: "sis_login",
      titulo: "Login bem-sucedido",
    },
    descricao: "Acesso ao sistema realizado com sucesso",
    ip: "192.168.1.110",
    userAgentResumido: "Chrome 120 / Windows",
    ocorreuEm: horasAtras(268),
  },
];

// ============== EVOLUÇÃO DIÁRIA (14 dias) ==============

export const EVOLUCAO_AUDITORIA_MOCK: EvolucaoDiaria[] = [
  { dia: "13/05", eventos: 28 },
  { dia: "14/05", eventos: 34 },
  { dia: "15/05", eventos: 41 },
  { dia: "16/05", eventos: 19 },
  { dia: "17/05", eventos: 12 },
  { dia: "18/05", eventos: 38 },
  { dia: "19/05", eventos: 45 },
  { dia: "20/05", eventos: 52 },
  { dia: "21/05", eventos: 48 },
  { dia: "22/05", eventos: 39 },
  { dia: "23/05", eventos: 22 },
  { dia: "24/05", eventos: 18 },
  { dia: "25/05", eventos: 44 },
  { dia: "26/05", eventos: 51 },
];
