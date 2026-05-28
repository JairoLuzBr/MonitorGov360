-- =============================================================================
-- MonitorGov360 — Sincronização da classificação orçamentária nas ações de seed
-- Migração: 007_sincronizar_classificacao_acoes_seed.sql
-- Descrição: As 5 ações do seed (003_seed_perfis.sql) foram criadas ANTES da
--   migration 005, então `funcao_codigo`, `subfuncao_codigo`, valores
--   orçamentários etc. estão NULL/0 nelas. Esta migration popula esses dados
--   com base nos valores fixados no próprio seed inicial.
--
-- Independente de `orcamento_dotacoes` (tabela que pode não existir).
-- Idempotente — pode ser re-executada sem efeito colateral.
-- =============================================================================

DO $$
DECLARE
  v_municipio_id     UUID := '00000000-0000-0000-0000-000000000001';
  v_acao_obra_id     UUID := '00000000-0000-0002-0000-000000000001';
  v_acao_social_id   UUID := '00000000-0000-0002-0000-000000000002';
  v_acao_saude_id    UUID := '00000000-0000-0002-0000-000000000003';
  v_acao_edu_id      UUID := '00000000-0000-0002-0000-000000000004';
  v_acao_contrato_id UUID := '00000000-0000-0002-0000-000000000005';
BEGIN

  -- ---------------------------------------------------------------------------
  -- Ação 1: Recapeamento Asfáltico — Bairro Santa Maria (Urbanismo / Obras)
  -- ---------------------------------------------------------------------------
  UPDATE acoes SET
    funcao_codigo            = '15',
    funcao_nome              = 'Urbanismo',
    subfuncao_codigo         = '451',
    subfuncao_nome           = 'Infraestrutura Urbana',
    programa_codigo          = '0012',
    programa_nome            = 'Mobilidade Urbana',
    acao_orcamentaria_codigo = '2001',
    acao_orcamentaria_nome   = 'Manutenção de Vias Urbanas',
    natureza_despesa_codigo  = '4.4.90.51',
    natureza_despesa_nome    = 'Obras e Instalações',
    valor_fixado             = 2500000.00,
    valor_atualizado         = 2700000.00,
    valor_empenhado          = 1200000.00,
    valor_liquidado          =  950000.00,
    valor_pago               =  800000.00,
    updated_at               = NOW()
  WHERE id = v_acao_obra_id
    AND municipio_id = v_municipio_id
    AND acao_pai_id IS NULL;

  -- ---------------------------------------------------------------------------
  -- Ação 2: Programa Renda Família Demo (Assistência Social)
  -- ---------------------------------------------------------------------------
  UPDATE acoes SET
    funcao_codigo            = '08',
    funcao_nome              = 'Assistência Social',
    subfuncao_codigo         = '244',
    subfuncao_nome           = 'Assistência Comunitária',
    programa_codigo          = '0003',
    programa_nome            = 'Proteção Social Básica',
    acao_orcamentaria_codigo = '2010',
    acao_orcamentaria_nome   = 'Transferência de Renda Municipal',
    natureza_despesa_codigo  = '3.3.90.47',
    natureza_despesa_nome    = 'Obrigações Tributárias e Contributivas',
    valor_fixado             = 900000.00,
    valor_atualizado         = 900000.00,
    valor_empenhado          = 585000.00,
    valor_liquidado          = 450000.00,
    valor_pago               = 450000.00,
    updated_at               = NOW()
  WHERE id = v_acao_social_id
    AND municipio_id = v_municipio_id
    AND acao_pai_id IS NULL;

  -- ---------------------------------------------------------------------------
  -- Ação 3: Reforma e Ampliação da UBS Centro (Saúde — em licitação)
  -- ---------------------------------------------------------------------------
  UPDATE acoes SET
    funcao_codigo            = '10',
    funcao_nome              = 'Saúde',
    subfuncao_codigo         = '301',
    subfuncao_nome           = 'Atenção Básica',
    programa_codigo          = '0007',
    programa_nome            = 'Atenção Primária à Saúde',
    acao_orcamentaria_codigo = '1002',
    acao_orcamentaria_nome   = 'Reforma de UBS',
    natureza_despesa_codigo  = '4.4.90.51',
    natureza_despesa_nome    = 'Obras e Instalações',
    valor_fixado             = 1800000.00,
    valor_atualizado         = 1800000.00,
    valor_empenhado          =   90000.00,
    valor_liquidado          =       0.00,
    valor_pago               =       0.00,
    updated_at               = NOW()
  WHERE id = v_acao_saude_id
    AND municipio_id = v_municipio_id
    AND acao_pai_id IS NULL;

  -- ---------------------------------------------------------------------------
  -- Ação 4: Programa de Reforço Escolar (Educação)
  -- ---------------------------------------------------------------------------
  UPDATE acoes SET
    funcao_codigo            = '12',
    funcao_nome              = 'Educação',
    subfuncao_codigo         = '361',
    subfuncao_nome           = 'Ensino Fundamental',
    programa_codigo          = '0008',
    programa_nome            = 'Educação Básica de Qualidade',
    acao_orcamentaria_codigo = '2015',
    acao_orcamentaria_nome   = 'Reforço Escolar Municipal',
    natureza_despesa_codigo  = '3.3.90.36',
    natureza_despesa_nome    = 'Outros Serviços de Terceiros - Pessoa Física',
    valor_fixado             = 480000.00,
    valor_atualizado         = 480000.00,
    valor_empenhado          = 264000.00,
    valor_liquidado          = 220000.00,
    valor_pago               = 200000.00,
    updated_at               = NOW()
  WHERE id = v_acao_edu_id
    AND municipio_id = v_municipio_id
    AND acao_pai_id IS NULL;

  -- ---------------------------------------------------------------------------
  -- Ação 5: Contrato de Limpeza Pública (Urbanismo / Serviços)
  -- ---------------------------------------------------------------------------
  UPDATE acoes SET
    funcao_codigo            = '15',
    funcao_nome              = 'Urbanismo',
    subfuncao_codigo         = '452',
    subfuncao_nome           = 'Serviços Urbanos',
    programa_codigo          = '0001',
    programa_nome            = 'Cidade Limpa',
    acao_orcamentaria_codigo = '2020',
    acao_orcamentaria_nome   = 'Coleta e Destinação de Resíduos',
    natureza_despesa_codigo  = '3.3.90.37',
    natureza_despesa_nome    = 'Locação de Mão de Obra',
    valor_fixado             = 3600000.00,
    valor_atualizado         = 3600000.00,
    valor_empenhado          = 2160000.00,
    valor_liquidado          = 1800000.00,
    valor_pago               = 1800000.00,
    updated_at               = NOW()
  WHERE id = v_acao_contrato_id
    AND municipio_id = v_municipio_id
    AND acao_pai_id IS NULL;

END $$;

-- =============================================================================
-- Verificação
-- =============================================================================
DO $$
DECLARE
  v_acoes_total          INTEGER;
  v_acoes_classificadas  INTEGER;
  v_acoes_com_valor      INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_acoes_total
  FROM acoes
  WHERE municipio_id = '00000000-0000-0000-0000-000000000001';

  SELECT COUNT(*) INTO v_acoes_classificadas
  FROM acoes
  WHERE municipio_id = '00000000-0000-0000-0000-000000000001'
    AND funcao_codigo IS NOT NULL;

  SELECT COUNT(*) INTO v_acoes_com_valor
  FROM acoes
  WHERE municipio_id = '00000000-0000-0000-0000-000000000001'
    AND valor_fixado > 0;

  RAISE NOTICE '=== Migração 007 — Sincronização concluída ===';
  RAISE NOTICE 'Total de ações no município demo:  %', v_acoes_total;
  RAISE NOTICE 'Ações com função preenchida:       % (esperado: 5)', v_acoes_classificadas;
  RAISE NOTICE 'Ações com valor_fixado > 0:        % (esperado: 5)', v_acoes_com_valor;
END $$;
