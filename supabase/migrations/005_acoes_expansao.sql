-- =============================================================================
-- MonitorGov360 — Expansão do modelo de Ações Governamentais
-- Migração: 005_acoes_expansao.sql
-- Descrição: Adiciona à tabela `acoes` os campos necessários para:
--              1) hierarquia macro → micro (sub-ações)
--              2) classificação orçamentária completa (LRF / Lei 4.320/64 / LOA)
--              3) rastreabilidade da origem (manual, api, csv)
--            Cria também tabelas auxiliares de catálogo e unidades orçamentárias.
--
-- Compatibilidade: idempotente via IF NOT EXISTS / ON CONFLICT.
-- =============================================================================

-- =============================================================================
-- TABELA: cat_funcoes (catálogo GLOBAL das 28 funções da LRF)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cat_funcoes (
  codigo      TEXT        PRIMARY KEY,
  nome        TEXT        NOT NULL,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cat_funcoes IS 'Catálogo das 28 funções da LRF — comum a todos os municípios.';

-- =============================================================================
-- TABELA: cat_subfuncoes (catálogo GLOBAL — vinculadas a uma função)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cat_subfuncoes (
  codigo         TEXT        PRIMARY KEY,
  nome           TEXT        NOT NULL,
  funcao_codigo  TEXT        REFERENCES cat_funcoes(codigo) ON DELETE RESTRICT,
  ativo          BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cat_subfuncoes IS 'Catálogo de subfunções da LRF — comum a todos os municípios.';

CREATE INDEX IF NOT EXISTS idx_cat_subfuncoes_funcao_codigo
  ON cat_subfuncoes(funcao_codigo);

-- =============================================================================
-- TABELA: cat_naturezas_despesa (classificação econômica da despesa)
-- Padrão: <categoria>.<grupo>.<modalidade>.<elemento>  (ex: 3.3.90.30)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cat_naturezas_despesa (
  codigo      TEXT        PRIMARY KEY,
  nome        TEXT        NOT NULL,
  descricao   TEXT,
  -- Categoria econômica: 3=Despesa Corrente, 4=Despesa de Capital
  categoria   TEXT        CHECK (categoria IN ('corrente', 'capital')),
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cat_naturezas_despesa IS 'Catálogo de natureza de despesa (elemento + subelemento).';

-- =============================================================================
-- TABELA: cat_fontes_recurso (catálogo padrão STN)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cat_fontes_recurso (
  codigo      TEXT        PRIMARY KEY,
  nome        TEXT        NOT NULL,
  descricao   TEXT,
  -- Esfera do recurso: federal, estadual, municipal, propria, outras
  esfera      TEXT        CHECK (esfera IN ('federal', 'estadual', 'municipal', 'propria', 'outras')),
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cat_fontes_recurso IS 'Catálogo de fontes de recurso padrão STN.';

-- =============================================================================
-- TABELA: unidades_orcamentarias (POR MUNICÍPIO — não é catálogo global)
-- Estrutura: Município → Órgão → Unidade Orçamentária
-- =============================================================================
CREATE TABLE IF NOT EXISTS unidades_orcamentarias (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id    UUID        NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  orgao_id        UUID        REFERENCES orgaos(id) ON DELETE SET NULL,
  codigo          TEXT        NOT NULL,
  nome            TEXT        NOT NULL,
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (municipio_id, codigo)
);

COMMENT ON TABLE unidades_orcamentarias IS 'Unidades Orçamentárias do município (Ex.: 02.01, 04.10).';

DROP TRIGGER IF EXISTS trg_unidades_orcamentarias_updated_at ON unidades_orcamentarias;
CREATE TRIGGER trg_unidades_orcamentarias_updated_at
  BEFORE UPDATE ON unidades_orcamentarias
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

CREATE INDEX IF NOT EXISTS idx_unidades_orc_municipio
  ON unidades_orcamentarias(municipio_id);
CREATE INDEX IF NOT EXISTS idx_unidades_orc_orgao
  ON unidades_orcamentarias(orgao_id);

-- =============================================================================
-- ALTER TABLE: acoes
-- Acrescenta colunas para hierarquia, classificação orçamentária e origem.
-- Tipo `orgao_id` mantido (NOT NULL no schema atual — não mexer aqui).
-- =============================================================================

-- 1) Hierarquia macro → micro
ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS acao_pai_id UUID
    REFERENCES acoes(id) ON DELETE CASCADE;

COMMENT ON COLUMN acoes.acao_pai_id
  IS 'Auto-referência: NULL = ação macro raiz; preenchido = sub-ação (filha).';

-- 2) Classificação orçamentária — códigos + nomes redundantes (snapshot histórico)
ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS unidade_orcamentaria_id     UUID
    REFERENCES unidades_orcamentarias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS funcao_codigo               TEXT
    REFERENCES cat_funcoes(codigo) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS funcao_nome                 TEXT,
  ADD COLUMN IF NOT EXISTS subfuncao_codigo            TEXT
    REFERENCES cat_subfuncoes(codigo) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subfuncao_nome              TEXT,
  ADD COLUMN IF NOT EXISTS programa_codigo             TEXT,
  ADD COLUMN IF NOT EXISTS programa_nome               TEXT,
  ADD COLUMN IF NOT EXISTS acao_orcamentaria_codigo    TEXT,
  ADD COLUMN IF NOT EXISTS acao_orcamentaria_nome      TEXT,
  ADD COLUMN IF NOT EXISTS natureza_despesa_codigo     TEXT
    REFERENCES cat_naturezas_despesa(codigo) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS natureza_despesa_nome       TEXT;

-- 3) Origem do cadastro (rastreabilidade da entrada)
ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS origem TEXT
    NOT NULL DEFAULT 'manual'
    CHECK (origem IN ('manual', 'api', 'csv'));

COMMENT ON COLUMN acoes.origem
  IS 'Via de entrada da ação: manual (cadastro web), api (integração externa), csv (importação).';

-- 4) Identificador externo (para rastrear de qual sistema/CSV veio)
ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS origem_referencia TEXT;

COMMENT ON COLUMN acoes.origem_referencia
  IS 'Referência externa: ID no sistema de origem, nome do arquivo CSV, etc.';

-- 5) Valores orçamentários da ação (preenchidos no cadastro/importação da MACRO)
--    Sub-ações NÃO recebem valores — controlado por CHECK constraint abaixo.
ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS valor_fixado       DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_atualizado   DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_empenhado    DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_liquidado    DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_pago         DECIMAL(15,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN acoes.valor_fixado     IS 'Dotação inicial fixada na LOA. Setado no cadastro/importação. Apenas em ações macro.';
COMMENT ON COLUMN acoes.valor_atualizado IS 'Dotação após suplementações/anulações. Apenas em ações macro.';
COMMENT ON COLUMN acoes.valor_empenhado  IS 'Soma dos empenhos. Apenas em ações macro.';
COMMENT ON COLUMN acoes.valor_liquidado  IS 'Soma das liquidações. Apenas em ações macro.';
COMMENT ON COLUMN acoes.valor_pago       IS 'Soma dos pagamentos. Apenas em ações macro.';

-- CHECK: sub-ações (acao_pai_id IS NOT NULL) não podem ter valores orçamentários.
-- Os valores ficam centralizados na ação macro (pai).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_acoes_sub_acao_sem_valor'
  ) THEN
    ALTER TABLE acoes
      ADD CONSTRAINT chk_acoes_sub_acao_sem_valor
      CHECK (
        acao_pai_id IS NULL
        OR (
          valor_fixado     = 0
          AND valor_atualizado = 0
          AND valor_empenhado  = 0
          AND valor_liquidado  = 0
          AND valor_pago       = 0
        )
      );
  END IF;
END $$;

-- =============================================================================
-- ÍNDICES adicionais
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_acoes_acao_pai_id
  ON acoes(acao_pai_id)
  WHERE acao_pai_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_acoes_funcao_codigo
  ON acoes(funcao_codigo)
  WHERE funcao_codigo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_acoes_unidade_orcamentaria
  ON acoes(unidade_orcamentaria_id)
  WHERE unidade_orcamentaria_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_acoes_origem
  ON acoes(municipio_id, origem);

-- =============================================================================
-- TRIGGER: validar hierarquia (impedir ciclos pai-filho)
-- Uma ação não pode ser pai (direto/indireto) de si mesma.
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_validar_hierarquia_acao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_pai_atual UUID;
  v_profundidade INTEGER := 0;
  v_max_profundidade CONSTANT INTEGER := 10;
BEGIN
  -- Sem pai → nada a validar
  IF NEW.acao_pai_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Não pode ser pai de si mesma
  IF NEW.acao_pai_id = NEW.id THEN
    RAISE EXCEPTION 'Uma ação não pode ser pai de si mesma (id=%)', NEW.id;
  END IF;

  -- Subindo na cadeia: se encontrar NEW.id antes do topo → ciclo
  v_pai_atual := NEW.acao_pai_id;
  WHILE v_pai_atual IS NOT NULL AND v_profundidade < v_max_profundidade LOOP
    IF v_pai_atual = NEW.id THEN
      RAISE EXCEPTION 'Ciclo detectado na hierarquia de ações (id=%)', NEW.id;
    END IF;

    SELECT acao_pai_id INTO v_pai_atual
    FROM acoes
    WHERE id = v_pai_atual;

    v_profundidade := v_profundidade + 1;
  END LOOP;

  IF v_profundidade >= v_max_profundidade THEN
    RAISE EXCEPTION 'Hierarquia de ações muito profunda (máx %s níveis)', v_max_profundidade;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_acoes_validar_hierarquia ON acoes;
CREATE TRIGGER trg_acoes_validar_hierarquia
  BEFORE INSERT OR UPDATE OF acao_pai_id ON acoes
  FOR EACH ROW
  EXECUTE FUNCTION fn_validar_hierarquia_acao();

COMMENT ON FUNCTION fn_validar_hierarquia_acao IS
  'Garante que não há ciclos na hierarquia de ações (auto-referência acao_pai_id).';

-- =============================================================================
-- NOTA: NÃO HÁ agregação automática pai ← filhos
--
-- Decisão de modelagem (validada com o usuário):
--   - Ações MACRO recebem `valor_fixado`, `valor_atualizado`, `valor_empenhado`,
--     `valor_liquidado` e `valor_pago` no momento do cadastro/importação.
--   - `percentual_fisico` e `percentual_financeiro` da ação MACRO são
--     atualizados pelas RESPOSTAS DOS QUESTIONÁRIOS, não pela média dos filhos.
--   - Sub-ações NÃO carregam valores orçamentários (vide CHECK
--     `chk_acoes_sub_acao_sem_valor`).
--   - O dashboard exibe sempre o % da própria ação macro.
--
-- Por isso não há `fn_recalcular_agregados_acao_pai` aqui.
-- A atualização dos % via questionários será implementada na Fase F.
-- =============================================================================

-- =============================================================================
-- VIEW: vw_acoes_indicadores
-- Calcula indicadores derivados para cada ação:
--   - indicador_eficiencia: quanto da meta orçada foi entregue por real pago
--     IE = (% físico × valor_fixado) / (valor_pago × 100)
--     Interpretação:
--       IE = 1   → equilíbrio (entrega R$1 de meta por R$1 pago)
--       IE > 1   → eficiente (entrega mais do que paga)
--       IE < 1   → ineficiente (paga mais do que entrega)
--       NULL     → valor_pago = 0 (não há base de comparação)
--   - liquidez_orcamentaria: valor_pago / valor_empenhado
--   - execucao_financeira_real: valor_pago / valor_atualizado
--   - divergencia_fisico_financeira: % financeiro - % físico (positivo = gasta antes de entregar)
-- =============================================================================
CREATE OR REPLACE VIEW vw_acoes_indicadores AS
SELECT
  a.*,
  -- Indicador de Eficiência
  CASE
    WHEN a.valor_pago > 0
    THEN ROUND(
      (a.percentual_fisico * a.valor_fixado) / (a.valor_pago * 100)
    , 4)
    ELSE NULL
  END                                                       AS indicador_eficiencia,

  -- Liquidez orçamentária: pago / empenhado
  CASE
    WHEN a.valor_empenhado > 0
    THEN ROUND((a.valor_pago / a.valor_empenhado) * 100, 2)
    ELSE NULL
  END                                                       AS liquidez_orcamentaria,

  -- Execução financeira real: pago / atualizado
  CASE
    WHEN a.valor_atualizado > 0
    THEN ROUND((a.valor_pago / a.valor_atualizado) * 100, 2)
    ELSE NULL
  END                                                       AS execucao_financeira_real,

  -- Divergência físico vs financeiro (positivo = gastando antes de entregar)
  (a.percentual_financeiro - a.percentual_fisico)::DECIMAL(5,2)  AS divergencia_fisico_financeira,

  -- Saldo a empenhar
  GREATEST(a.valor_atualizado - a.valor_empenhado, 0)::DECIMAL(15,2)  AS saldo_a_empenhar,

  -- Saldo a pagar
  GREATEST(a.valor_liquidado - a.valor_pago, 0)::DECIMAL(15,2)        AS saldo_a_pagar
FROM acoes a;

COMMENT ON VIEW vw_acoes_indicadores IS
  'Ações com indicadores derivados: eficiência, liquidez, execução real, divergência. Use no dashboard.';

-- A view herda o RLS da tabela acoes automaticamente (sem necessidade de policy própria).

-- =============================================================================
-- RLS — Catálogos GLOBAIS (leitura para todos os autenticados, escrita admin)
-- =============================================================================
ALTER TABLE cat_funcoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_subfuncoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_naturezas_despesa  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_fontes_recurso     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cat_funcoes_select_autenticado"     ON cat_funcoes;
DROP POLICY IF EXISTS "cat_subfuncoes_select_autenticado"  ON cat_subfuncoes;
DROP POLICY IF EXISTS "cat_naturezas_select_autenticado"   ON cat_naturezas_despesa;
DROP POLICY IF EXISTS "cat_fontes_select_autenticado"      ON cat_fontes_recurso;
DROP POLICY IF EXISTS "cat_funcoes_write_admin"            ON cat_funcoes;
DROP POLICY IF EXISTS "cat_subfuncoes_write_admin"         ON cat_subfuncoes;
DROP POLICY IF EXISTS "cat_naturezas_write_admin"          ON cat_naturezas_despesa;
DROP POLICY IF EXISTS "cat_fontes_write_admin"             ON cat_fontes_recurso;

CREATE POLICY "cat_funcoes_select_autenticado"
  ON cat_funcoes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "cat_subfuncoes_select_autenticado"
  ON cat_subfuncoes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "cat_naturezas_select_autenticado"
  ON cat_naturezas_despesa FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "cat_fontes_select_autenticado"
  ON cat_fontes_recurso FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Escrita nos catálogos: somente admin_sistema
CREATE POLICY "cat_funcoes_write_admin"
  ON cat_funcoes FOR ALL
  USING (fn_usuario_tem_perfil(ARRAY['admin_sistema']))
  WITH CHECK (fn_usuario_tem_perfil(ARRAY['admin_sistema']));

CREATE POLICY "cat_subfuncoes_write_admin"
  ON cat_subfuncoes FOR ALL
  USING (fn_usuario_tem_perfil(ARRAY['admin_sistema']))
  WITH CHECK (fn_usuario_tem_perfil(ARRAY['admin_sistema']));

CREATE POLICY "cat_naturezas_write_admin"
  ON cat_naturezas_despesa FOR ALL
  USING (fn_usuario_tem_perfil(ARRAY['admin_sistema']))
  WITH CHECK (fn_usuario_tem_perfil(ARRAY['admin_sistema']));

CREATE POLICY "cat_fontes_write_admin"
  ON cat_fontes_recurso FOR ALL
  USING (fn_usuario_tem_perfil(ARRAY['admin_sistema']))
  WITH CHECK (fn_usuario_tem_perfil(ARRAY['admin_sistema']));

-- =============================================================================
-- RLS — Unidades Orçamentárias (multi-tenant, igual aos órgãos)
-- =============================================================================
ALTER TABLE unidades_orcamentarias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unidades_orc_select_mesmo_municipio" ON unidades_orcamentarias;
DROP POLICY IF EXISTS "unidades_orc_insert_gestores"        ON unidades_orcamentarias;
DROP POLICY IF EXISTS "unidades_orc_update_gestores"        ON unidades_orcamentarias;
DROP POLICY IF EXISTS "unidades_orc_delete_admin"           ON unidades_orcamentarias;

CREATE POLICY "unidades_orc_select_mesmo_municipio"
  ON unidades_orcamentarias FOR SELECT
  USING (municipio_id = fn_municipio_id_jwt());

CREATE POLICY "unidades_orc_insert_gestores"
  ON unidades_orcamentarias FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'prefeito', 'secretario_municipal', 'secretario_adjunto',
      'controlador_interno', 'contador', 'admin_sistema'
    ])
  );

CREATE POLICY "unidades_orc_update_gestores"
  ON unidades_orcamentarias FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'prefeito', 'secretario_municipal', 'secretario_adjunto',
      'controlador_interno', 'contador', 'admin_sistema'
    ])
  );

CREATE POLICY "unidades_orc_delete_admin"
  ON unidades_orcamentarias FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['prefeito', 'admin_sistema'])
  );

-- =============================================================================
-- Verificação
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== Migração 005 (Ações Expansão) concluída ===';
  RAISE NOTICE 'Novas tabelas: cat_funcoes, cat_subfuncoes, cat_naturezas_despesa, cat_fontes_recurso, unidades_orcamentarias';
  RAISE NOTICE 'Acoes ganhou: acao_pai_id, classificação orçamentária completa, origem, valores orçamentários';
  RAISE NOTICE 'CHECK: sub-ações não podem ter valores orçamentários';
  RAISE NOTICE 'Triggers: validar hierarquia (anti-ciclo)';
  RAISE NOTICE 'VIEW: vw_acoes_indicadores (eficiência, liquidez, execução real, divergência)';
END $$;
