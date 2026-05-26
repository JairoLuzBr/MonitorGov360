/**
 * Tipos e dados mockados para o Sistema de Alertas Avançado.
 * Alertas são gerados por regras automáticas sobre as ações governamentais
 * e seguem fluxo de providências, escalonamento e resolução.
 */

export type TipoAlerta =
  | "obra_paralisada"
  | "questionario_atrasado"
  | "divergencia_fisico_financeira"
  | "documentacao_ausente"
  | "empenho_sem_liquidacao"
  | "alteracao_sensivel"
  | "acesso_anomalo";

export type Severidade = "critico" | "atencao" | "info";

export type StatusAlerta = "aberto" | "em_andamento" | "resolvido" | "descartado";

export type Escalonamento = "gestor" | "secretario" | "prefeito";

export interface Providencia {
  id: string;
  autor: string;
  data: Date;
  descricao: string;
  anexos?: string[];
}

export interface AcaoVinculada {
  id: string;
  titulo: string;
}

export interface Alerta {
  id: string;
  severidade: Severidade;
  status: StatusAlerta;
  tipo: TipoAlerta;
  titulo: string;
  descricao: string;
  acaoVinculada: AcaoVinculada;
  criadoEm: Date;
  prazoResolucao?: Date;
  escalonamento: Escalonamento;
  regraDispara: string;
  providencias: Providencia[];
}

export const TIPO_ALERTA_LABELS: Record<TipoAlerta, string> = {
  obra_paralisada: "Obra paralisada",
  questionario_atrasado: "Questionário em atraso",
  divergencia_fisico_financeira: "Divergência físico-financeira",
  documentacao_ausente: "Documentação ausente",
  empenho_sem_liquidacao: "Empenho sem liquidação",
  alteracao_sensivel: "Alteração sensível",
  acesso_anomalo: "Acesso anômalo",
};

export const STATUS_ALERTA_LABELS: Record<StatusAlerta, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  descartado: "Descartado",
};

export const ESCALONAMENTO_LABELS: Record<Escalonamento, string> = {
  gestor: "Gestor",
  secretario: "Secretário",
  prefeito: "Prefeito",
};

export interface SeveridadeConfigItem {
  label: string;
  badge: string;
  iconClasses: string;
  icon: "AlertTriangle" | "Clock" | "Info";
}

export const SEVERIDADE_CONFIG: Record<Severidade, SeveridadeConfigItem> = {
  critico: {
    label: "Crítico",
    badge: "bg-red-100 text-red-700 border-red-200",
    iconClasses: "bg-red-50 text-red-600 border-red-200",
    icon: "AlertTriangle",
  },
  atencao: {
    label: "Atenção",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    iconClasses: "bg-amber-50 text-amber-600 border-amber-200",
    icon: "Clock",
  },
  info: {
    label: "Informativo",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    iconClasses: "bg-blue-50 text-blue-600 border-blue-200",
    icon: "Info",
  },
};

const diasAtras = (dias: number): Date =>
  new Date(Date.now() - 1000 * 60 * 60 * 24 * dias);

const diasAFrente = (dias: number): Date =>
  new Date(Date.now() + 1000 * 60 * 60 * 24 * dias);

export const ALERTAS_MOCK: Alerta[] = [
  {
    id: "al_001",
    severidade: "critico",
    status: "aberto",
    tipo: "obra_paralisada",
    titulo: "Obra paralisada há 22 dias sem atualização",
    descricao:
      "A frente de pavimentação não recebe novas medições nem evidências desde 04/05. Verificar com fiscalização e contratada.",
    acaoVinculada: { id: "a_001", titulo: "Pavimentação Av. Central" },
    criadoEm: diasAtras(2),
    prazoResolucao: diasAFrente(3),
    escalonamento: "secretario",
    regraDispara:
      "Sem registro de evidência por mais de 15 dias em obra com status 'em execução'.",
    providencias: [
      {
        id: "p_001",
        autor: "Carlos M. — Eng. Civil",
        data: diasAtras(1),
        descricao:
          "Acionei o engenheiro responsável e o gerente da contratada por e-mail solicitando justificativa formal em até 48h.",
        anexos: ["email_notificacao_001.pdf"],
      },
      {
        id: "p_002",
        autor: "Carlos M. — Eng. Civil",
        data: diasAtras(0),
        descricao:
          "Visita técnica realizada no canteiro. Equipamentos parados; ausência de equipe. Foto registrada em campo.",
        anexos: ["visita_tecnica_22-05.jpg", "termo_visita.pdf"],
      },
    ],
  },
  {
    id: "al_002",
    severidade: "critico",
    status: "em_andamento",
    tipo: "questionario_atrasado",
    titulo: "Questionário semanal vencido há 5 dias",
    descricao:
      "O ciclo semanal 19/2026 do questionário de execução não foi respondido até a data limite.",
    acaoVinculada: { id: "a_002", titulo: "Reforma UBS Jardim Esperança" },
    criadoEm: diasAtras(5),
    prazoResolucao: diasAFrente(1),
    escalonamento: "gestor",
    regraDispara: "Questionário cíclico não respondido após o prazoFim.",
    providencias: [
      {
        id: "p_003",
        autor: "Ana P. — Assist. Social",
        data: diasAtras(3),
        descricao:
          "Notificação enviada ao responsável técnico. Confirmação de leitura recebida no mesmo dia.",
      },
      {
        id: "p_004",
        autor: "Ana P. — Assist. Social",
        data: diasAtras(1),
        descricao:
          "Responsável iniciou o preenchimento; pendente apenas a sessão de evidências fotográficas.",
      },
    ],
  },
  {
    id: "al_003",
    severidade: "atencao",
    status: "aberto",
    tipo: "divergencia_fisico_financeira",
    titulo: "Execução física 38% × financeira 71%",
    descricao:
      "Distorção acima do limite tolerado (20pp) entre avanço físico medido em campo e desembolso financeiro acumulado.",
    acaoVinculada: { id: "a_001", titulo: "Pavimentação Av. Central" },
    criadoEm: diasAtras(4),
    prazoResolucao: diasAFrente(7),
    escalonamento: "gestor",
    regraDispara:
      "Diferença absoluta entre % físico e % financeiro maior que 20 pontos percentuais.",
    providencias: [],
  },
  {
    id: "al_004",
    severidade: "atencao",
    status: "aberto",
    tipo: "documentacao_ausente",
    titulo: "Ação sem evidência registrada há 12 dias",
    descricao:
      "O programa não possui nenhuma evidência (foto, documento, link ou vídeo) anexada no ciclo atual.",
    acaoVinculada: { id: "a_003", titulo: "Programa Bolsa Família Municipal" },
    criadoEm: diasAtras(1),
    prazoResolucao: diasAFrente(5),
    escalonamento: "gestor",
    regraDispara:
      "Sem nova evidência por mais de 10 dias em ação com periodicidade quinzenal.",
    providencias: [],
  },
  {
    id: "al_005",
    severidade: "critico",
    status: "aberto",
    tipo: "empenho_sem_liquidacao",
    titulo: "Empenho de R$ 320.500,00 sem liquidação há 67 dias",
    descricao:
      "Nota de empenho 2026NE000412 emitida em março ainda não recebeu nenhuma liquidação parcial.",
    acaoVinculada: {
      id: "a_005",
      titulo: "Aquisição de Merenda Escolar",
    },
    criadoEm: diasAtras(3),
    prazoResolucao: diasAFrente(10),
    escalonamento: "secretario",
    regraDispara: "Empenho ativo sem liquidação por mais de 60 dias.",
    providencias: [
      {
        id: "p_005",
        autor: "Mariana L. — Compras",
        data: diasAtras(2),
        descricao:
          "Solicitei à contabilidade o relatório de movimentação do empenho. Aguardando devolutiva.",
        anexos: ["solicitacao_contabilidade.pdf"],
      },
    ],
  },
  {
    id: "al_006",
    severidade: "atencao",
    status: "em_andamento",
    tipo: "alteracao_sensivel",
    titulo: "Valor contratado alterado em +18%",
    descricao:
      "O valor total da ação foi reajustado por aditivo. Conferir aderência ao limite legal e justificativa.",
    acaoVinculada: { id: "a_002", titulo: "Reforma UBS Jardim Esperança" },
    criadoEm: diasAtras(7),
    prazoResolucao: diasAFrente(2),
    escalonamento: "gestor",
    regraDispara: "Alteração de valor contratado acima de 10% em ação ativa.",
    providencias: [
      {
        id: "p_006",
        autor: "Beatriz R. — Jurídico",
        data: diasAtras(6),
        descricao:
          "Parecer jurídico solicitado ao setor responsável para avaliar aderência ao art. 65 da Lei 8.666/93.",
      },
      {
        id: "p_007",
        autor: "Beatriz R. — Jurídico",
        data: diasAtras(2),
        descricao:
          "Parecer concluído: aditivo dentro do limite legal de 25%. Aguardando publicação no diário oficial.",
        anexos: ["parecer_juridico_018-2026.pdf"],
      },
    ],
  },
  {
    id: "al_007",
    severidade: "info",
    status: "aberto",
    tipo: "acesso_anomalo",
    titulo: "Acesso fora do horário comercial",
    descricao:
      "Usuário com perfil de gestor acessou o sistema às 02:14 a partir de IP não usual.",
    acaoVinculada: { id: "a_004", titulo: "Vacinação Influenza 2026" },
    criadoEm: diasAtras(0),
    escalonamento: "gestor",
    regraDispara:
      "Login entre 22h e 06h em IP diferente dos últimos 30 dias para perfis sensíveis.",
    providencias: [],
  },
  {
    id: "al_008",
    severidade: "info",
    status: "aberto",
    tipo: "documentacao_ausente",
    titulo: "Termo de recebimento pendente",
    descricao:
      "Entrega registrada em 18/05 ainda não possui termo de recebimento definitivo anexado.",
    acaoVinculada: {
      id: "a_005",
      titulo: "Aquisição de Merenda Escolar",
    },
    criadoEm: diasAtras(6),
    prazoResolucao: diasAFrente(4),
    escalonamento: "gestor",
    regraDispara: "Entrega sem termo de recebimento por mais de 7 dias úteis.",
    providencias: [],
  },
  {
    id: "al_009",
    severidade: "atencao",
    status: "resolvido",
    tipo: "obra_paralisada",
    titulo: "Atraso pontual na frente lateral",
    descricao:
      "Trecho lateral ficou sem registro por 16 dias devido a chuvas intensas. Retomada confirmada.",
    acaoVinculada: { id: "a_001", titulo: "Pavimentação Av. Central" },
    criadoEm: diasAtras(18),
    prazoResolucao: diasAtras(5),
    escalonamento: "gestor",
    regraDispara:
      "Sem registro de evidência por mais de 15 dias em obra com status 'em execução'.",
    providencias: [
      {
        id: "p_008",
        autor: "Carlos M. — Eng. Civil",
        data: diasAtras(12),
        descricao:
          "Justificativa formal recebida da contratada citando intempéries climáticas (boletim INMET anexado).",
        anexos: ["boletim_inmet.pdf", "justificativa_contratada.pdf"],
      },
      {
        id: "p_009",
        autor: "Carlos M. — Eng. Civil",
        data: diasAtras(6),
        descricao:
          "Retomada confirmada com nova medição de campo. Alerta encaminhado para encerramento.",
      },
    ],
  },
  {
    id: "al_010",
    severidade: "critico",
    status: "resolvido",
    tipo: "divergencia_fisico_financeira",
    titulo: "Pagamento à frente da execução em 25pp",
    descricao:
      "Resolvido após retenção do próximo pagamento e revisão de medição.",
    acaoVinculada: { id: "a_002", titulo: "Reforma UBS Jardim Esperança" },
    criadoEm: diasAtras(25),
    prazoResolucao: diasAtras(10),
    escalonamento: "secretario",
    regraDispara:
      "Diferença absoluta entre % físico e % financeiro maior que 20 pontos percentuais.",
    providencias: [
      {
        id: "p_010",
        autor: "Roberto F. — Controle Interno",
        data: diasAtras(22),
        descricao:
          "Próximo pagamento retido para revisão. Notificação à contratada emitida.",
      },
      {
        id: "p_011",
        autor: "Roberto F. — Controle Interno",
        data: diasAtras(15),
        descricao:
          "Nova medição realizada. Avanço físico revisto para 64%, alinhado ao financeiro.",
        anexos: ["medicao_revisao.pdf"],
      },
      {
        id: "p_012",
        autor: "Roberto F. — Controle Interno",
        data: diasAtras(10),
        descricao: "Alerta encerrado após validação final dos números.",
      },
    ],
  },
  {
    id: "al_011",
    severidade: "info",
    status: "descartado",
    tipo: "acesso_anomalo",
    titulo: "Acesso de IP novo identificado",
    descricao:
      "Usuário acessou de novo endereço IP em horário comercial. Justificativa: home office em viagem.",
    acaoVinculada: { id: "a_003", titulo: "Programa Bolsa Família Municipal" },
    criadoEm: diasAtras(8),
    escalonamento: "gestor",
    regraDispara: "Login a partir de IP não cadastrado nos últimos 30 dias.",
    providencias: [
      {
        id: "p_013",
        autor: "Segurança da Informação",
        data: diasAtras(7),
        descricao:
          "Usuário confirmou a sessão por canal oficial e justificou viagem de capacitação. Alerta descartado como falso positivo.",
      },
    ],
  },
  {
    id: "al_012",
    severidade: "atencao",
    status: "aberto",
    tipo: "questionario_atrasado",
    titulo: "Questionário quinzenal vencendo amanhã",
    descricao:
      "Ciclo Quinzena 10/2026 ainda pendente de resposta. Vencimento iminente.",
    acaoVinculada: { id: "a_004", titulo: "Vacinação Influenza 2026" },
    criadoEm: diasAtras(0),
    prazoResolucao: diasAFrente(1),
    escalonamento: "gestor",
    regraDispara:
      "Questionário cíclico com menos de 48h até o prazoFim e status 'pendente'.",
    providencias: [],
  },
];
