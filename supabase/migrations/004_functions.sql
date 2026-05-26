-- =============================================================================
-- MonitorGov360 — Funções SQL
-- Migração: 004_functions.sql
-- Descrição: Funções de negócio, auditoria e automação do sistema.
--
-- Funções criadas:
--   1. registrar_auditoria       — INSERT na trilha de auditoria (SECURITY DEFINER)
--   2. calcular_divergencia_fisico_financeira — retorna divergência % físico vs % financeiro
--   3. atualizar_status_acoes_atrasadas — cronjob para marcar ações atrasadas
--   4. gerar_ciclo_questionarios  — gera instâncias de questionário para um ciclo
-- =============================================================================

-- =============================================================================
-- FUNÇÃO 1: registrar_auditoria
-- Insere um registro na trilha de auditoria de forma segura.
-- Usa SECURITY DEFINER para contornar o RLS da tabela auditoria
-- (que bloqueia INSERT direto por qualquer usuário).
--
-- Parâmetros:
--   p_tabela          — nome da tabela auditada
--   p_operacao        — INSERT, UPDATE ou DELETE
--   p_registro_id     — UUID do registro afetado
--   p_dados_anteriores — estado antes da operação (NULL para INSERT)
--   p_dados_novos      — estado após a operação (NULL para DELETE)
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_auditoria(
  p_tabela           TEXT,
  p_operacao         TEXT,
  p_registro_id      UUID,
  p_dados_anteriores JSONB DEFAULT NULL,
  p_dados_novos      JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
-- Definir search_path explícito por segurança (evita injeção via search_path)
SET search_path = public
AS $$
DECLARE
  v_municipio_id UUID;
  v_usuario_id   UUID;
  v_auditoria_id UUID;
BEGIN
  -- Obter contexto do usuário atual
  v_usuario_id   := auth.uid();
  v_municipio_id := (auth.jwt() ->> 'municipio_id')::UUID;

  -- Validar operação
  IF p_operacao NOT IN ('INSERT', 'UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'Operação inválida para auditoria: %. Use INSERT, UPDATE ou DELETE.', p_operacao;
  END IF;

  -- Inserir registro de auditoria
  INSERT INTO auditoria (
    municipio_id,
    tabela,
    operacao,
    registro_id,
    usuario_id,
    dados_anteriores,
    dados_novos,
    ip_address,
    user_agent
  )
  VALUES (
    v_municipio_id,
    p_tabela,
    p_operacao,
    p_registro_id,
    v_usuario_id,
    p_dados_anteriores,
    p_dados_novos,
    -- Tentar extrair IP do contexto da requisição (disponível via Supabase headers)
    (current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for')::INET,
    current_setting('request.headers', true)::jsonb ->> 'user-agent'
  )
  RETURNING id INTO v_auditoria_id;

  RETURN v_auditoria_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro na auditoria, registrar mas não bloquear a operação principal
    RAISE WARNING 'Falha ao registrar auditoria para tabela=%, operacao=%, registro=%: %',
      p_tabela, p_operacao, p_registro_id, SQLERRM;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION registrar_auditoria IS
  'Insere registro na trilha de auditoria imutável via SECURITY DEFINER. '
  'Usar esta função para registrar qualquer operação relevante de negócio.';

-- =============================================================================
-- TRIGGER HELPER: função para audit trail automático nas tabelas críticas
-- Pode ser aplicado como trigger AFTER INSERT/UPDATE/DELETE em qualquer tabela.
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_trigger_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM registrar_auditoria(
      TG_TABLE_NAME,
      'INSERT',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Só audita se houve mudança real
    IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      PERFORM registrar_auditoria(
        TG_TABLE_NAME,
        'UPDATE',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM registrar_auditoria(
      TG_TABLE_NAME,
      'DELETE',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION fn_trigger_auditoria IS
  'Trigger que registra automaticamente INSERT/UPDATE/DELETE na trilha de auditoria.';

-- Aplicar trigger de auditoria nas tabelas críticas de negócio
CREATE TRIGGER trg_auditoria_acoes
  AFTER INSERT OR UPDATE OR DELETE ON acoes
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_auditoria();

CREATE TRIGGER trg_auditoria_questionarios_instancia
  AFTER INSERT OR UPDATE OR DELETE ON questionarios_instancia
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_auditoria();

CREATE TRIGGER trg_auditoria_alertas
  AFTER INSERT OR UPDATE OR DELETE ON alertas
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_auditoria();

CREATE TRIGGER trg_auditoria_pendencias
  AFTER INSERT OR UPDATE OR DELETE ON pendencias
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_auditoria();

CREATE TRIGGER trg_auditoria_orcamento_dotacoes
  AFTER INSERT OR UPDATE OR DELETE ON orcamento_dotacoes
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_auditoria();

CREATE TRIGGER trg_auditoria_usuarios
  AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_auditoria();

CREATE TRIGGER trg_auditoria_usuario_perfis
  AFTER INSERT OR UPDATE OR DELETE ON usuario_perfis
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_auditoria();

-- =============================================================================
-- FUNÇÃO 2: calcular_divergencia_fisico_financeira
-- Calcula a diferença entre percentual físico e financeiro de uma ação.
-- Retorna um JSONB com detalhes para análise e geração de alertas.
--
-- Parâmetros:
--   p_acao_id — UUID da ação a ser analisada
--
-- Retorno JSONB:
--   {
--     "acao_id": "...",
--     "titulo": "...",
--     "percentual_fisico": 42.5,
--     "percentual_financeiro": 38.0,
--     "divergencia": 4.5,
--     "divergencia_absoluta": 4.5,
--     "classificacao": "aceitavel|atencao|critica",
--     "requer_alerta": false,
--     "valor_dotacao_total": 2500000.00,
--     "valor_empenhado_total": 1200000.00,
--     "percentual_dotacao_empenhada": 48.0
--   }
-- =============================================================================
CREATE OR REPLACE FUNCTION calcular_divergencia_fisico_financeira(p_acao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acao              RECORD;
  v_orcamento         RECORD;
  v_divergencia       DECIMAL(8,2);
  v_divergencia_abs   DECIMAL(8,2);
  v_classificacao     TEXT;
  v_requer_alerta     BOOLEAN;
  v_perc_empenhada    DECIMAL(8,2);
BEGIN
  -- Buscar dados da ação
  SELECT
    a.id,
    a.titulo,
    a.percentual_fisico,
    a.percentual_financeiro,
    a.status,
    a.municipio_id
  INTO v_acao
  FROM acoes a
  WHERE a.id = p_acao_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ação não encontrada: %', p_acao_id;
  END IF;

  -- Calcular divergência (físico - financeiro)
  -- Positivo: execução física maior que financeira (risco de inadimplência)
  -- Negativo: execução financeira maior que física (possível superfaturamento)
  v_divergencia     := v_acao.percentual_fisico - v_acao.percentual_financeiro;
  v_divergencia_abs := ABS(v_divergencia);

  -- Classificação da divergência:
  -- Aceitável: até 5 pontos percentuais
  -- Atenção:   de 5 a 15 pontos percentuais
  -- Crítica:   acima de 15 pontos percentuais
  v_classificacao := CASE
    WHEN v_divergencia_abs <= 5.0  THEN 'aceitavel'
    WHEN v_divergencia_abs <= 15.0 THEN 'atencao'
    ELSE                                'critica'
  END;

  v_requer_alerta := v_divergencia_abs > 5.0;

  -- Consolidar dados orçamentários da ação
  SELECT
    COALESCE(SUM(od.valor_dotacao + od.valor_suplementado), 0) AS valor_dotacao_total,
    COALESCE(SUM(od.valor_empenhado), 0)                       AS valor_empenhado_total,
    COALESCE(SUM(od.valor_liquidado), 0)                       AS valor_liquidado_total,
    COALESCE(SUM(od.valor_pago), 0)                            AS valor_pago_total
  INTO v_orcamento
  FROM orcamento_dotacoes od
  WHERE od.acao_id = p_acao_id;

  -- Percentual da dotação já empenhada
  v_perc_empenhada := CASE
    WHEN v_orcamento.valor_dotacao_total > 0
    THEN ROUND(
      (v_orcamento.valor_empenhado_total / v_orcamento.valor_dotacao_total) * 100,
      2
    )
    ELSE 0
  END;

  -- Retornar resultado detalhado
  RETURN jsonb_build_object(
    'acao_id',                    v_acao.id,
    'titulo',                     v_acao.titulo,
    'status',                     v_acao.status,
    'percentual_fisico',          v_acao.percentual_fisico,
    'percentual_financeiro',      v_acao.percentual_financeiro,
    'divergencia',                v_divergencia,
    'divergencia_absoluta',       v_divergencia_abs,
    'classificacao',              v_classificacao,
    'requer_alerta',              v_requer_alerta,
    'interpretacao',              CASE
                                    WHEN v_divergencia > 0
                                    THEN 'Execução física supera a financeira — verificar empenhos pendentes'
                                    WHEN v_divergencia < 0
                                    THEN 'Execução financeira supera a física — verificar possível superfaturamento'
                                    ELSE 'Execução física e financeira equilibradas'
                                  END,
    'valor_dotacao_total',        v_orcamento.valor_dotacao_total,
    'valor_empenhado_total',      v_orcamento.valor_empenhado_total,
    'valor_liquidado_total',      v_orcamento.valor_liquidado_total,
    'valor_pago_total',           v_orcamento.valor_pago_total,
    'percentual_dotacao_empenhada', v_perc_empenhada,
    'calculado_em',               NOW()
  );
END;
$$;

COMMENT ON FUNCTION calcular_divergencia_fisico_financeira IS
  'Calcula e classifica a divergência entre execução física e financeira de uma ação. '
  'Retorna JSONB com detalhes para análise e geração de alertas.';

-- =============================================================================
-- FUNÇÃO 3: atualizar_status_acoes_atrasadas
-- Função para ser executada via pg_cron ou Supabase Edge Functions agendadas.
-- Marca ações atrasadas, gera alertas de prazo crítico e retorna relatório.
--
-- Lógica:
--   - Ações com data_prevista_fim < HOJE e status IN (em_licitacao, em_execucao)
--     → gera alerta 'prazo_critico'
--   - Ações com status 'paralisada' há mais de 30 dias
--     → gera alerta 'obra_paralisada' com nível alto
--   - Questionários com data_prazo < AGORA e status IN (pendente, em_andamento)
--     → atualiza status para 'atrasado' e gera alerta 'questionario_atrasado'
--
-- Retorna: JSONB com resumo da execução
-- =============================================================================
CREATE OR REPLACE FUNCTION atualizar_status_acoes_atrasadas()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acoes_atrasadas         INTEGER := 0;
  v_alertas_prazo           INTEGER := 0;
  v_alertas_paralisadas     INTEGER := 0;
  v_questionarios_atrasados INTEGER := 0;
  v_alertas_questionarios   INTEGER := 0;
  v_acao                    RECORD;
  v_questionario            RECORD;
BEGIN
  -- ==========================================================================
  -- 1. AÇÕES COM PRAZO VENCIDO (em_execucao ou em_licitacao)
  -- ==========================================================================
  FOR v_acao IN
    SELECT
      a.id,
      a.municipio_id,
      a.titulo,
      a.status,
      a.data_prevista_fim,
      a.responsavel_id,
      (CURRENT_DATE - a.data_prevista_fim) AS dias_atraso
    FROM acoes a
    WHERE a.data_prevista_fim < CURRENT_DATE
      AND a.status IN ('em_licitacao', 'em_execucao')
      -- Não gerar alerta duplicado ativo
      AND NOT EXISTS (
        SELECT 1 FROM alertas al
        WHERE al.acao_id = a.id
          AND al.tipo = 'prazo_critico'
          AND al.status = 'ativo'
      )
  LOOP
    -- Gerar alerta de prazo crítico
    INSERT INTO alertas (
      municipio_id,
      acao_id,
      tipo,
      titulo,
      descricao,
      nivel_gravidade,
      status,
      destinatario_perfil
    )
    VALUES (
      v_acao.municipio_id,
      v_acao.id,
      'prazo_critico',
      'Prazo vencido: ' || v_acao.titulo,
      FORMAT(
        'A ação "%s" está com prazo vencido há %s dia(s). Status atual: %s. Data prevista de conclusão: %s.',
        v_acao.titulo,
        v_acao.dias_atraso,
        v_acao.status,
        TO_CHAR(v_acao.data_prevista_fim, 'DD/MM/YYYY')
      ),
      -- Quanto mais dias de atraso, maior a gravidade
      CASE
        WHEN v_acao.dias_atraso > 90 THEN 'critico'
        WHEN v_acao.dias_atraso > 30 THEN 'alto'
        WHEN v_acao.dias_atraso > 7  THEN 'medio'
        ELSE                              'baixo'
      END,
      'ativo',
      'secretario_municipal'
    );

    v_alertas_prazo := v_alertas_prazo + 1;
    v_acoes_atrasadas := v_acoes_atrasadas + 1;
  END LOOP;

  -- ==========================================================================
  -- 2. AÇÕES PARALISADAS HÁ MAIS DE 30 DIAS
  -- ==========================================================================
  FOR v_acao IN
    SELECT
      a.id,
      a.municipio_id,
      a.titulo,
      a.updated_at,
      (CURRENT_DATE - a.updated_at::DATE) AS dias_paralisada
    FROM acoes a
    WHERE a.status = 'paralisada'
      AND a.updated_at < NOW() - INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM alertas al
        WHERE al.acao_id = a.id
          AND al.tipo = 'obra_paralisada'
          AND al.status = 'ativo'
          AND al.created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO alertas (
      municipio_id,
      acao_id,
      tipo,
      titulo,
      descricao,
      nivel_gravidade,
      status,
      destinatario_perfil
    )
    VALUES (
      v_acao.municipio_id,
      v_acao.id,
      'obra_paralisada',
      'Ação paralisada há ' || v_acao.dias_paralisada || ' dias: ' || v_acao.titulo,
      FORMAT(
        'A ação "%s" está com status PARALISADA há %s dias, desde %s. '
        'Verifique as causas e providencie retomada ou cancelamento.',
        v_acao.titulo,
        v_acao.dias_paralisada,
        TO_CHAR(v_acao.updated_at, 'DD/MM/YYYY')
      ),
      CASE
        WHEN v_acao.dias_paralisada > 180 THEN 'critico'
        WHEN v_acao.dias_paralisada > 90  THEN 'alto'
        ELSE                                   'medio'
      END,
      'ativo',
      'prefeito'
    );

    v_alertas_paralisadas := v_alertas_paralisadas + 1;
  END LOOP;

  -- ==========================================================================
  -- 3. QUESTIONÁRIOS ATRASADOS
  -- Atualizar status e gerar alertas de omissão
  -- ==========================================================================
  FOR v_questionario IN
    SELECT
      qi.id,
      qi.municipio_id,
      qi.acao_id,
      qi.responsavel_id,
      qi.data_prazo,
      a.titulo AS titulo_acao
    FROM questionarios_instancia qi
    JOIN acoes a ON a.id = qi.acao_id
    WHERE qi.data_prazo < NOW()
      AND qi.status IN ('pendente', 'em_andamento')
  LOOP
    -- Marcar questionário como atrasado
    UPDATE questionarios_instancia
    SET status = 'atrasado'
    WHERE id = v_questionario.id;

    v_questionarios_atrasados := v_questionarios_atrasados + 1;

    -- Gerar alerta apenas se não existir um ativo recente
    IF NOT EXISTS (
      SELECT 1 FROM alertas al
      WHERE al.questionario_id = v_questionario.id
        AND al.tipo = 'questionario_atrasado'
        AND al.status = 'ativo'
    ) THEN
      INSERT INTO alertas (
        municipio_id,
        acao_id,
        questionario_id,
        tipo,
        titulo,
        descricao,
        nivel_gravidade,
        status,
        destinatario_perfil
      )
      VALUES (
        v_questionario.municipio_id,
        v_questionario.acao_id,
        v_questionario.id,
        'questionario_atrasado',
        'Questionário não respondido: ' || v_questionario.titulo_acao,
        FORMAT(
          'O responsável não respondeu o questionário de monitoramento da ação "%s". '
          'Prazo encerrado em %s.',
          v_questionario.titulo_acao,
          TO_CHAR(v_questionario.data_prazo, 'DD/MM/YYYY HH24:MI')
        ),
        'medio',
        'ativo',
        'secretario_municipal'
      );

      -- Gerar pendência para o responsável
      INSERT INTO pendencias (
        municipio_id,
        questionario_id,
        acao_id,
        titulo,
        descricao,
        responsavel_id,
        prazo,
        status,
        created_by
      )
      VALUES (
        v_questionario.municipio_id,
        v_questionario.id,
        v_questionario.acao_id,
        'Responder questionário em atraso: ' || v_questionario.titulo_acao,
        FORMAT(
          'O questionário de monitoramento estava com prazo em %s e não foi respondido. '
          'Responda imediatamente ou justifique o atraso.',
          TO_CHAR(v_questionario.data_prazo, 'DD/MM/YYYY HH24:MI')
        ),
        v_questionario.responsavel_id,
        CURRENT_DATE + 2,  -- prazo de 2 dias para regularização
        'aberta',
        NULL  -- gerado pelo sistema
      );

      v_alertas_questionarios := v_alertas_questionarios + 1;
    END IF;
  END LOOP;

  -- ==========================================================================
  -- 4. VERIFICAR DIVERGÊNCIAS FÍSICO-FINANCEIRAS EM AÇÕES EM EXECUÇÃO
  -- ==========================================================================
  FOR v_acao IN
    SELECT a.id, a.municipio_id, a.titulo
    FROM acoes a
    WHERE a.status = 'em_execucao'
      AND NOT EXISTS (
        SELECT 1 FROM alertas al
        WHERE al.acao_id = a.id
          AND al.tipo = 'divergencia_fisico_financeira'
          AND al.status = 'ativo'
          AND al.created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    DECLARE
      v_divergencia JSONB;
    BEGIN
      v_divergencia := calcular_divergencia_fisico_financeira(v_acao.id);

      IF (v_divergencia ->> 'requer_alerta')::BOOLEAN THEN
        INSERT INTO alertas (
          municipio_id,
          acao_id,
          tipo,
          titulo,
          descricao,
          nivel_gravidade,
          status,
          destinatario_perfil
        )
        VALUES (
          v_acao.municipio_id,
          v_acao.id,
          'divergencia_fisico_financeira',
          FORMAT(
            'Divergência físico-financeira (%s%%): %s',
            v_divergencia ->> 'divergencia_absoluta',
            v_acao.titulo
          ),
          FORMAT(
            '%s. Execução física: %s%% | Execução financeira: %s%%.',
            v_divergencia ->> 'interpretacao',
            v_divergencia ->> 'percentual_fisico',
            v_divergencia ->> 'percentual_financeiro'
          ),
          CASE v_divergencia ->> 'classificacao'
            WHEN 'atencao'  THEN 'medio'
            WHEN 'critica'  THEN 'alto'
            ELSE                 'baixo'
          END,
          'ativo',
          'controlador_interno'
        );
      END IF;
    END;
  END LOOP;

  -- Retornar relatório de execução
  RETURN jsonb_build_object(
    'executado_em',               NOW(),
    'acoes_atrasadas',            v_acoes_atrasadas,
    'alertas_prazo_critico',      v_alertas_prazo,
    'alertas_paralisadas',        v_alertas_paralisadas,
    'questionarios_atrasados',    v_questionarios_atrasados,
    'alertas_questionarios',      v_alertas_questionarios,
    'total_alertas_gerados',      v_alertas_prazo + v_alertas_paralisadas + v_alertas_questionarios
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em atualizar_status_acoes_atrasadas: %', SQLERRM;
    RETURN jsonb_build_object(
      'executado_em', NOW(),
      'erro',         SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION atualizar_status_acoes_atrasadas IS
  'Cronjob que verifica ações atrasadas, obras paralisadas e questionários não respondidos, '
  'gerando alertas e pendências automaticamente. Executar diariamente via pg_cron.';

-- =============================================================================
-- FUNÇÃO 4: gerar_ciclo_questionarios
-- Cria instâncias de questionários para todas as ações ativas de um município
-- no período de um ciclo de monitoramento.
--
-- Parâmetros:
--   p_municipio_id — UUID do município
--   p_data_inicio  — data de início do ciclo
--   p_data_fim     — data de fim do ciclo
--   p_ciclo_tipo   — tipo do ciclo: 'semanal', 'quinzenal' ou 'mensal'
--
-- Lógica:
--   1. Criar o ciclo_monitoramento
--   2. Para cada ação ativa (em_execucao, em_licitacao) do município:
--      a. Buscar o modelo_questionario correspondente ao tipo da ação e ciclo
--      b. Criar questionarios_instancia para o responsável principal
--      c. Criar questionarios_instancia para o responsável secundário (se houver)
--   3. Retornar relatório com quantidade de questionários criados
--
-- Retorno: JSONB com resumo da operação
-- =============================================================================
CREATE OR REPLACE FUNCTION gerar_ciclo_questionarios(
  p_municipio_id UUID,
  p_data_inicio  DATE,
  p_data_fim     DATE,
  p_ciclo_tipo   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ciclo_id            UUID;
  v_questionarios_criados INTEGER := 0;
  v_acoes_sem_modelo    INTEGER := 0;
  v_acao                RECORD;
  v_modelo_id           UUID;
  v_data_prazo          TIMESTAMPTZ;
  v_existe_ciclo        BOOLEAN;
BEGIN
  -- Validar parâmetros
  IF p_ciclo_tipo NOT IN ('semanal', 'quinzenal', 'mensal') THEN
    RAISE EXCEPTION 'Tipo de ciclo inválido: %. Use semanal, quinzenal ou mensal.', p_ciclo_tipo;
  END IF;

  IF p_data_fim < p_data_inicio THEN
    RAISE EXCEPTION 'data_fim (%) deve ser maior ou igual a data_inicio (%).', p_data_fim, p_data_inicio;
  END IF;

  -- Verificar se já existe ciclo ativo sobreposto para o município
  SELECT EXISTS (
    SELECT 1
    FROM ciclos_monitoramento cm
    WHERE cm.municipio_id = p_municipio_id
      AND cm.status = 'ativo'
      AND cm.ciclo = p_ciclo_tipo
      AND (
        (cm.data_inicio <= p_data_fim AND cm.data_fim >= p_data_inicio)
      )
  ) INTO v_existe_ciclo;

  IF v_existe_ciclo THEN
    RAISE EXCEPTION
      'Já existe um ciclo % ativo com datas sobrepostas para o município %.', p_ciclo_tipo, p_municipio_id;
  END IF;

  -- -------------------------------------------------------------------------
  -- 1. Criar o ciclo de monitoramento
  -- -------------------------------------------------------------------------
  INSERT INTO ciclos_monitoramento (municipio_id, data_inicio, data_fim, ciclo, status)
  VALUES (p_municipio_id, p_data_inicio, p_data_fim, p_ciclo_tipo, 'ativo')
  RETURNING id INTO v_ciclo_id;

  -- Prazo para resposta: fim do ciclo mais 2 dias
  v_data_prazo := (p_data_fim + INTERVAL '2 days')::TIMESTAMPTZ + TIME '23:59:00';

  -- -------------------------------------------------------------------------
  -- 2. Para cada ação ativa do município, criar instâncias de questionário
  -- -------------------------------------------------------------------------
  FOR v_acao IN
    SELECT
      a.id,
      a.tipo,
      a.responsavel_id,
      a.responsavel_secundario_id,
      a.titulo
    FROM acoes a
    WHERE a.municipio_id = p_municipio_id
      AND a.status IN ('em_execucao', 'em_licitacao')
      AND a.responsavel_id IS NOT NULL
  LOOP
    -- Buscar modelo de questionário para o tipo e ciclo da ação
    -- Prioridade: modelo local do município > modelo global
    SELECT id INTO v_modelo_id
    FROM modelos_questionario
    WHERE tipo_acao = v_acao.tipo
      AND ciclo = p_ciclo_tipo
      AND ativo = true
      AND (municipio_id = p_municipio_id OR municipio_id IS NULL)
    ORDER BY
      -- Prioriza modelo local (municipio_id NOT NULL)
      CASE WHEN municipio_id IS NOT NULL THEN 0 ELSE 1 END
    LIMIT 1;

    -- Se não encontrar modelo, pular esta ação e contabilizar
    IF v_modelo_id IS NULL THEN
      v_acoes_sem_modelo := v_acoes_sem_modelo + 1;
      RAISE NOTICE 'Modelo de questionário não encontrado para ação tipo=%, ciclo=%. Ação: %',
        v_acao.tipo, p_ciclo_tipo, v_acao.titulo;
      CONTINUE;
    END IF;

    -- Criar questionário para o RESPONSÁVEL PRINCIPAL
    BEGIN
      INSERT INTO questionarios_instancia (
        municipio_id,
        acao_id,
        ciclo_id,
        modelo_id,
        responsavel_id,
        status,
        data_envio,
        data_prazo
      )
      VALUES (
        p_municipio_id,
        v_acao.id,
        v_ciclo_id,
        v_modelo_id,
        v_acao.responsavel_id,
        'pendente',
        NOW(),
        v_data_prazo
      );
      v_questionarios_criados := v_questionarios_criados + 1;

    EXCEPTION WHEN unique_violation THEN
      -- Questionário já existe para este responsável/ação/ciclo — ignorar
      NULL;
    END;

    -- Criar questionário para o RESPONSÁVEL SECUNDÁRIO (se houver e for diferente)
    IF v_acao.responsavel_secundario_id IS NOT NULL
       AND v_acao.responsavel_secundario_id <> v_acao.responsavel_id
    THEN
      BEGIN
        INSERT INTO questionarios_instancia (
          municipio_id,
          acao_id,
          ciclo_id,
          modelo_id,
          responsavel_id,
          status,
          data_envio,
          data_prazo
        )
        VALUES (
          p_municipio_id,
          v_acao.id,
          v_ciclo_id,
          v_modelo_id,
          v_acao.responsavel_secundario_id,
          'pendente',
          NOW(),
          v_data_prazo
        );
        v_questionarios_criados := v_questionarios_criados + 1;

      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END IF;

  END LOOP;

  -- -------------------------------------------------------------------------
  -- 3. Registrar a geração na auditoria
  -- -------------------------------------------------------------------------
  PERFORM registrar_auditoria(
    'ciclos_monitoramento',
    'INSERT',
    v_ciclo_id,
    NULL,
    jsonb_build_object(
      'ciclo_id',              v_ciclo_id,
      'municipio_id',          p_municipio_id,
      'data_inicio',           p_data_inicio,
      'data_fim',              p_data_fim,
      'ciclo_tipo',            p_ciclo_tipo,
      'questionarios_criados', v_questionarios_criados
    )
  );

  -- Retornar relatório
  RETURN jsonb_build_object(
    'sucesso',                true,
    'ciclo_id',               v_ciclo_id,
    'municipio_id',           p_municipio_id,
    'data_inicio',            p_data_inicio,
    'data_fim',               p_data_fim,
    'ciclo_tipo',             p_ciclo_tipo,
    'data_prazo_resposta',    v_data_prazo,
    'questionarios_criados',  v_questionarios_criados,
    'acoes_sem_modelo',       v_acoes_sem_modelo,
    'gerado_em',              NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automático do ciclo criado em caso de erro
    RAISE WARNING 'Erro ao gerar ciclo de questionários: %', SQLERRM;
    RAISE;  -- Re-lança a exceção para rollback completo
END;
$$;

COMMENT ON FUNCTION gerar_ciclo_questionarios IS
  'Cria um ciclo de monitoramento e gera instâncias de questionário para todas as ações '
  'ativas do município. Deve ser chamada no início de cada período de monitoramento.';

-- =============================================================================
-- FUNÇÃO AUXILIAR: verificar_saude_sistema
-- Retorna um diagnóstico geral do município para o painel de controle.
-- =============================================================================
CREATE OR REPLACE FUNCTION verificar_saude_sistema(p_municipio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resultado JSONB;
BEGIN
  SELECT jsonb_build_object(
    'municipio_id',             p_municipio_id,
    'calculado_em',             NOW(),

    -- Ações por status
    'acoes', (
      SELECT jsonb_object_agg(status, total)
      FROM (
        SELECT status, COUNT(*) AS total
        FROM acoes
        WHERE municipio_id = p_municipio_id
        GROUP BY status
      ) s
    ),

    -- Alertas ativos por nível
    'alertas_ativos', (
      SELECT jsonb_object_agg(nivel_gravidade, total)
      FROM (
        SELECT nivel_gravidade, COUNT(*) AS total
        FROM alertas
        WHERE municipio_id = p_municipio_id
          AND status = 'ativo'
        GROUP BY nivel_gravidade
      ) a
    ),

    -- Questionários do ciclo atual
    'questionarios_ciclo_atual', (
      SELECT jsonb_object_agg(status, total)
      FROM (
        SELECT qi.status, COUNT(*) AS total
        FROM questionarios_instancia qi
        JOIN ciclos_monitoramento cm ON cm.id = qi.ciclo_id
        WHERE qi.municipio_id = p_municipio_id
          AND cm.status = 'ativo'
        GROUP BY qi.status
      ) q
    ),

    -- Execução orçamentária consolidada
    'orcamento_consolidado', (
      SELECT jsonb_build_object(
        'dotacao_total',     COALESCE(SUM(valor_dotacao + valor_suplementado), 0),
        'empenhado_total',   COALESCE(SUM(valor_empenhado), 0),
        'liquidado_total',   COALESCE(SUM(valor_liquidado), 0),
        'pago_total',        COALESCE(SUM(valor_pago), 0),
        'exercicio',         MAX(exercicio)
      )
      FROM orcamento_dotacoes
      WHERE municipio_id = p_municipio_id
        AND exercicio = EXTRACT(YEAR FROM NOW())::INTEGER
    ),

    -- Pendências abertas
    'pendencias_abertas', (
      SELECT COUNT(*)
      FROM pendencias
      WHERE municipio_id = p_municipio_id
        AND status IN ('aberta', 'em_andamento')
    ),

    -- Ações com prazo vencido
    'acoes_prazo_vencido', (
      SELECT COUNT(*)
      FROM acoes
      WHERE municipio_id = p_municipio_id
        AND data_prevista_fim < CURRENT_DATE
        AND status IN ('em_licitacao', 'em_execucao')
    )
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$$;

COMMENT ON FUNCTION verificar_saude_sistema IS
  'Retorna diagnóstico consolidado do município: ações por status, alertas, questionários, '
  'execução orçamentária e pendências. Usado no painel executivo.';

-- =============================================================================
-- SUGESTÃO DE AGENDAMENTO via pg_cron (descomentar quando pg_cron estiver ativo)
-- =============================================================================
-- Executar verificação de atrasos todos os dias às 06:00 (horário do servidor)
-- SELECT cron.schedule(
--   'monitorgov360-verificar-atrasos',
--   '0 6 * * *',  -- diariamente às 06:00
--   $$SELECT atualizar_status_acoes_atrasadas()$$
-- );

-- Exemplo de agendamento para gerar ciclos semanais toda segunda-feira às 07:00
-- SELECT cron.schedule(
--   'monitorgov360-gerar-ciclos-semanais',
--   '0 7 * * 1',  -- toda segunda-feira às 07:00
--   $$
--     SELECT gerar_ciclo_questionarios(
--       municipio_id,
--       CURRENT_DATE,
--       CURRENT_DATE + 6,
--       'semanal'
--     )
--     FROM municipios
--     WHERE ativo = true AND plano IN ('intermediario', 'premium', 'consorcio')
--   $$
-- );
