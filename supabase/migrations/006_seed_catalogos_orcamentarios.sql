-- =============================================================================
-- MonitorGov360 — Seed dos Catálogos Orçamentários Padrão
-- Migração: 006_seed_catalogos_orcamentarios.sql
-- Descrição: Popula os catálogos globais com a estrutura padrão da LRF / STN.
--   - 28 funções (Portaria MPOG 42/1999)
--   - subfunções mais usadas no nível municipal
--   - naturezas de despesa mais frequentes
--   - fontes de recurso padrão STN
-- =============================================================================

-- =============================================================================
-- 1) Funções da LRF — Portaria MPOG nº 42, de 14/04/1999
-- =============================================================================
INSERT INTO cat_funcoes (codigo, nome) VALUES
  ('01', 'Legislativa'),
  ('02', 'Judiciária'),
  ('03', 'Essencial à Justiça'),
  ('04', 'Administração'),
  ('05', 'Defesa Nacional'),
  ('06', 'Segurança Pública'),
  ('07', 'Relações Exteriores'),
  ('08', 'Assistência Social'),
  ('09', 'Previdência Social'),
  ('10', 'Saúde'),
  ('11', 'Trabalho'),
  ('12', 'Educação'),
  ('13', 'Cultura'),
  ('14', 'Direitos da Cidadania'),
  ('15', 'Urbanismo'),
  ('16', 'Habitação'),
  ('17', 'Saneamento'),
  ('18', 'Gestão Ambiental'),
  ('19', 'Ciência e Tecnologia'),
  ('20', 'Agricultura'),
  ('21', 'Organização Agrária'),
  ('22', 'Indústria'),
  ('23', 'Comércio e Serviços'),
  ('24', 'Comunicações'),
  ('25', 'Energia'),
  ('26', 'Transporte'),
  ('27', 'Desporto e Lazer'),
  ('28', 'Encargos Especiais')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome;

-- =============================================================================
-- 2) Subfunções — subset mais usado em municípios
-- =============================================================================
INSERT INTO cat_subfuncoes (codigo, nome, funcao_codigo) VALUES
  -- Função 01: Legislativa
  ('031', 'Ação Legislativa',                                   '01'),
  ('032', 'Controle Externo',                                   '01'),
  -- Função 04: Administração
  ('121', 'Planejamento e Orçamento',                           '04'),
  ('122', 'Administração Geral',                                '04'),
  ('123', 'Administração Financeira',                           '04'),
  ('124', 'Controle Interno',                                   '04'),
  ('125', 'Normatização e Fiscalização',                        '04'),
  ('126', 'Tecnologia da Informação',                           '04'),
  ('127', 'Ordenamento Territorial',                            '04'),
  ('128', 'Formação de Recursos Humanos',                       '04'),
  ('129', 'Administração de Receitas',                          '04'),
  ('130', 'Administração de Concessões',                        '04'),
  ('131', 'Comunicação Social',                                 '04'),
  -- Função 06: Segurança Pública
  ('181', 'Policiamento',                                       '06'),
  ('182', 'Defesa Civil',                                       '06'),
  ('183', 'Informação e Inteligência',                          '06'),
  -- Função 08: Assistência Social
  ('241', 'Assistência ao Idoso',                               '08'),
  ('242', 'Assistência ao Portador de Deficiência',             '08'),
  ('243', 'Assistência à Criança e ao Adolescente',             '08'),
  ('244', 'Assistência Comunitária',                            '08'),
  -- Função 10: Saúde
  ('301', 'Atenção Básica',                                     '10'),
  ('302', 'Assistência Hospitalar e Ambulatorial',              '10'),
  ('303', 'Suporte Profilático e Terapêutico',                  '10'),
  ('304', 'Vigilância Sanitária',                               '10'),
  ('305', 'Vigilância Epidemiológica',                          '10'),
  ('306', 'Alimentação e Nutrição',                             '10'),
  -- Função 12: Educação
  ('361', 'Ensino Fundamental',                                 '12'),
  ('362', 'Ensino Médio',                                       '12'),
  ('363', 'Ensino Profissional',                                '12'),
  ('364', 'Ensino Superior',                                    '12'),
  ('365', 'Educação Infantil',                                  '12'),
  ('366', 'Educação de Jovens e Adultos',                       '12'),
  ('367', 'Educação Especial',                                  '12'),
  -- Função 13: Cultura
  ('391', 'Patrimônio Histórico, Artístico e Arqueológico',     '13'),
  ('392', 'Difusão Cultural',                                   '13'),
  -- Função 14: Direitos da Cidadania
  ('421', 'Custódia e Reintegração Social',                     '14'),
  ('422', 'Direitos Individuais, Coletivos e Difusos',          '14'),
  ('423', 'Assistência aos Povos Indígenas',                    '14'),
  -- Função 15: Urbanismo
  ('451', 'Infraestrutura Urbana',                              '15'),
  ('452', 'Serviços Urbanos',                                   '15'),
  ('453', 'Transportes Coletivos Urbanos',                      '15'),
  -- Função 16: Habitação
  ('481', 'Habitação Rural',                                    '16'),
  ('482', 'Habitação Urbana',                                   '16'),
  -- Função 17: Saneamento
  ('511', 'Saneamento Básico Rural',                            '17'),
  ('512', 'Saneamento Básico Urbano',                           '17'),
  -- Função 18: Gestão Ambiental
  ('541', 'Preservação e Conservação Ambiental',                '18'),
  ('542', 'Controle Ambiental',                                 '18'),
  ('543', 'Recuperação de Áreas Degradadas',                    '18'),
  ('544', 'Recursos Hídricos',                                  '18'),
  ('545', 'Meteorologia',                                       '18'),
  -- Função 20: Agricultura
  ('601', 'Promoção da Produção Vegetal',                       '20'),
  ('602', 'Promoção da Produção Animal',                        '20'),
  ('603', 'Defesa Sanitária Vegetal',                           '20'),
  ('604', 'Defesa Sanitária Animal',                            '20'),
  ('605', 'Abastecimento',                                      '20'),
  ('606', 'Extensão Rural',                                     '20'),
  -- Função 22: Indústria
  ('661', 'Promoção Industrial',                                '22'),
  ('662', 'Produção Industrial',                                '22'),
  ('663', 'Mineração',                                          '22'),
  -- Função 23: Comércio e Serviços
  ('691', 'Promoção Comercial',                                 '23'),
  ('692', 'Comercialização',                                    '23'),
  ('693', 'Comércio Exterior',                                  '23'),
  ('694', 'Serviços Financeiros',                               '23'),
  ('695', 'Turismo',                                            '23'),
  -- Função 26: Transporte
  ('781', 'Transporte Aéreo',                                   '26'),
  ('782', 'Transporte Rodoviário',                              '26'),
  ('783', 'Transporte Ferroviário',                             '26'),
  ('784', 'Transporte Hidroviário',                             '26'),
  ('785', 'Transportes Especiais',                              '26'),
  -- Função 27: Desporto e Lazer
  ('811', 'Desporto de Rendimento',                             '27'),
  ('812', 'Desporto Comunitário',                               '27'),
  ('813', 'Lazer',                                              '27'),
  -- Função 28: Encargos Especiais
  ('841', 'Refinanciamento da Dívida Interna',                  '28'),
  ('842', 'Refinanciamento da Dívida Externa',                  '28'),
  ('843', 'Serviço da Dívida Interna',                          '28'),
  ('844', 'Serviço da Dívida Externa',                          '28'),
  ('845', 'Transferências',                                     '28'),
  ('846', 'Outros Encargos Especiais',                          '28')
ON CONFLICT (codigo) DO UPDATE SET
  nome          = EXCLUDED.nome,
  funcao_codigo = EXCLUDED.funcao_codigo;

-- =============================================================================
-- 3) Naturezas de despesa — elementos mais comuns
-- Padrão: <categoria>.<grupo>.<modalidade>.<elemento>
-- =============================================================================
INSERT INTO cat_naturezas_despesa (codigo, nome, categoria, descricao) VALUES
  -- 3 = Despesa Corrente
  ('3.1.90.04', 'Contratação por Tempo Determinado',           'corrente', 'Pessoal por tempo determinado'),
  ('3.1.90.11', 'Vencimentos e Vantagens Fixas - Pessoal Civil','corrente', 'Salários, gratificações e adicionais'),
  ('3.1.90.13', 'Obrigações Patronais',                        'corrente', 'INSS, FGTS, PIS/PASEP patronais'),
  ('3.1.90.16', 'Outras Despesas Variáveis - Pessoal Civil',   'corrente', 'Diárias, horas extras, substituições'),
  ('3.1.91.13', 'Obrigações Patronais Intra-Orçamentárias',    'corrente', 'Contribuição para RPPS'),
  ('3.3.20.93', 'Indenizações e Restituições',                 'corrente', 'Indenizações e restituições'),
  ('3.3.50.43', 'Subvenções Sociais',                          'corrente', 'Subvenções a entidades sem fins lucrativos'),
  ('3.3.90.14', 'Diárias - Civil',                             'corrente', 'Diárias para servidores'),
  ('3.3.90.18', 'Auxílio Financeiro a Estudantes',             'corrente', 'Bolsas de estudo'),
  ('3.3.90.30', 'Material de Consumo',                         'corrente', 'Materiais de uso diário (papel, combustível, alimentação)'),
  ('3.3.90.32', 'Material de Distribuição Gratuita',           'corrente', 'Material para distribuição à população'),
  ('3.3.90.33', 'Passagens e Despesas com Locomoção',          'corrente', 'Bilhetes, fretes e locomoção'),
  ('3.3.90.35', 'Serviços de Consultoria',                     'corrente', 'Consultoria técnica especializada'),
  ('3.3.90.36', 'Outros Serviços de Terceiros - Pessoa Física','corrente', 'Serviços prestados por PF (autônomos)'),
  ('3.3.90.37', 'Locação de Mão de Obra',                      'corrente', 'Terceirização — vigilância, limpeza, etc.'),
  ('3.3.90.39', 'Outros Serviços de Terceiros - Pessoa Jurídica','corrente','Serviços prestados por PJ'),
  ('3.3.90.40', 'Serviços de TIC - Pessoa Jurídica',           'corrente', 'Serviços de TI prestados por PJ'),
  ('3.3.90.46', 'Auxílio-Alimentação',                         'corrente', 'Vale-alimentação aos servidores'),
  ('3.3.90.47', 'Obrigações Tributárias e Contributivas',      'corrente', 'Tributos e contribuições'),
  ('3.3.90.48', 'Outros Auxílios Financeiros a Pessoas Físicas','corrente','Benefícios assistenciais'),
  ('3.3.90.49', 'Auxílio-Transporte',                          'corrente', 'Vale-transporte aos servidores'),
  -- 4 = Despesa de Capital
  ('4.4.90.51', 'Obras e Instalações',                         'capital',  'Obras públicas, instalações'),
  ('4.4.90.52', 'Equipamentos e Material Permanente',          'capital',  'Bens de uso duradouro (móveis, equipamentos)'),
  ('4.4.90.61', 'Aquisição de Imóveis',                        'capital',  'Compra de terrenos e imóveis'),
  ('4.4.90.92', 'Despesas de Exercícios Anteriores',           'capital',  'Pagamento de obrigações de exercícios passados'),
  ('4.5.90.61', 'Aquisição de Imóveis - Outros',               'capital',  'Outras aquisições imobiliárias'),
  ('4.6.90.71', 'Principal da Dívida Contratual Resgatado',    'capital',  'Amortização de dívida contratual')
ON CONFLICT (codigo) DO UPDATE SET
  nome      = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao;

-- =============================================================================
-- 4) Fontes de recurso — padrão STN aplicável a municípios
-- =============================================================================
INSERT INTO cat_fontes_recurso (codigo, nome, esfera, descricao) VALUES
  -- Recursos próprios
  ('100', 'Recursos Ordinários',                                    'municipal', 'Recursos do Tesouro Municipal — receita tributária livre'),
  ('101', 'Receitas de Impostos e Transferências - Educação',       'municipal', 'MDE — 25% mínimo da Educação (CF art. 212)'),
  ('102', 'Receitas de Impostos e Transferências - Saúde',          'municipal', 'ASPS — 15% mínimo da Saúde (CF/EC 29)'),
  ('103', 'Contribuição para o Custeio da Iluminação Pública',      'municipal', 'COSIP — iluminação pública'),
  ('104', 'Royalties / Participações Especiais',                    'municipal', 'Royalties de petróleo, mineração, etc.'),
  -- Recursos federais
  ('110', 'Transferências Federais - SUS',                          'federal',   'Bloco da Atenção Básica e demais blocos SUS'),
  ('111', 'Transferências Federais - FNDE',                         'federal',   'PNAE, PNATE, PDDE, Salário-Educação'),
  ('112', 'Transferências Federais - FUNDEB',                       'federal',   'Complementação federal ao FUNDEB'),
  ('113', 'Transferências Federais - Assistência Social',           'federal',   'FNAS — SUAS, PAIF, SCFV'),
  ('114', 'Transferências Federais - Convênios',                    'federal',   'Convênios firmados com órgãos da União'),
  ('115', 'Emendas Parlamentares Federais',                         'federal',   'Emendas individuais, de bancada e de comissão'),
  ('116', 'Transferências Federais - Outras',                       'federal',   'Demais transferências da União'),
  -- Recursos estaduais
  ('120', 'Transferências Estaduais - Saúde',                       'estadual',  'Repasses do estado para a saúde'),
  ('121', 'Transferências Estaduais - Educação',                    'estadual',  'Repasses do estado para a educação'),
  ('122', 'Transferências Estaduais - Convênios',                   'estadual',  'Convênios firmados com o governo estadual'),
  ('123', 'Emendas Parlamentares Estaduais',                        'estadual',  'Emendas de deputados estaduais'),
  ('124', 'Transferências Estaduais - Outras',                      'estadual',  'Demais transferências do estado'),
  -- Próprias / operações
  ('200', 'Recursos Vinculados Próprios',                           'propria',   'Receita própria vinculada à finalidade específica'),
  ('210', 'Operações de Crédito Internas',                          'propria',   'Empréstimos com bancos públicos (BNDES, CEF)'),
  ('220', 'Operações de Crédito Externas',                          'propria',   'Empréstimos com organismos internacionais (BID, BIRD)'),
  -- Outras
  ('700', 'Recursos de Convênios e Doações',                        'outras',    'Doações e convênios com setor privado/terceiro setor'),
  ('800', 'Recursos de Alienações',                                 'outras',    'Receita da venda de bens públicos')
ON CONFLICT (codigo) DO UPDATE SET
  nome      = EXCLUDED.nome,
  esfera    = EXCLUDED.esfera,
  descricao = EXCLUDED.descricao;

-- =============================================================================
-- 5) Verificação
-- =============================================================================
DO $$
DECLARE
  v_count_funcoes      INTEGER;
  v_count_subfuncoes   INTEGER;
  v_count_naturezas    INTEGER;
  v_count_fontes       INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_funcoes    FROM cat_funcoes;
  SELECT COUNT(*) INTO v_count_subfuncoes FROM cat_subfuncoes;
  SELECT COUNT(*) INTO v_count_naturezas  FROM cat_naturezas_despesa;
  SELECT COUNT(*) INTO v_count_fontes     FROM cat_fontes_recurso;

  RAISE NOTICE '=== Seed Catálogos Orçamentários ===';
  RAISE NOTICE 'Funções:         % (esperado: 28)',      v_count_funcoes;
  RAISE NOTICE 'Subfunções:      % (esperado: ~70)',     v_count_subfuncoes;
  RAISE NOTICE 'Naturezas Desp:  % (esperado: ~25)',     v_count_naturezas;
  RAISE NOTICE 'Fontes Recurso:  % (esperado: ~22)',     v_count_fontes;
END $$;
