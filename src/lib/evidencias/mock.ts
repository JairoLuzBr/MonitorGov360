/**
 * Tipos e dados mockados para a feature de Evidências.
 * Cada evidência é vinculada a uma ação governamental.
 */

export type TipoEvidencia = "foto" | "documento" | "link" | "video";

export const TIPOS_EVIDENCIA_LABELS: Record<TipoEvidencia, string> = {
  foto: "Foto",
  documento: "Documento",
  link: "Link",
  video: "Vídeo",
};

export interface ArquivoEvidencia {
  nome: string;
  tamanhoKb: number;
  url: string;
  mimeType: string;
}

export interface GeolocalizacaoEvidencia {
  lat: number;
  lng: number;
  endereco: string;
}

export interface Evidencia {
  id: string;
  acaoId: string;
  acaoTitulo: string;
  tipo: TipoEvidencia;
  arquivo: ArquivoEvidencia;
  geolocalizacao?: GeolocalizacaoEvidencia;
  descricao: string;
  autor: string;
  dataUpload: Date;
  ciclo?: string;
}

const diasAtras = (dias: number): Date =>
  new Date(Date.now() - 1000 * 60 * 60 * 24 * dias);

export const EVIDENCIAS_MOCK: Evidencia[] = [
  {
    id: "ev_001",
    acaoId: "a_001",
    acaoTitulo: "Pavimentação Av. Central",
    tipo: "foto",
    arquivo: {
      nome: "obra_avcentral_frente.jpg",
      tamanhoKb: 2340,
      url: "/mock/evidencias/foto1.jpg",
      mimeType: "image/jpeg",
    },
    geolocalizacao: {
      lat: -23.5505,
      lng: -46.6333,
      endereco: "Av. Central, 1200 — Centro",
    },
    descricao: "Frente de obra na altura do número 1200, asfalto recém-aplicado",
    autor: "Carlos M. — Eng. Civil",
    dataUpload: diasAtras(0),
    ciclo: "Semana 21/2026",
  },
  {
    id: "ev_002",
    acaoId: "a_001",
    acaoTitulo: "Pavimentação Av. Central",
    tipo: "foto",
    arquivo: {
      nome: "obra_avcentral_lateral.jpg",
      tamanhoKb: 1980,
      url: "/mock/evidencias/foto2.jpg",
      mimeType: "image/jpeg",
    },
    geolocalizacao: {
      lat: -23.5510,
      lng: -46.6340,
      endereco: "Av. Central, 1300 — Centro",
    },
    descricao: "Compactação do solo concluída no trecho lateral",
    autor: "Carlos M. — Eng. Civil",
    dataUpload: diasAtras(1),
    ciclo: "Semana 21/2026",
  },
  {
    id: "ev_003",
    acaoId: "a_002",
    acaoTitulo: "Reforma UBS Jardim Esperança",
    tipo: "documento",
    arquivo: {
      nome: "medicao_03_ubs_jardim.pdf",
      tamanhoKb: 1542,
      url: "/mock/evidencias/medicao03.pdf",
      mimeType: "application/pdf",
    },
    descricao: "Medição parcial nº 03 — etapa de pintura e revestimento",
    autor: "Carlos M. — Eng. Civil",
    dataUpload: diasAtras(2),
    ciclo: "Semana 20/2026",
  },
  {
    id: "ev_004",
    acaoId: "a_002",
    acaoTitulo: "Reforma UBS Jardim Esperança",
    tipo: "foto",
    arquivo: {
      nome: "ubs_recepcao.jpg",
      tamanhoKb: 2100,
      url: "/mock/evidencias/foto3.jpg",
      mimeType: "image/jpeg",
    },
    geolocalizacao: {
      lat: -23.5613,
      lng: -46.6450,
      endereco: "Rua das Flores, 45 — Jardim Esperança",
    },
    descricao: "Recepção da UBS após reforma — piso e pintura finalizados",
    autor: "Ana P. — Assist. Social",
    dataUpload: diasAtras(3),
    ciclo: "Semana 20/2026",
  },
  {
    id: "ev_005",
    acaoId: "a_003",
    acaoTitulo: "Programa Bolsa Família Municipal",
    tipo: "documento",
    arquivo: {
      nome: "relatorio_beneficiarios_maio.pdf",
      tamanhoKb: 3420,
      url: "/mock/evidencias/relatorio.pdf",
      mimeType: "application/pdf",
    },
    descricao: "Relatório mensal consolidado de beneficiários atendidos em maio/2026",
    autor: "Ana P. — Assist. Social",
    dataUpload: diasAtras(5),
    ciclo: "Maio/2026",
  },
  {
    id: "ev_006",
    acaoId: "a_003",
    acaoTitulo: "Programa Bolsa Família Municipal",
    tipo: "link",
    arquivo: {
      nome: "Portal de Transparência — Bolsa Família",
      tamanhoKb: 0,
      url: "https://transparencia.municipio.gov.br/bolsa-familia/2026-05",
      mimeType: "text/uri-list",
    },
    descricao: "Link público para os dados completos do programa no mês de referência",
    autor: "Ana P. — Assist. Social",
    dataUpload: diasAtras(5),
    ciclo: "Maio/2026",
  },
  {
    id: "ev_007",
    acaoId: "a_004",
    acaoTitulo: "Vacinação Influenza 2026",
    tipo: "foto",
    arquivo: {
      nome: "vacinacao_idosos.jpg",
      tamanhoKb: 1860,
      url: "/mock/evidencias/foto4.jpg",
      mimeType: "image/jpeg",
    },
    geolocalizacao: {
      lat: -23.5489,
      lng: -46.6388,
      endereco: "UBS Central — Sala 02",
    },
    descricao: "Campanha de vacinação contra influenza atendendo público idoso",
    autor: "Dr. João S. — Enfermeiro",
    dataUpload: diasAtras(6),
    ciclo: "Quinzena 10/2026",
  },
  {
    id: "ev_008",
    acaoId: "a_004",
    acaoTitulo: "Vacinação Influenza 2026",
    tipo: "video",
    arquivo: {
      nome: "campanha_vacinacao.mp4",
      tamanhoKb: 18420,
      url: "/mock/evidencias/video1.mp4",
      mimeType: "video/mp4",
    },
    descricao: "Vídeo institucional registrando a campanha em três postos de saúde",
    autor: "Dr. João S. — Enfermeiro",
    dataUpload: diasAtras(7),
    ciclo: "Quinzena 10/2026",
  },
  {
    id: "ev_009",
    acaoId: "a_005",
    acaoTitulo: "Aquisição de Merenda Escolar",
    tipo: "documento",
    arquivo: {
      nome: "nf_merenda_005221.pdf",
      tamanhoKb: 980,
      url: "/mock/evidencias/nota.pdf",
      mimeType: "application/pdf",
    },
    descricao: "Nota fiscal 005221 do fornecedor — entrega de hortifrúti",
    autor: "Mariana L. — Compras",
    dataUpload: diasAtras(8),
    ciclo: "Maio/2026",
  },
  {
    id: "ev_010",
    acaoId: "a_005",
    acaoTitulo: "Aquisição de Merenda Escolar",
    tipo: "foto",
    arquivo: {
      nome: "entrega_escola_central.jpg",
      tamanhoKb: 2210,
      url: "/mock/evidencias/foto5.jpg",
      mimeType: "image/jpeg",
    },
    geolocalizacao: {
      lat: -23.5572,
      lng: -46.6400,
      endereco: "EMEF Central — Rua Escola, 100",
    },
    descricao: "Recebimento dos itens na Escola Municipal Central",
    autor: "Mariana L. — Compras",
    dataUpload: diasAtras(9),
    ciclo: "Maio/2026",
  },
  {
    id: "ev_011",
    acaoId: "a_006",
    acaoTitulo: "Capacitação de Servidores em LGPD",
    tipo: "link",
    arquivo: {
      nome: "Gravação do treinamento — YouTube",
      tamanhoKb: 0,
      url: "https://youtube.com/watch?v=mock-lgpd-2026",
      mimeType: "text/uri-list",
    },
    descricao: "Gravação completa da capacitação ministrada em 18/05/2026",
    autor: "RH Municipal",
    dataUpload: diasAtras(10),
    ciclo: "Maio/2026",
  },
  {
    id: "ev_012",
    acaoId: "a_006",
    acaoTitulo: "Capacitação de Servidores em LGPD",
    tipo: "documento",
    arquivo: {
      nome: "lista_presenca_lgpd.pdf",
      tamanhoKb: 640,
      url: "/mock/evidencias/lista.pdf",
      mimeType: "application/pdf",
    },
    descricao: "Lista de presença assinada — 47 servidores participantes",
    autor: "RH Municipal",
    dataUpload: diasAtras(11),
    ciclo: "Maio/2026",
  },
];
