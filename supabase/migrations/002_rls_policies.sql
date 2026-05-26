-- =============================================================================
-- MonitorGov360 — Row Level Security (RLS)
-- Migração: 002_rls_policies.sql
-- Descrição: Habilitação de RLS e criação de políticas de acesso para todas
--            as tabelas. Isolamento multi-tenant via municipio_id no JWT.
--
-- Princípios de segurança:
--   1. Toda tabela tem RLS habilitado.
--   2. Usuários só acessam dados do seu próprio município.
--   3. O municipio_id é extraído do JWT: auth.jwt()->>'municipio_id'
--   4. A tabela auditoria é INSERT-only via SECURITY DEFINER (sem acesso direto).
--   5. perfis_sistema é leitura global para todos os autenticados.
-- =============================================================================

-- =============================================================================
-- HELPER: função para obter municipio_id do JWT do usuário atual
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_municipio_id_jwt()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (auth.jwt() ->> 'municipio_id')::UUID;
$$;

COMMENT ON FUNCTION fn_municipio_id_jwt IS 'Extrai o municipio_id do JWT do usuário autenticado.';

-- =============================================================================
-- HELPER: função para verificar se o usuário tem determinado perfil
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_usuario_tem_perfil(perfis TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM usuario_perfis up
    WHERE up.usuario_id    = auth.uid()
      AND up.perfil_codigo = ANY(perfis)
      AND up.ativo         = true
      AND up.municipio_id  = fn_municipio_id_jwt()
  );
$$;

COMMENT ON FUNCTION fn_usuario_tem_perfil IS 'Verifica se o usuário atual possui ao menos um dos perfis informados.';

-- =============================================================================
-- TABELA: municipios
-- Leitura pública (necessária para resolver subdomain → municipio_id no login).
-- Escrita apenas por admin_sistema ou service_role.
-- =============================================================================
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (inclusive anônimo) pode consultar municípios ativos
-- para resolver o subdomínio no login.
CREATE POLICY "municipios_select_publico"
  ON municipios FOR SELECT
  USING (true);

COMMENT ON POLICY "municipios_select_publico" ON municipios
  IS 'Leitura pública de municípios para resolução de subdomínio no login.';

-- Apenas admin_sistema pode inserir novos municípios
CREATE POLICY "municipios_insert_admin"
  ON municipios FOR INSERT
  WITH CHECK (fn_usuario_tem_perfil(ARRAY['admin_sistema']));

COMMENT ON POLICY "municipios_insert_admin" ON municipios
  IS 'Somente admin_sistema pode cadastrar novos municípios (tenants).';

-- Apenas admin_sistema pode alterar dados do município
CREATE POLICY "municipios_update_admin"
  ON municipios FOR UPDATE
  USING (fn_usuario_tem_perfil(ARRAY['admin_sistema']));

COMMENT ON POLICY "municipios_update_admin" ON municipios
  IS 'Somente admin_sistema pode atualizar dados de municípios.';

-- Nenhum usuário pode excluir municípios (operação apenas por service_role)
CREATE POLICY "municipios_delete_ninguem"
  ON municipios FOR DELETE
  USING (false);

COMMENT ON POLICY "municipios_delete_ninguem" ON municipios
  IS 'Exclusão de municípios bloqueada para todos — apenas service_role via backend.';

-- =============================================================================
-- TABELA: perfis_sistema
-- Catálogo global, somente leitura para todos os autenticados.
-- =============================================================================
ALTER TABLE perfis_sistema ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler o catálogo de perfis
CREATE POLICY "perfis_sistema_select_autenticado"
  ON perfis_sistema FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "perfis_sistema_select_autenticado" ON perfis_sistema
  IS 'Catálogo de perfis é leitura global para todos os usuários autenticados.';

-- Apenas admin_sistema e suporte_tecnico podem gerenciar perfis
CREATE POLICY "perfis_sistema_insert_admin"
  ON perfis_sistema FOR INSERT
  WITH CHECK (fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico']));

CREATE POLICY "perfis_sistema_update_admin"
  ON perfis_sistema FOR UPDATE
  USING (fn_usuario_tem_perfil(ARRAY['admin_sistema']));

CREATE POLICY "perfis_sistema_delete_ninguem"
  ON perfis_sistema FOR DELETE
  USING (false);

COMMENT ON POLICY "perfis_sistema_delete_ninguem" ON perfis_sistema
  IS 'Perfis do sistema não podem ser excluídos por nenhum usuário.';

-- =============================================================================
-- TABELA: usuarios
-- Usuário vê e edita apenas dados do seu próprio município.
-- =============================================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Usuário vê todos os usuários do seu município (necessário para dropdown de responsáveis)
CREATE POLICY "usuarios_select_municipio"
  ON usuarios FOR SELECT
  TO authenticated
  USING (municipio_id = fn_municipio_id_jwt());

COMMENT ON POLICY "usuarios_select_municipio" ON usuarios
  IS 'Usuário vê apenas usuários do seu próprio município.';

-- Apenas admin_sistema e suporte_tecnico podem criar usuários diretamente na tabela
-- (o fluxo normal é via Supabase Auth + trigger)
CREATE POLICY "usuarios_insert_admin"
  ON usuarios FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico', 'prefeito'])
  );

COMMENT ON POLICY "usuarios_insert_admin" ON usuarios
  IS 'Apenas admin_sistema, suporte_tecnico ou prefeito podem criar usuários.';

-- Usuário pode editar seu próprio perfil; admins e prefeitos editam qualquer usuário do município
CREATE POLICY "usuarios_update_proprio_ou_admin"
  ON usuarios FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      id = auth.uid()
      OR fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico', 'prefeito'])
    )
  );

COMMENT ON POLICY "usuarios_update_proprio_ou_admin" ON usuarios
  IS 'Usuário edita seu próprio perfil; admins e prefeito editam qualquer usuário do município.';

-- Exclusão bloqueada — usuários são desativados (ativo = false), não excluídos
CREATE POLICY "usuarios_delete_ninguem"
  ON usuarios FOR DELETE
  USING (false);

COMMENT ON POLICY "usuarios_delete_ninguem" ON usuarios
  IS 'Usuários não são excluídos — apenas desativados (ativo = false).';

-- =============================================================================
-- TABELA: usuario_perfis
-- Gerenciamento de RBAC dentro do município.
-- =============================================================================
ALTER TABLE usuario_perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_perfis_select_municipio"
  ON usuario_perfis FOR SELECT
  TO authenticated
  USING (municipio_id = fn_municipio_id_jwt());

COMMENT ON POLICY "usuario_perfis_select_municipio" ON usuario_perfis
  IS 'Usuário vê apenas vínculos de perfil do seu município.';

-- Apenas prefeito, admin_sistema ou suporte_tecnico podem atribuir perfis
CREATE POLICY "usuario_perfis_insert_admin"
  ON usuario_perfis FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico', 'prefeito'])
  );

COMMENT ON POLICY "usuario_perfis_insert_admin" ON usuario_perfis
  IS 'Apenas prefeito, admin_sistema ou suporte_tecnico atribuem perfis.';

CREATE POLICY "usuario_perfis_update_admin"
  ON usuario_perfis FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico', 'prefeito'])
  );

CREATE POLICY "usuario_perfis_delete_admin"
  ON usuario_perfis FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema', 'prefeito'])
  );

-- =============================================================================
-- TABELA: orgaos
-- Secretarias e órgãos municipais.
-- =============================================================================
ALTER TABLE orgaos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgaos_select_municipio"
  ON orgaos FOR SELECT
  TO authenticated
  USING (municipio_id = fn_municipio_id_jwt());

COMMENT ON POLICY "orgaos_select_municipio" ON orgaos
  IS 'Usuário vê apenas órgãos do seu município.';

-- Prefeito e admin podem criar e editar órgãos
CREATE POLICY "orgaos_insert_admin"
  ON orgaos FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico', 'prefeito'])
  );

COMMENT ON POLICY "orgaos_insert_admin" ON orgaos
  IS 'Apenas prefeito e administradores podem cadastrar novos órgãos.';

CREATE POLICY "orgaos_update_admin"
  ON orgaos FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico', 'prefeito'])
  );

CREATE POLICY "orgaos_delete_admin"
  ON orgaos FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

COMMENT ON POLICY "orgaos_delete_admin" ON orgaos
  IS 'Exclusão de órgãos restrita a admin_sistema.';

-- =============================================================================
-- TABELA: acoes
-- Regras especiais:
--   - Prefeito e secretários veem TODAS as ações do município.
--   - Gestores e fiscais veem apenas as ações que são responsáveis.
--   - Vereadores e monitores externos (jornalista, cidadão) veem ações concluídas.
-- =============================================================================
ALTER TABLE acoes ENABLE ROW LEVEL SECURITY;

-- SELECT: prefeito/secretário/admin veem tudo; gestor vê apenas as suas;
-- vereador e monitor externo veem apenas concluídas
CREATE POLICY "acoes_select_por_perfil"
  ON acoes FOR SELECT
  TO authenticated
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      -- Perfis de alta gestão: visão completa
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'secretario_adjunto',
        'controlador_interno', 'admin_sistema', 'suporte_tecnico'
      ])
      -- Gestor, fiscal, engenheiro: apenas ações em que é responsável
      OR (
        fn_usuario_tem_perfil(ARRAY[
          'gestor_acao', 'fiscal_contrato', 'engenheiro_obra',
          'contador', 'assessor_gabinete', 'coordenador_programa', 'agente_campo'
        ])
        AND (responsavel_id = auth.uid() OR responsavel_secundario_id = auth.uid())
      )
      -- Monitoramento externo: apenas ações concluídas
      OR (
        fn_usuario_tem_perfil(ARRAY[
          'vereador_monitor', 'jornalista_transparencia', 'cidadao_monitor'
        ])
        AND status = 'concluida'
      )
    )
  );

COMMENT ON POLICY "acoes_select_por_perfil" ON acoes
  IS 'Gestores veem apenas suas ações; secretários/prefeito veem todas; externos apenas concluídas.';

-- INSERT: secretários e gestores podem criar ações no seu município
CREATE POLICY "acoes_insert_gestores"
  ON acoes FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'prefeito', 'secretario_municipal', 'secretario_adjunto',
      'gestor_acao', 'coordenador_programa', 'admin_sistema'
    ])
  );

COMMENT ON POLICY "acoes_insert_gestores" ON acoes
  IS 'Secretários, gestores e prefeito podem criar novas ações.';

-- UPDATE: responsável da ação, secretário do órgão ou prefeito podem editar
CREATE POLICY "acoes_update_responsavel_ou_secretario"
  ON acoes FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'secretario_adjunto', 'admin_sistema'
      ])
      OR (
        fn_usuario_tem_perfil(ARRAY['gestor_acao', 'coordenador_programa'])
        AND (responsavel_id = auth.uid() OR responsavel_secundario_id = auth.uid())
      )
    )
  );

COMMENT ON POLICY "acoes_update_responsavel_ou_secretario" ON acoes
  IS 'Responsável da ação, secretários e prefeito podem editar ações.';

-- DELETE: apenas admin_sistema pode excluir
CREATE POLICY "acoes_delete_admin"
  ON acoes FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

COMMENT ON POLICY "acoes_delete_admin" ON acoes
  IS 'Exclusão de ações restrita ao admin_sistema.';

-- =============================================================================
-- TABELA: modelos_questionario
-- Modelos globais (municipio_id IS NULL) são leitura para todos.
-- Modelos locais são visíveis apenas para o município dono.
-- =============================================================================
ALTER TABLE modelos_questionario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modelos_questionario_select"
  ON modelos_questionario FOR SELECT
  TO authenticated
  USING (
    municipio_id IS NULL  -- modelo global
    OR municipio_id = fn_municipio_id_jwt()
  );

COMMENT ON POLICY "modelos_questionario_select" ON modelos_questionario
  IS 'Modelos globais (municipio_id NULL) são visíveis para todos; modelos locais apenas para o município.';

CREATE POLICY "modelos_questionario_insert"
  ON modelos_questionario FOR INSERT
  WITH CHECK (
    fn_usuario_tem_perfil(ARRAY[
      'admin_sistema', 'suporte_tecnico', 'prefeito',
      'secretario_municipal', 'controlador_interno'
    ])
    AND (
      municipio_id IS NULL  -- apenas admin_sistema cria modelos globais
        AND fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico'])
      OR municipio_id = fn_municipio_id_jwt()
    )
  );

CREATE POLICY "modelos_questionario_update"
  ON modelos_questionario FOR UPDATE
  USING (
    (municipio_id = fn_municipio_id_jwt()
      AND fn_usuario_tem_perfil(ARRAY[
        'admin_sistema', 'prefeito', 'secretario_municipal', 'controlador_interno'
      ]))
    OR (municipio_id IS NULL AND fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico']))
  );

CREATE POLICY "modelos_questionario_delete"
  ON modelos_questionario FOR DELETE
  USING (fn_usuario_tem_perfil(ARRAY['admin_sistema']));

-- =============================================================================
-- TABELA: ciclos_monitoramento
-- =============================================================================
ALTER TABLE ciclos_monitoramento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ciclos_select_municipio"
  ON ciclos_monitoramento FOR SELECT
  TO authenticated
  USING (municipio_id = fn_municipio_id_jwt());

CREATE POLICY "ciclos_insert_admin"
  ON ciclos_monitoramento FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'admin_sistema', 'suporte_tecnico', 'prefeito',
      'secretario_municipal', 'controlador_interno'
    ])
  );

COMMENT ON POLICY "ciclos_insert_admin" ON ciclos_monitoramento
  IS 'Apenas gestores de alto nível podem criar ciclos de monitoramento.';

CREATE POLICY "ciclos_update_admin"
  ON ciclos_monitoramento FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'admin_sistema', 'prefeito', 'secretario_municipal', 'controlador_interno'
    ])
  );

CREATE POLICY "ciclos_delete_admin"
  ON ciclos_monitoramento FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

-- =============================================================================
-- TABELA: questionarios_instancia
-- Regras especiais:
--   - Responsável vê seus questionários.
--   - Secretário vê os do seu órgão.
--   - Prefeito/controlador veem todos do município.
-- =============================================================================
ALTER TABLE questionarios_instancia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questionarios_select_por_perfil"
  ON questionarios_instancia FOR SELECT
  TO authenticated
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      -- Alta gestão: visão completa
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'secretario_adjunto',
        'controlador_interno', 'admin_sistema', 'suporte_tecnico'
      ])
      -- Responsável direto: vê seus questionários
      OR responsavel_id = auth.uid()
      -- Secretário vê questionários das ações do seu órgão
      OR EXISTS (
        SELECT 1
        FROM acoes a
        JOIN orgaos o ON o.id = a.orgao_id
        WHERE a.id = questionarios_instancia.acao_id
          AND o.secretario_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "questionarios_select_por_perfil" ON questionarios_instancia
  IS 'Responsável vê seus questionários; secretário vê os do seu órgão; alta gestão vê todos.';

-- INSERT geralmente via função gerar_ciclo_questionarios (SECURITY DEFINER)
CREATE POLICY "questionarios_insert_gestores"
  ON questionarios_instancia FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'admin_sistema', 'suporte_tecnico', 'prefeito',
      'secretario_municipal', 'controlador_interno'
    ])
  );

-- UPDATE: responsável pode atualizar status enquanto não encerrado
CREATE POLICY "questionarios_update_responsavel"
  ON questionarios_instancia FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      fn_usuario_tem_perfil(ARRAY[
        'admin_sistema', 'prefeito', 'secretario_municipal',
        'controlador_interno', 'suporte_tecnico'
      ])
      OR (
        responsavel_id = auth.uid()
        AND status NOT IN ('respondido', 'cancelado')
      )
    )
  );

COMMENT ON POLICY "questionarios_update_responsavel" ON questionarios_instancia
  IS 'Responsável pode atualizar o questionário enquanto não estiver respondido ou cancelado.';

CREATE POLICY "questionarios_delete_admin"
  ON questionarios_instancia FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

-- =============================================================================
-- TABELA: respostas_questionario
-- Responsável pode inserir/editar respostas enquanto o questionário não estiver encerrado.
-- =============================================================================
ALTER TABLE respostas_questionario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "respostas_select_municipio"
  ON respostas_questionario FOR SELECT
  TO authenticated
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'secretario_adjunto',
        'controlador_interno', 'admin_sistema', 'suporte_tecnico'
      ])
      OR respondido_por = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM questionarios_instancia qi
        WHERE qi.id = respostas_questionario.questionario_id
          AND qi.responsavel_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "respostas_select_municipio" ON respostas_questionario
  IS 'Responsável vê suas respostas; alta gestão e controlador veem todas do município.';

-- INSERT: responsável pode responder apenas questionários abertos seus
CREATE POLICY "respostas_insert_responsavel"
  ON respostas_questionario FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND EXISTS (
      SELECT 1
      FROM questionarios_instancia qi
      WHERE qi.id = questionario_id
        AND qi.responsavel_id = auth.uid()
        AND qi.status IN ('pendente', 'em_andamento')
    )
  );

COMMENT ON POLICY "respostas_insert_responsavel" ON respostas_questionario
  IS 'Responsável só pode responder questionários com status pendente ou em_andamento.';

-- UPDATE: responsável edita apenas enquanto questionário não encerrado
CREATE POLICY "respostas_update_responsavel"
  ON respostas_questionario FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND respondido_por = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM questionarios_instancia qi
      WHERE qi.id = questionario_id
        AND qi.status IN ('pendente', 'em_andamento')
    )
  );

COMMENT ON POLICY "respostas_update_responsavel" ON respostas_questionario
  IS 'Responsável pode editar respostas somente enquanto o questionário não estiver encerrado.';

CREATE POLICY "respostas_delete_admin"
  ON respostas_questionario FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

-- =============================================================================
-- TABELA: evidencias
-- Fiscal e engenheiro podem validar evidências.
-- Responsável pode enviar evidências para ações suas.
-- =============================================================================
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidencias_select_municipio"
  ON evidencias FOR SELECT
  TO authenticated
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'secretario_adjunto',
        'controlador_interno', 'admin_sistema', 'suporte_tecnico',
        'vereador_monitor', 'jornalista_transparencia'
      ])
      OR enviado_por = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM acoes a
        WHERE a.id = evidencias.acao_id
          AND (a.responsavel_id = auth.uid() OR a.responsavel_secundario_id = auth.uid())
      )
    )
  );

COMMENT ON POLICY "evidencias_select_municipio" ON evidencias
  IS 'Responsável da ação vê evidências dela; alta gestão e monitores externos veem todas.';

-- INSERT: qualquer usuário autenticado do município pode enviar evidências de ações suas
CREATE POLICY "evidencias_insert_responsavel"
  ON evidencias FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND (
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'secretario_adjunto',
        'gestor_acao', 'fiscal_contrato', 'engenheiro_obra',
        'agente_campo', 'coordenador_programa', 'admin_sistema'
      ])
    )
  );

COMMENT ON POLICY "evidencias_insert_responsavel" ON evidencias
  IS 'Gestores, fiscais, engenheiros e agentes de campo podem enviar evidências.';

-- UPDATE: fiscal e engenheiro podem validar evidências; responsável pode editar as suas não validadas
CREATE POLICY "evidencias_update_validacao"
  ON evidencias FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      -- Fiscal e engenheiro podem validar qualquer evidência do município
      fn_usuario_tem_perfil(ARRAY[
        'fiscal_contrato', 'engenheiro_obra', 'controlador_interno',
        'admin_sistema', 'prefeito', 'secretario_municipal'
      ])
      -- Enviador pode editar a própria enquanto não validada
      OR (
        enviado_por = auth.uid()
        AND validado_por IS NULL
      )
    )
  );

COMMENT ON POLICY "evidencias_update_validacao" ON evidencias
  IS 'Fiscal e engenheiro validam evidências; enviador pode editar as suas não validadas.';

CREATE POLICY "evidencias_delete_admin"
  ON evidencias FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

-- =============================================================================
-- TABELA: orcamento_dotacoes
-- =============================================================================
ALTER TABLE orcamento_dotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orcamento_select_municipio"
  ON orcamento_dotacoes FOR SELECT
  TO authenticated
  USING (municipio_id = fn_municipio_id_jwt());

COMMENT ON POLICY "orcamento_select_municipio" ON orcamento_dotacoes
  IS 'Todos os usuários do município podem visualizar dados orçamentários.';

-- Apenas contador, secretário e admin gerenciam dotações
CREATE POLICY "orcamento_insert_financeiro"
  ON orcamento_dotacoes FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'contador', 'secretario_municipal', 'prefeito', 'admin_sistema', 'suporte_tecnico'
    ])
  );

COMMENT ON POLICY "orcamento_insert_financeiro" ON orcamento_dotacoes
  IS 'Apenas contador, secretários e admin podem registrar dotações orçamentárias.';

CREATE POLICY "orcamento_update_financeiro"
  ON orcamento_dotacoes FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'contador', 'secretario_municipal', 'prefeito', 'admin_sistema'
    ])
  );

CREATE POLICY "orcamento_delete_admin"
  ON orcamento_dotacoes FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

-- =============================================================================
-- TABELA: alertas
-- Alertas são gerados automaticamente pelo sistema (service_role).
-- Usuários visualizam e atualizam o status (tratamento/resolução).
-- =============================================================================
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_select_municipio"
  ON alertas FOR SELECT
  TO authenticated
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      -- Alta gestão vê todos os alertas
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'secretario_adjunto',
        'controlador_interno', 'admin_sistema', 'suporte_tecnico'
      ])
      -- Gestores de nível médio veem alertas direcionados ao seu perfil ou ações suas
      OR (
        fn_usuario_tem_perfil(ARRAY[
          'gestor_acao', 'fiscal_contrato', 'engenheiro_obra',
          'coordenador_programa', 'contador', 'assessor_gabinete'
        ])
        AND (
          EXISTS (
            SELECT 1 FROM acoes a
            WHERE a.id = alertas.acao_id
              AND (a.responsavel_id = auth.uid() OR a.responsavel_secundario_id = auth.uid())
          )
          OR destinatario_perfil IN (
            SELECT up.perfil_codigo
            FROM usuario_perfis up
            WHERE up.usuario_id = auth.uid() AND up.ativo = true
          )
        )
      )
    )
  );

COMMENT ON POLICY "alertas_select_municipio" ON alertas
  IS 'Alta gestão vê todos os alertas; gestores veem alertas das suas ações ou direcionados ao seu perfil.';

-- INSERT: apenas service_role e sistema (via função SECURITY DEFINER) criam alertas
CREATE POLICY "alertas_insert_sistema"
  ON alertas FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'admin_sistema', 'suporte_tecnico', 'controlador_interno',
      'prefeito', 'secretario_municipal'
    ])
  );

COMMENT ON POLICY "alertas_insert_sistema" ON alertas
  IS 'Alertas são criados pelo sistema (service_role) ou por gestores autorizados.';

-- UPDATE: qualquer usuário do município pode atualizar status (visualizar, tratar, resolver)
CREATE POLICY "alertas_update_tratamento"
  ON alertas FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'prefeito', 'secretario_municipal', 'secretario_adjunto',
      'gestor_acao', 'controlador_interno', 'admin_sistema', 'suporte_tecnico'
    ])
  );

COMMENT ON POLICY "alertas_update_tratamento" ON alertas
  IS 'Gestores podem atualizar o status de alertas (tratar, resolver, descartar).';

CREATE POLICY "alertas_delete_admin"
  ON alertas FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

-- =============================================================================
-- TABELA: pendencias
-- =============================================================================
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pendencias_select_municipio"
  ON pendencias FOR SELECT
  TO authenticated
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'secretario_adjunto',
        'controlador_interno', 'admin_sistema', 'suporte_tecnico'
      ])
      OR responsavel_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

COMMENT ON POLICY "pendencias_select_municipio" ON pendencias
  IS 'Responsável vê suas pendências; alta gestão vê todas do município.';

CREATE POLICY "pendencias_insert_gestores"
  ON pendencias FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'prefeito', 'secretario_municipal', 'secretario_adjunto',
      'gestor_acao', 'controlador_interno', 'admin_sistema', 'suporte_tecnico'
    ])
  );

-- Responsável pode atualizar suas pendências (providência, status)
CREATE POLICY "pendencias_update_responsavel"
  ON pendencias FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      fn_usuario_tem_perfil(ARRAY[
        'prefeito', 'secretario_municipal', 'controlador_interno', 'admin_sistema'
      ])
      OR responsavel_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

COMMENT ON POLICY "pendencias_update_responsavel" ON pendencias
  IS 'Responsável pode atualizar providências e status das suas pendências.';

CREATE POLICY "pendencias_delete_admin"
  ON pendencias FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY['admin_sistema'])
  );

-- =============================================================================
-- TABELA: auditoria
-- IMUTÁVEL: INSERT apenas via função SECURITY DEFINER (registrar_auditoria).
-- Nenhum usuário — nem admin_sistema — pode UPDATE ou DELETE.
-- SELECT restrito a controlador_interno, prefeito e admin_sistema.
-- =============================================================================
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Apenas controladores e administradores podem consultar o log de auditoria
CREATE POLICY "auditoria_select_controle"
  ON auditoria FOR SELECT
  TO authenticated
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND fn_usuario_tem_perfil(ARRAY[
      'controlador_interno', 'prefeito', 'admin_sistema', 'suporte_tecnico'
    ])
  );

COMMENT ON POLICY "auditoria_select_controle" ON auditoria
  IS 'Apenas controladores e administradores podem consultar o log de auditoria.';

-- INSERT somente via função SECURITY DEFINER (registrar_auditoria)
-- Bloqueado por padrão — a função usa SECURITY DEFINER para contornar o RLS
CREATE POLICY "auditoria_insert_bloqueado"
  ON auditoria FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "auditoria_insert_bloqueado" ON auditoria
  IS 'INSERT direto bloqueado — usar a função registrar_auditoria() que tem SECURITY DEFINER.';

-- Nenhum usuário pode alterar registros de auditoria
CREATE POLICY "auditoria_update_ninguem"
  ON auditoria FOR UPDATE
  USING (false);

COMMENT ON POLICY "auditoria_update_ninguem" ON auditoria
  IS 'Registros de auditoria são imutáveis — nenhum UPDATE permitido.';

-- Nenhum usuário pode excluir registros de auditoria
CREATE POLICY "auditoria_delete_ninguem"
  ON auditoria FOR DELETE
  USING (false);

COMMENT ON POLICY "auditoria_delete_ninguem" ON auditoria
  IS 'Registros de auditoria são imutáveis — nenhum DELETE permitido.';

-- =============================================================================
-- TABELA: fcm_tokens
-- Usuário gerencia apenas seus próprios tokens.
-- =============================================================================
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fcm_tokens_select_proprio"
  ON fcm_tokens FOR SELECT
  TO authenticated
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      usuario_id = auth.uid()
      OR fn_usuario_tem_perfil(ARRAY['admin_sistema', 'suporte_tecnico'])
    )
  );

COMMENT ON POLICY "fcm_tokens_select_proprio" ON fcm_tokens
  IS 'Usuário vê apenas seus próprios tokens FCM; admins veem todos do município.';

CREATE POLICY "fcm_tokens_insert_proprio"
  ON fcm_tokens FOR INSERT
  WITH CHECK (
    municipio_id = fn_municipio_id_jwt()
    AND usuario_id = auth.uid()
  );

COMMENT ON POLICY "fcm_tokens_insert_proprio" ON fcm_tokens
  IS 'Usuário registra apenas seus próprios tokens de push notification.';

CREATE POLICY "fcm_tokens_update_proprio"
  ON fcm_tokens FOR UPDATE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "fcm_tokens_delete_proprio"
  ON fcm_tokens FOR DELETE
  USING (
    municipio_id = fn_municipio_id_jwt()
    AND (
      usuario_id = auth.uid()
      OR fn_usuario_tem_perfil(ARRAY['admin_sistema'])
    )
  );

COMMENT ON POLICY "fcm_tokens_delete_proprio" ON fcm_tokens
  IS 'Usuário remove seus tokens; admin_sistema pode remover tokens de qualquer usuário.';
