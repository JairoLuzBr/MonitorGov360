/**
 * Mock data e tipos do módulo de Execução Orçamentária.
 *
 * Domínio orçamentário brasileiro:
 *   Dotação -> Empenho -> Liquidação -> Pagamento
 */

export type FuncaoOrcamentaria =
  | "Saúde"
  | "Educação"
  | "Obras"
  | "Assistência Social"
  | "Administração"
  | "Segurança";

export type StatusEmpenho = "ativo" | "liquidado" | "pago" | "anulado";

export interface Dotacao {
  id: string;
  /** Código orçamentário (ex: "10.301.0001.2001") */
  codigo: string;
  funcao: FuncaoOrcamentaria;
  elemento: string;
  valorDotacao: number;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
  acaoVinculada?: string;
}

export interface Empenho {
  id: string;
  /** Número do empenho (ex: "2026NE00123") */
  numero: string;
  data: string;
  dotacaoCodigo: string;
  fornecedor: string;
  /** CNPJ formatado (00.000.000/0000-00) */
  cnpj: string;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
  status: StatusEmpenho;
  acaoVinculada?: string;
}

export interface EvolucaoMensal {
  mes: string;
  empenhado: number;
  liquidado: number;
  pago: number;
}

/** Formata valor monetário em Real Brasileiro: "R$ 1.234.567,89". */
export function formatBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

// ====================================================================
// DOTAÇÕES
// ====================================================================

export const DOTACOES_MOCK: Dotacao[] = [
  {
    id: "dot-001",
    codigo: "10.301.0001.2001",
    funcao: "Saúde",
    elemento: "3.3.90.39 - Outros Serv. Terceiros PJ",
    valorDotacao: 12_500_000,
    valorEmpenhado: 9_800_000,
    valorLiquidado: 7_200_000,
    valorPago: 6_450_000,
    acaoVinculada: "Reforma UBS Jardim Esperança",
  },
  {
    id: "dot-002",
    codigo: "12.361.0002.2010",
    funcao: "Educação",
    elemento: "3.3.90.30 - Material de Consumo",
    valorDotacao: 8_750_000,
    valorEmpenhado: 7_100_000,
    valorLiquidado: 5_900_000,
    valorPago: 5_400_000,
    acaoVinculada: "Merenda Escolar 2026",
  },
  {
    id: "dot-003",
    codigo: "15.451.0003.1005",
    funcao: "Obras",
    elemento: "4.4.90.51 - Obras e Instalações",
    valorDotacao: 22_300_000,
    valorEmpenhado: 18_750_000,
    valorLiquidado: 11_200_000,
    valorPago: 9_800_000,
    acaoVinculada: "Pavimentação Av. Central",
  },
  {
    id: "dot-004",
    codigo: "08.244.0004.2020",
    funcao: "Assistência Social",
    elemento: "3.3.90.32 - Material Distribuição Gratuita",
    valorDotacao: 4_200_000,
    valorEmpenhado: 3_650_000,
    valorLiquidado: 3_100_000,
    valorPago: 2_900_000,
    acaoVinculada: "Cesta Básica Famílias Vulneráveis",
  },
  {
    id: "dot-005",
    codigo: "10.302.0001.2003",
    funcao: "Saúde",
    elemento: "4.4.90.52 - Equipamentos e Mat. Permanente",
    valorDotacao: 6_800_000,
    valorEmpenhado: 4_900_000,
    valorLiquidado: 2_300_000,
    valorPago: 1_950_000,
    acaoVinculada: "Aquisição Equipamentos Hospital Municipal",
  },
  {
    id: "dot-006",
    codigo: "12.365.0002.2015",
    funcao: "Educação",
    elemento: "4.4.90.51 - Obras e Instalações",
    valorDotacao: 9_500_000,
    valorEmpenhado: 6_200_000,
    valorLiquidado: 3_800_000,
    valorPago: 3_200_000,
    acaoVinculada: "Construção CMEI Bairro Novo Horizonte",
  },
  {
    id: "dot-007",
    codigo: "04.122.0005.2025",
    funcao: "Administração",
    elemento: "3.3.90.40 - Serv. Tecnologia da Informação",
    valorDotacao: 3_400_000,
    valorEmpenhado: 2_850_000,
    valorLiquidado: 2_100_000,
    valorPago: 1_900_000,
    acaoVinculada: "Modernização Tecnológica Prefeitura",
  },
  {
    id: "dot-008",
    codigo: "15.452.0003.2030",
    funcao: "Obras",
    elemento: "3.3.90.39 - Outros Serv. Terceiros PJ",
    valorDotacao: 5_600_000,
    valorEmpenhado: 4_100_000,
    valorLiquidado: 2_800_000,
    valorPago: 2_500_000,
    acaoVinculada: "Manutenção Iluminação Pública",
  },
];

// ====================================================================
// EMPENHOS
// ====================================================================

export const EMPENHOS_MOCK: Empenho[] = [
  {
    id: "emp-001",
    numero: "2026NE00098",
    data: "2026-01-12",
    dotacaoCodigo: "15.451.0003.1005",
    fornecedor: "Construtora Horizonte Ltda.",
    cnpj: "12.345.678/0001-90",
    valorEmpenhado: 4_500_000,
    valorLiquidado: 1_200_000,
    valorPago: 1_200_000,
    status: "ativo",
    acaoVinculada: "Pavimentação Av. Central",
  },
  {
    id: "emp-002",
    numero: "2026NE00112",
    data: "2026-01-22",
    dotacaoCodigo: "10.301.0001.2001",
    fornecedor: "Saúde & Serviços Médicos S.A.",
    cnpj: "23.456.789/0001-12",
    valorEmpenhado: 2_800_000,
    valorLiquidado: 2_800_000,
    valorPago: 2_500_000,
    status: "liquidado",
    acaoVinculada: "Reforma UBS Jardim Esperança",
  },
  {
    id: "emp-003",
    numero: "2026NE00123",
    data: "2026-02-05",
    dotacaoCodigo: "12.361.0002.2010",
    fornecedor: "Alimentos Escolares Brasil Ltda.",
    cnpj: "34.567.890/0001-45",
    valorEmpenhado: 1_950_000,
    valorLiquidado: 1_950_000,
    valorPago: 1_950_000,
    status: "pago",
    acaoVinculada: "Merenda Escolar 2026",
  },
  {
    id: "emp-004",
    numero: "2026NE00134",
    data: "2026-02-14",
    dotacaoCodigo: "08.244.0004.2020",
    fornecedor: "Distribuidora Solidária Ltda.",
    cnpj: "45.678.901/0001-78",
    valorEmpenhado: 1_200_000,
    valorLiquidado: 1_100_000,
    valorPago: 1_000_000,
    status: "liquidado",
    acaoVinculada: "Cesta Básica Famílias Vulneráveis",
  },
  {
    id: "emp-005",
    numero: "2026NE00156",
    data: "2026-02-28",
    dotacaoCodigo: "10.302.0001.2003",
    fornecedor: "MedTech Equipamentos Hospitalares S.A.",
    cnpj: "56.789.012/0001-23",
    valorEmpenhado: 1_850_000,
    valorLiquidado: 0,
    valorPago: 0,
    status: "ativo",
    acaoVinculada: "Aquisição Equipamentos Hospital Municipal",
  },
  {
    id: "emp-006",
    numero: "2026NE00178",
    data: "2026-03-08",
    dotacaoCodigo: "12.365.0002.2015",
    fornecedor: "Edificações Modernas Ltda.",
    cnpj: "67.890.123/0001-56",
    valorEmpenhado: 3_100_000,
    valorLiquidado: 1_900_000,
    valorPago: 1_600_000,
    status: "ativo",
    acaoVinculada: "Construção CMEI Bairro Novo Horizonte",
  },
  {
    id: "emp-007",
    numero: "2026NE00189",
    data: "2026-03-17",
    dotacaoCodigo: "04.122.0005.2025",
    fornecedor: "TechGov Soluções em TI Ltda.",
    cnpj: "78.901.234/0001-89",
    valorEmpenhado: 1_450_000,
    valorLiquidado: 1_450_000,
    valorPago: 1_450_000,
    status: "pago",
    acaoVinculada: "Modernização Tecnológica Prefeitura",
  },
  {
    id: "emp-008",
    numero: "2026NE00201",
    data: "2026-03-25",
    dotacaoCodigo: "15.452.0003.2030",
    fornecedor: "Iluminação Pública Brasil Ltda.",
    cnpj: "89.012.345/0001-34",
    valorEmpenhado: 850_000,
    valorLiquidado: 600_000,
    valorPago: 500_000,
    status: "liquidado",
    acaoVinculada: "Manutenção Iluminação Pública",
  },
  {
    id: "emp-009",
    numero: "2026NE00215",
    data: "2026-04-03",
    dotacaoCodigo: "10.301.0001.2001",
    fornecedor: "Clinmed Assistência Médica Ltda.",
    cnpj: "90.123.456/0001-67",
    valorEmpenhado: 1_650_000,
    valorLiquidado: 950_000,
    valorPago: 800_000,
    status: "ativo",
    acaoVinculada: "Reforma UBS Jardim Esperança",
  },
  {
    id: "emp-010",
    numero: "2026NE00228",
    data: "2026-04-15",
    dotacaoCodigo: "12.361.0002.2010",
    fornecedor: "Nutri Alimentos S.A.",
    cnpj: "11.222.333/0001-44",
    valorEmpenhado: 2_300_000,
    valorLiquidado: 2_300_000,
    valorPago: 2_100_000,
    status: "liquidado",
    acaoVinculada: "Merenda Escolar 2026",
  },
  {
    id: "emp-011",
    numero: "2026NE00241",
    data: "2026-04-28",
    dotacaoCodigo: "15.451.0003.1005",
    fornecedor: "Engenharia Vias Pavimentação Ltda.",
    cnpj: "22.333.444/0001-55",
    valorEmpenhado: 5_200_000,
    valorLiquidado: 3_400_000,
    valorPago: 2_900_000,
    status: "ativo",
    acaoVinculada: "Pavimentação Av. Central",
  },
  {
    id: "emp-012",
    numero: "2026NE00256",
    data: "2026-05-09",
    dotacaoCodigo: "10.302.0001.2003",
    fornecedor: "Hospital Tech Equipamentos Ltda.",
    cnpj: "33.444.555/0001-66",
    valorEmpenhado: 2_100_000,
    valorLiquidado: 1_400_000,
    valorPago: 1_200_000,
    status: "ativo",
    acaoVinculada: "Aquisição Equipamentos Hospital Municipal",
  },
  {
    id: "emp-013",
    numero: "2026NE00271",
    data: "2026-05-18",
    dotacaoCodigo: "04.122.0005.2025",
    fornecedor: "Sistemas Inovadores Ltda.",
    cnpj: "44.555.666/0001-77",
    valorEmpenhado: 720_000,
    valorLiquidado: 0,
    valorPago: 0,
    status: "anulado",
    acaoVinculada: "Modernização Tecnológica Prefeitura",
  },
  {
    id: "emp-014",
    numero: "2026NE00285",
    data: "2026-05-27",
    dotacaoCodigo: "08.244.0004.2020",
    fornecedor: "Alimentos Solidariedade Ltda.",
    cnpj: "55.666.777/0001-88",
    valorEmpenhado: 1_350_000,
    valorLiquidado: 1_350_000,
    valorPago: 1_350_000,
    status: "pago",
    acaoVinculada: "Cesta Básica Famílias Vulneráveis",
  },
  {
    id: "emp-015",
    numero: "2026NE00299",
    data: "2026-06-04",
    dotacaoCodigo: "12.365.0002.2015",
    fornecedor: "Construções Educacionais S.A.",
    cnpj: "66.777.888/0001-99",
    valorEmpenhado: 2_400_000,
    valorLiquidado: 980_000,
    valorPago: 780_000,
    status: "ativo",
    acaoVinculada: "Construção CMEI Bairro Novo Horizonte",
  },
];

// ====================================================================
// EVOLUÇÃO MENSAL (Jan a Jun/2026)
// ====================================================================

export const EVOLUCAO_MOCK: EvolucaoMensal[] = [
  { mes: "Jan/26",  empenhado: 8_750_000,  liquidado: 5_100_000,  pago: 4_600_000 },
  { mes: "Fev/26",  empenhado: 12_400_000, liquidado: 8_300_000,  pago: 7_200_000 },
  { mes: "Mar/26",  empenhado: 18_900_000, liquidado: 13_800_000, pago: 12_100_000 },
  { mes: "Abr/26",  empenhado: 25_600_000, liquidado: 19_400_000, pago: 17_500_000 },
  { mes: "Mai/26",  empenhado: 33_200_000, liquidado: 26_700_000, pago: 23_900_000 },
  { mes: "Jun/26",  empenhado: 39_750_000, liquidado: 32_500_000, pago: 28_950_000 },
];
