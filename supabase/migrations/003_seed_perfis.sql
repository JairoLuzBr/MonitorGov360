-- =============================================================================
-- MonitorGov360 — Seed de Dados Iniciais
-- Migração: 003_seed_perfis.sql
-- Descrição: Seed dos 16 perfis do sistema e dados de exemplo para 1 município
--            de testes com usuários, ações e ciclo de monitoramento.
-- =============================================================================

-- =============================================================================
-- SEED: perfis_sistema (16 perfis)
-- Usar ON CONFLICT para suportar re-execução idempotente.
-- =============================================================================
INSERT INTO perfis_sistema (id, codigo, nome, descricao, nivel_acesso, permissoes)
VALUES
  -- Nível 10: Máxima autoridade municipal
  (
    gen_random_uuid(), 'prefeito',
    'Prefeito Municipal',
    'Acesso total ao município. Visualiza todos os dados, aprova relatórios e exporta informações.',
    10,
    '{"visualizar": true, "editar": true, "aprovar": true, "exportar": true, "gerenciar_usuarios": true, "ver_auditoria": true, "configurar": true}'
  ),

  -- Nível 9: Secretários
  (
    gen_random_uuid(), 'secretario_municipal',
    'Secretário Municipal',
    'Acesso total ao órgão sob sua gestão. Aprova ações e relatórios da secretaria.',
    9,
    '{"visualizar": true, "editar": true, "aprovar": true, "exportar": true, "gerenciar_equipe": true}'
  ),
  (
    gen_random_uuid(), 'secretario_adjunto',
    'Secretário Adjunto',
    'Acesso amplo ao órgão. Pode substituir o secretário nas aprovações.',
    8,
    '{"visualizar": true, "editar": true, "aprovar": true, "exportar": true}'
  ),

  -- Nível 7: Gestão de ações
  (
    gen_random_uuid(), 'gestor_acao',
    'Gestor de Ação',
    'Responsável direto pela execução de ações governamentais. Responde questionários e envia evidências.',
    7,
    '{"visualizar": true, "editar": true, "responder_questionario": true, "enviar_evidencia": true}'
  ),
  (
    gen_random_uuid(), 'coordenador_programa',
    'Coordenador de Programa',
    'Coordena programas sociais e ações temáticas. Visão consolidada do programa.',
    7,
    '{"visualizar": true, "editar": true, "responder_questionario": true, "enviar_evidencia": true, "exportar": true}'
  ),

  -- Nível 6: Fiscalização e controle
  (
    gen_random_uuid(), 'fiscal_contrato',
    'Fiscal de Contrato',
    'Fiscaliza a execução de contratos. Pode validar evidências e registrar medições.',
    6,
    '{"visualizar": true, "editar": false, "validar_evidencia": true, "registrar_medicao": true, "exportar": true}'
  ),
  (
    gen_random_uuid(), 'engenheiro_obra',
    'Engenheiro de Obra',
    'Responsável técnico por obras públicas. Valida laudos, medições e evidências físicas.',
    6,
    '{"visualizar": true, "editar": false, "validar_evidencia": true, "registrar_medicao": true, "emitir_laudo": true}'
  ),
  (
    gen_random_uuid(), 'controlador_interno',
    'Controlador Interno',
    'Acesso amplo para fins de controle e auditoria. Vê logs e relatórios de conformidade.',
    8,
    '{"visualizar": true, "editar": false, "exportar": true, "ver_auditoria": true, "gerar_relatorio_controle": true}'
  ),

  -- Nível 5: Apoio técnico e administrativo
  (
    gen_random_uuid(), 'contador',
    'Contador',
    'Gestão das informações orçamentárias e financeiras das ações.',
    5,
    '{"visualizar": true, "editar": false, "gerenciar_orcamento": true, "exportar": true}'
  ),
  (
    gen_random_uuid(), 'assessor_gabinete',
    'Assessor de Gabinete',
    'Apoio ao prefeito. Acesso a relatórios executivos e painéis de monitoramento.',
    5,
    '{"visualizar": true, "editar": false, "exportar": true}'
  ),
  (
    gen_random_uuid(), 'agente_campo',
    'Agente de Campo',
    'Realiza visitas in loco. Envia evidências (fotos, vídeos, medições) das ações.',
    4,
    '{"visualizar": true, "editar": false, "enviar_evidencia": true, "responder_questionario": true}'
  ),

  -- Nível 3: Monitoramento externo (sem edição)
  (
    gen_random_uuid(), 'vereador_monitor',
    'Vereador Monitor',
    'Acesso de leitura às ações concluídas para fins de fiscalização legislativa.',
    3,
    '{"visualizar": true, "editar": false, "exportar": false}'
  ),
  (
    gen_random_uuid(), 'jornalista_transparencia',
    'Jornalista / Transparência',
    'Acesso a dados públicos e ações concluídas para fins de transparência e jornalismo de dados.',
    2,
    '{"visualizar": true, "editar": false, "exportar": false}'
  ),
  (
    gen_random_uuid(), 'cidadao_monitor',
    'Cidadão Monitor',
    'Acesso à visualização de ações concluídas. Participa como monitor social.',
    1,
    '{"visualizar": true, "editar": false, "exportar": false}'
  ),

  -- Nível 10: Administração da plataforma
  (
    gen_random_uuid(), 'admin_sistema',
    'Administrador do Sistema',
    'Acesso irrestrito a toda a plataforma. Gerencia tenants, usuários e configurações globais.',
    10,
    '{"visualizar": true, "editar": true, "aprovar": true, "exportar": true, "gerenciar_tenants": true, "gerenciar_usuarios": true, "ver_auditoria": true, "configurar": true, "deletar": true}'
  ),
  (
    gen_random_uuid(), 'suporte_tecnico',
    'Suporte Técnico',
    'Acesso técnico para suporte e manutenção da plataforma. Não altera dados de negócio.',
    9,
    '{"visualizar": true, "editar": false, "gerenciar_tenants": true, "ver_auditoria": true, "configurar": true}'
  )

ON CONFLICT (codigo) DO UPDATE SET
  nome         = EXCLUDED.nome,
  descricao    = EXCLUDED.descricao,
  nivel_acesso = EXCLUDED.nivel_acesso,
  permissoes   = EXCLUDED.permissoes;

-- =============================================================================
-- SEED: Município Demo
-- Município de teste para desenvolvimento e demonstração da plataforma.
-- =============================================================================

-- Usar variáveis via DO block para reutilização dos UUIDs
DO $$
DECLARE
  v_municipio_id     UUID := '00000000-0000-0000-0000-000000000001';
  v_orgao_pref_id    UUID := '00000000-0000-0000-0001-000000000001';
  v_orgao_obras_id   UUID := '00000000-0000-0000-0001-000000000002';
  v_orgao_saude_id   UUID := '00000000-0000-0000-0001-000000000003';
  v_orgao_edu_id     UUID := '00000000-0000-0000-0001-000000000004';
  v_orgao_social_id  UUID := '00000000-0000-0000-0001-000000000005';

  -- Usuários de exemplo
  v_user_prefeito    UUID := '00000000-0000-0001-0000-000000000001';
  v_user_secretario  UUID := '00000000-0000-0001-0000-000000000002';
  v_user_gestor      UUID := '00000000-0000-0001-0000-000000000003';
  v_user_fiscal      UUID := '00000000-0000-0001-0000-000000000004';
  v_user_engenheiro  UUID := '00000000-0000-0001-0000-000000000005';
  v_user_controlador UUID := '00000000-0000-0001-0000-000000000006';
  v_user_contador    UUID := '00000000-0000-0001-0000-000000000007';
  v_user_coord       UUID := '00000000-0000-0001-0000-000000000008';
  v_user_agente      UUID := '00000000-0000-0001-0000-000000000009';
  v_user_vereador    UUID := '00000000-0000-0001-0000-000000000010';

  -- Ações de exemplo
  v_acao_obra_id     UUID := '00000000-0000-0002-0000-000000000001';
  v_acao_social_id   UUID := '00000000-0000-0002-0000-000000000002';
  v_acao_saude_id    UUID := '00000000-0000-0002-0000-000000000003';
  v_acao_edu_id      UUID := '00000000-0000-0002-0000-000000000004';
  v_acao_contrato_id UUID := '00000000-0000-0002-0000-000000000005';

  -- Ciclo e modelo
  v_ciclo_id         UUID := '00000000-0000-0003-0000-000000000001';
  v_modelo_obra_id   UUID := '00000000-0000-0004-0000-000000000001';
  v_modelo_prog_id   UUID := '00000000-0000-0004-0000-000000000002';

BEGIN

  -- -------------------------------------------------------------------------
  -- MUNICÍPIO DEMO
  -- -------------------------------------------------------------------------
  INSERT INTO municipios (id, nome, cnpj, codigo_ibge, subdomain, uf, populacao, plano, ativo)
  VALUES (
    v_municipio_id,
    'Município Demo',
    '00.000.000/0001-00',
    '3500000',
    'demo',
    'SP',
    120000,
    'premium',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- USUÁRIOS DE EXEMPLO
  -- Nota: Em produção o UUID vem do auth.users. Aqui usamos IDs fixos.
  -- -------------------------------------------------------------------------
  INSERT INTO usuarios (id, municipio_id, email, nome, cargo, ativo)
  VALUES
    (v_user_prefeito,    v_municipio_id, 'prefeito@demo.monitorgov360.com.br',    'Dr. João Silva',         'Prefeito Municipal',      true),
    (v_user_secretario,  v_municipio_id, 'sec.obras@demo.monitorgov360.com.br',   'Eng. Maria Santos',      'Secretário de Obras',     true),
    (v_user_gestor,      v_municipio_id, 'gestor@demo.monitorgov360.com.br',      'Carlos Oliveira',        'Gestor de Ação',          true),
    (v_user_fiscal,      v_municipio_id, 'fiscal@demo.monitorgov360.com.br',      'Ana Lima',               'Fiscal de Contrato',      true),
    (v_user_engenheiro,  v_municipio_id, 'engenheiro@demo.monitorgov360.com.br',  'Eng. Pedro Costa',       'Engenheiro de Obras',     true),
    (v_user_controlador, v_municipio_id, 'controle@demo.monitorgov360.com.br',    'Dra. Lucia Ferreira',    'Controladora Interna',    true),
    (v_user_contador,    v_municipio_id, 'contador@demo.monitorgov360.com.br',    'Roberto Almeida',        'Contador',                true),
    (v_user_coord,       v_municipio_id, 'coord.social@demo.monitorgov360.com.br','Fernanda Rocha',         'Coordenadora de Programa',true),
    (v_user_agente,      v_municipio_id, 'agente@demo.monitorgov360.com.br',      'Marcos Pereira',         'Agente de Campo',         true),
    (v_user_vereador,    v_municipio_id, 'vereador@demo.monitorgov360.com.br',    'Ver. Antônio Souza',     'Vereador',                true)
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- ÓRGÃOS MUNICIPAIS
  -- -------------------------------------------------------------------------
  INSERT INTO orgaos (id, municipio_id, nome, sigla, secretario_id, tipo, ativo)
  VALUES
    (v_orgao_pref_id,   v_municipio_id, 'Gabinete do Prefeito',                   'GAB',   v_user_prefeito,   'secretaria', true),
    (v_orgao_obras_id,  v_municipio_id, 'Secretaria Municipal de Obras e Serviços','SEMOS', v_user_secretario, 'secretaria', true),
    (v_orgao_saude_id,  v_municipio_id, 'Secretaria Municipal de Saúde',           'SMS',   NULL,              'secretaria', true),
    (v_orgao_edu_id,    v_municipio_id, 'Secretaria Municipal de Educação',        'SME',   NULL,              'secretaria', true),
    (v_orgao_social_id, v_municipio_id, 'Secretaria Municipal de Assistência Social','SMAS', NULL,             'secretaria', true)
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- VÍNCULOS DE PERFIL (RBAC)
  -- -------------------------------------------------------------------------
  INSERT INTO usuario_perfis (id, usuario_id, perfil_codigo, municipio_id, orgao_id, ativo)
  VALUES
    (gen_random_uuid(), v_user_prefeito,    'prefeito',             v_municipio_id, v_orgao_pref_id,   true),
    (gen_random_uuid(), v_user_secretario,  'secretario_municipal', v_municipio_id, v_orgao_obras_id,  true),
    (gen_random_uuid(), v_user_gestor,      'gestor_acao',          v_municipio_id, v_orgao_obras_id,  true),
    (gen_random_uuid(), v_user_fiscal,      'fiscal_contrato',      v_municipio_id, v_orgao_obras_id,  true),
    (gen_random_uuid(), v_user_engenheiro,  'engenheiro_obra',      v_municipio_id, v_orgao_obras_id,  true),
    (gen_random_uuid(), v_user_controlador, 'controlador_interno',  v_municipio_id, v_orgao_pref_id,   true),
    (gen_random_uuid(), v_user_contador,    'contador',             v_municipio_id, v_orgao_pref_id,   true),
    (gen_random_uuid(), v_user_coord,       'coordenador_programa', v_municipio_id, v_orgao_social_id, true),
    (gen_random_uuid(), v_user_agente,      'agente_campo',         v_municipio_id, v_orgao_obras_id,  true),
    (gen_random_uuid(), v_user_vereador,    'vereador_monitor',     v_municipio_id, NULL,              true)
  ON CONFLICT (usuario_id, perfil_codigo, orgao_id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- MODELOS DE QUESTIONÁRIO
  -- -------------------------------------------------------------------------
  INSERT INTO modelos_questionario (id, municipio_id, tipo_acao, nome, perguntas, ciclo, ativo)
  VALUES
    (
      v_modelo_obra_id,
      v_municipio_id,
      'obra_publica',
      'Monitoramento Semanal de Obra Pública',
      '[
        {"id": "q1", "texto": "Qual o percentual físico executado nesta semana?", "tipo": "numero", "obrigatoria": true, "opcoes": null},
        {"id": "q2", "texto": "A obra está conforme o cronograma?", "tipo": "sim_nao", "obrigatoria": true, "opcoes": null},
        {"id": "q3", "texto": "Houve alguma paralisação? Se sim, qual o motivo?", "tipo": "texto", "obrigatoria": false, "opcoes": null},
        {"id": "q4", "texto": "Quantidade de trabalhadores no canteiro nesta semana", "tipo": "numero", "obrigatoria": true, "opcoes": null},
        {"id": "q5", "texto": "Situação do canteiro de obras", "tipo": "selecao", "obrigatoria": true, "opcoes": ["Normal", "Com irregularidades menores", "Com irregularidades graves", "Paralisado"]},
        {"id": "q6", "texto": "Foram realizadas medições no período?", "tipo": "sim_nao", "obrigatoria": true, "opcoes": null},
        {"id": "q7", "texto": "Envie pelo menos uma foto do andamento da obra", "tipo": "arquivo", "obrigatoria": true, "opcoes": null},
        {"id": "q8", "texto": "Data prevista para conclusão mantida?", "tipo": "sim_nao", "obrigatoria": true, "opcoes": null},
        {"id": "q9", "texto": "Observações adicionais", "tipo": "texto", "obrigatoria": false, "opcoes": null}
      ]'::jsonb,
      'semanal',
      true
    ),
    (
      v_modelo_prog_id,
      v_municipio_id,
      'programa_social',
      'Monitoramento Mensal de Programa Social',
      '[
        {"id": "q1", "texto": "Número de beneficiários atendidos no mês", "tipo": "numero", "obrigatoria": true, "opcoes": null},
        {"id": "q2", "texto": "O programa atingiu a meta mensal?", "tipo": "sim_nao", "obrigatoria": true, "opcoes": null},
        {"id": "q3", "texto": "Percentual da meta mensal atingida (%)", "tipo": "numero", "obrigatoria": true, "opcoes": null},
        {"id": "q4", "texto": "Recursos financeiros utilizados no mês (R$)", "tipo": "numero", "obrigatoria": true, "opcoes": null},
        {"id": "q5", "texto": "Houve pendências ou dificuldades de execução?", "tipo": "sim_nao", "obrigatoria": true, "opcoes": null},
        {"id": "q6", "texto": "Descreva as pendências ou dificuldades (se houver)", "tipo": "texto", "obrigatoria": false, "opcoes": null},
        {"id": "q7", "texto": "Status geral do programa neste mês", "tipo": "selecao", "obrigatoria": true, "opcoes": ["Em dia", "Com pequenos atrasos", "Com atrasos significativos", "Em risco de não cumprimento"]},
        {"id": "q8", "texto": "Envie relatório ou documento comprobatório", "tipo": "arquivo", "obrigatoria": false, "opcoes": null}
      ]'::jsonb,
      'mensal',
      true
    )
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- 5 AÇÕES DE EXEMPLO (tipos diferentes)
  -- -------------------------------------------------------------------------
  INSERT INTO acoes (
    id, municipio_id, orgao_id, tipo, titulo, descricao,
    responsavel_id, status, nivel_risco,
    data_inicio, data_prevista_fim,
    localizacao_bairro, localizacao_endereco, localizacao_lat, localizacao_lng,
    percentual_fisico, percentual_financeiro,
    meta_quantitativa, unidade_meta,
    numero_contrato, numero_licitacao, fonte_recurso,
    created_by
  )
  VALUES
    -- Ação 1: Obra pública
    (
      v_acao_obra_id,
      v_municipio_id,
      v_orgao_obras_id,
      'obra_publica',
      'Recapeamento Asfáltico — Bairro Santa Maria',
      'Recapeamento de 8 km de vias urbanas no Bairro Santa Maria, incluindo sinalização horizontal e vertical.',
      v_user_gestor,
      'em_execucao',
      'medio',
      '2024-03-01', '2024-09-30',
      'Santa Maria', 'Rua das Flores, 100 ao 850', -23.5505, -46.6333,
      42.5, 38.0,
      8, 'km',
      '001/2024', 'TP 002/2023', 'federal',
      v_user_prefeito
    ),

    -- Ação 2: Programa social
    (
      v_acao_social_id,
      v_municipio_id,
      v_orgao_social_id,
      'programa_social',
      'Programa Renda Família Demo — Transferência de Renda Municipal',
      'Programa de transferência de renda para famílias em situação de vulnerabilidade social cadastradas no CadÚnico.',
      v_user_coord,
      'em_execucao',
      'baixo',
      '2024-01-01', '2024-12-31',
      NULL, NULL, NULL, NULL,
      70.0, 65.0,
      1500, 'famílias beneficiadas',
      NULL, NULL, 'tesouro_municipal',
      v_user_prefeito
    ),

    -- Ação 3: Saúde
    (
      v_acao_saude_id,
      v_municipio_id,
      v_orgao_saude_id,
      'acao_saude',
      'Reforma e Ampliação da UBS Centro',
      'Reforma completa e ampliação da Unidade Básica de Saúde do Centro, com construção de 4 consultórios adicionais.',
      v_user_gestor,
      'em_licitacao',
      'alto',
      '2024-06-01', '2025-03-31',
      'Centro', 'Av. Principal, 250', -23.5480, -46.6310,
      0.0, 5.0,
      4, 'consultórios',
      NULL, 'TP 005/2024', 'estadual',
      v_user_prefeito
    ),

    -- Ação 4: Educação
    (
      v_acao_edu_id,
      v_municipio_id,
      v_orgao_edu_id,
      'acao_educacional',
      'Programa de Reforço Escolar — Rede Municipal 2024',
      'Oferta de aulas de reforço em Português e Matemática para alunos do 6º ao 9º ano da rede municipal.',
      v_user_coord,
      'em_execucao',
      'baixo',
      '2024-02-01', '2024-11-30',
      NULL, NULL, NULL, NULL,
      55.0, 50.0,
      2200, 'alunos atendidos',
      NULL, NULL, 'federal',
      v_user_prefeito
    ),

    -- Ação 5: Contrato continuado
    (
      v_acao_contrato_id,
      v_municipio_id,
      v_orgao_pref_id,
      'contrato_continuado',
      'Contrato de Limpeza Pública e Coleta de Resíduos',
      'Serviços de varrição, coleta domiciliar e destinação final de resíduos sólidos urbanos.',
      v_user_fiscal,
      'em_execucao',
      'medio',
      '2024-01-01', '2024-12-31',
      NULL, NULL, NULL, NULL,
      60.0, 58.0,
      NULL, NULL,
      '012/2024', 'PE 008/2023', 'tesouro_municipal',
      v_user_prefeito
    )
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- DOTAÇÕES ORÇAMENTÁRIAS DE EXEMPLO
  -- -------------------------------------------------------------------------
  INSERT INTO orcamento_dotacoes (
    municipio_id, acao_id, exercicio,
    funcao, subfuncao, programa, acao_orcamentaria, elemento_despesa, fonte_recurso,
    valor_dotacao, valor_suplementado, valor_empenhado, valor_liquidado, valor_pago
  )
  VALUES
    (v_municipio_id, v_acao_obra_id, 2024,
     '15', '451', '0012', '2001', '449051', 'federal',
     2500000.00, 200000.00, 1200000.00, 950000.00, 800000.00),

    (v_municipio_id, v_acao_social_id, 2024,
     '08', '244', '0003', '2010', '339047', 'tesouro_municipal',
     900000.00, 0.00, 585000.00, 450000.00, 450000.00),

    (v_municipio_id, v_acao_saude_id, 2024,
     '10', '301', '0007', '1002', '449051', 'estadual',
     1800000.00, 0.00, 90000.00, 0.00, 0.00),

    (v_municipio_id, v_acao_edu_id, 2024,
     '12', '361', '0008', '2015', '339036', 'federal',
     480000.00, 0.00, 264000.00, 220000.00, 200000.00),

    (v_municipio_id, v_acao_contrato_id, 2024,
     '15', '452', '0001', '2020', '339037', 'tesouro_municipal',
     3600000.00, 0.00, 2160000.00, 1800000.00, 1800000.00)
  ON CONFLICT DO NOTHING;

  -- -------------------------------------------------------------------------
  -- CICLO DE MONITORAMENTO ATIVO
  -- -------------------------------------------------------------------------
  INSERT INTO ciclos_monitoramento (id, municipio_id, data_inicio, data_fim, ciclo, status)
  VALUES (
    v_ciclo_id,
    v_municipio_id,
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '4 days',
    'semanal',
    'ativo'
  )
  ON CONFLICT (id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- QUESTIONÁRIOS INSTÂNCIAS — gerados para o ciclo ativo
  -- -------------------------------------------------------------------------
  INSERT INTO questionarios_instancia (
    id, municipio_id, acao_id, ciclo_id, modelo_id,
    responsavel_id, status, data_envio, data_prazo
  )
  VALUES
    (
      gen_random_uuid(), v_municipio_id, v_acao_obra_id, v_ciclo_id, v_modelo_obra_id,
      v_user_gestor, 'pendente',
      NOW(), NOW() + INTERVAL '3 days'
    ),
    (
      gen_random_uuid(), v_municipio_id, v_acao_social_id, v_ciclo_id, v_modelo_prog_id,
      v_user_coord, 'em_andamento',
      NOW(), NOW() + INTERVAL '3 days'
    ),
    (
      gen_random_uuid(), v_municipio_id, v_acao_contrato_id, v_ciclo_id, v_modelo_obra_id,
      v_user_fiscal, 'pendente',
      NOW(), NOW() + INTERVAL '3 days'
    )
  ON CONFLICT (acao_id, ciclo_id, responsavel_id) DO NOTHING;

  -- -------------------------------------------------------------------------
  -- ALERTAS DE EXEMPLO
  -- -------------------------------------------------------------------------
  INSERT INTO alertas (
    municipio_id, acao_id, tipo, titulo, descricao,
    nivel_gravidade, status, destinatario_perfil
  )
  VALUES
    (
      v_municipio_id, v_acao_saude_id,
      'prazo_critico',
      'Licitação da UBS Centro em atraso',
      'A licitação para reforma da UBS Centro deveria ter sido concluída até 15/05/2024. Prazo expirado há 30 dias.',
      'alto', 'ativo', 'secretario_municipal'
    ),
    (
      v_municipio_id, v_acao_obra_id,
      'divergencia_fisico_financeira',
      'Divergência física x financeira: Recapeamento Bairro Santa Maria',
      'Execução física (42,5%) supera a execução financeira (38%) em mais de 5 pontos percentuais.',
      'medio', 'em_tratamento', 'gestor_acao'
    ),
    (
      v_municipio_id, v_acao_obra_id,
      'evidencia_ausente',
      'Evidências fotográficas não enviadas — semana 18',
      'O gestor responsável pelo recapeamento não enviou o registro fotográfico semanal obrigatório.',
      'medio', 'ativo', 'gestor_acao'
    )
  ON CONFLICT DO NOTHING;

  -- -------------------------------------------------------------------------
  -- PENDÊNCIAS DE EXEMPLO
  -- -------------------------------------------------------------------------
  INSERT INTO pendencias (
    municipio_id, acao_id, titulo, descricao,
    responsavel_id, prazo, status, created_by
  )
  VALUES
    (
      v_municipio_id, v_acao_saude_id,
      'Publicar edital de licitação da UBS Centro',
      'Providenciar a publicação do edital de tomada de preços para reforma da UBS Centro no Diário Oficial.',
      v_user_secretario,
      CURRENT_DATE + INTERVAL '15 days',
      'aberta',
      v_user_controlador
    ),
    (
      v_municipio_id, v_acao_obra_id,
      'Enviar registro fotográfico — semana 18',
      'O gestor deve enviar as fotos do canteiro de obras referentes à semana 18 do ciclo de monitoramento.',
      v_user_gestor,
      CURRENT_DATE + INTERVAL '2 days',
      'aberta',
      v_user_controlador
    )
  ON CONFLICT DO NOTHING;

END $$;

-- =============================================================================
-- Verificação dos dados inseridos
-- =============================================================================
DO $$
DECLARE
  v_count_perfis    INTEGER;
  v_count_municipio INTEGER;
  v_count_usuarios  INTEGER;
  v_count_acoes     INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_perfis    FROM perfis_sistema;
  SELECT COUNT(*) INTO v_count_municipio FROM municipios WHERE subdomain = 'demo';
  SELECT COUNT(*) INTO v_count_usuarios  FROM usuarios WHERE municipio_id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_count_acoes     FROM acoes    WHERE municipio_id = '00000000-0000-0000-0000-000000000001';

  RAISE NOTICE '=== MonitorGov360 — Seed concluído ===';
  RAISE NOTICE 'Perfis do sistema: %',    v_count_perfis;
  RAISE NOTICE 'Município demo: %',       v_count_municipio;
  RAISE NOTICE 'Usuários de exemplo: %',  v_count_usuarios;
  RAISE NOTICE 'Ações de exemplo: %',     v_count_acoes;
END $$;
