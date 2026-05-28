-- =============================================================================
-- MonitorGov360 — Trava de profundidade máxima na hierarquia de Ações
-- Migração: 008_trava_profundidade_acoes.sql
-- Descrição: Garante que a hierarquia Macro → Sub-ação tem APENAS 1 nível.
--   Sub-ação NÃO pode ter sub-sub-ação. Decisão de modelo validada com o
--   usuário na Fase A.4.
--
-- Atualiza fn_validar_hierarquia_acao para também rejeitar o caso em que o
-- pai informado já é uma sub-ação. Mantém a checagem anti-ciclo existente.
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_validar_hierarquia_acao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_pai_atual UUID;
  v_pai_do_pai UUID;
  v_profundidade INTEGER := 0;
  v_max_profundidade CONSTANT INTEGER := 10;
BEGIN
  -- Sem pai → é ação macro raiz, nada a validar
  IF NEW.acao_pai_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Não pode ser pai de si mesma
  IF NEW.acao_pai_id = NEW.id THEN
    RAISE EXCEPTION 'Uma ação não pode ser pai de si mesma (id=%)', NEW.id;
  END IF;

  -- TRAVA DE PROFUNDIDADE: o pai informado deve ser ele próprio uma MACRO
  -- (acao_pai_id IS NULL). Isso garante hierarquia de exatamente 1 nível.
  SELECT acao_pai_id INTO v_pai_do_pai
  FROM acoes
  WHERE id = NEW.acao_pai_id;

  IF v_pai_do_pai IS NOT NULL THEN
    RAISE EXCEPTION
      'A ação selecionada como pai (id=%) já é uma sub-ação. Profundidade máxima permitida: 1.',
      NEW.acao_pai_id;
  END IF;

  -- Anti-ciclo: subindo na cadeia, se encontrar NEW.id antes do topo → ciclo
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

COMMENT ON FUNCTION fn_validar_hierarquia_acao IS
  'Garante: 1) sem ciclos, 2) profundidade máxima 1 (sub-ação não pode ter sub-sub-ação).';

DO $$
BEGIN
  RAISE NOTICE '=== Migração 008 — Trava de profundidade aplicada ===';
  RAISE NOTICE 'Regra: macro → sub-ação. Sub-sub-ação bloqueada via trigger.';
END $$;
