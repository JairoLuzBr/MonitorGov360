-- =============================================================================
-- MonitorGov360 — Schema Inicial
-- Migração: 001_initial_schema.sql
-- Descrição: Criação de todas as tabelas do sistema multi-tenant de monitoramento
--            da execução governamental municipal.
-- =============================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- FUNÇÃO AUXILIAR: atualizar campo updated_at automaticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_atualizar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TABELA: municipios
-- Representa cada tenant (município) da plataforma SaaS.
-- =============================================================================
CREATE TABLE IF NOT EXISTS municipios (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT        NOT NULL,
  cnpj          TEXT        UNIQUE,
  codigo_ibge   TEXT        UNIQUE,
  subdomain     TEXT        UNIQUE NOT NULL,
  uf            CHAR(2)     NOT NULL,
  populacao     INTEGER,
  -- Plano de assinatura do município
  plano         TEXT        NOT NULL DEFAULT 'basico'
                            CHECK (plano IN ('basico', 'intermediario', 'premium', 'consorcio')),
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE municipios IS 'Tenants da plataforma — cada município é um tenant isolado.';
COMMENT ON COLUMN municipios.subdomain IS 'Subdomínio único usado no acesso: {subdomain}.monitorgov360.com.br';
COMMENT ON COLUMN municipios.plano IS 'Plano de assinatura: basico, intermediario, premium, consorcio';

CREATE TRIGGER trg_municipios_updated_at
  BEFORE UPDATE ON municipios
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

-- =============================================================================
-- TABELA: perfis_sistema
-- Catálogo global de perfis de acesso (não é por tenant).
-- =============================================================================
CREATE TABLE IF NOT EXISTS perfis_sistema (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        TEXT        UNIQUE NOT NULL,
  nome          TEXT        NOT NULL,
  descricao     TEXT,
  -- Nível de acesso: 1 (menor) a 10 (maior)
  nivel_acesso  INTEGER     NOT NULL DEFAULT 1
                            CHECK (nivel_acesso BETWEEN 1 AND 10),
  permissoes    JSONB       NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE perfis_sistema IS 'Catálogo global de perfis do sistema — não é por tenant.';
COMMENT ON COLUMN perfis_sistema.nivel_acesso IS 'Nível hierárquico: 1 (cidadão) a 10 (prefeito/admin).';
COMMENT ON COLUMN perfis_sistema.permissoes IS 'JSON de permissões granulares: {visualizar, editar, aprovar, exportar, ...}';

-- =============================================================================
-- TABELA: usuarios
-- Usuários da plataforma, vinculados a um município (tenant).
-- O UUID espelha o auth.users do Supabase.
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID        PRIMARY KEY,  -- Mesmo UUID do auth.users do Supabase
  municipio_id    UUID        NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
  email           TEXT        NOT NULL,
  nome            TEXT        NOT NULL,
  -- Hash SHA-256 do CPF para conformidade com LGPD
  cpf_hash        TEXT,
  telefone        TEXT,
  cargo           TEXT,
  mfa_enabled     BOOLEAN     NOT NULL DEFAULT false,
  -- Segredo MFA armazenado criptografado (via Vault ou colunas criptografadas)
  mfa_secret      TEXT,
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  ultimo_acesso   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (municipio_id, email)
);

COMMENT ON TABLE usuarios IS 'Usuários da plataforma. O id reflete o auth.users.id do Supabase Auth.';
COMMENT ON COLUMN usuarios.cpf_hash IS 'SHA-256 do CPF — nunca armazenar CPF em texto puro (LGPD).';
COMMENT ON COLUMN usuarios.mfa_secret IS 'Segredo TOTP criptografado para autenticação de dois fatores.';

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

-- =============================================================================
-- TABELA: orgaos
-- Secretarias e órgãos municipais dentro de cada tenant.
-- =============================================================================
CREATE TABLE IF NOT EXISTS orgaos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id    UUID        NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
  nome            TEXT        NOT NULL,
  sigla           TEXT,
  secretario_id   UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo            TEXT        CHECK (tipo IN ('secretaria', 'autarquia', 'fundacao', 'empresa_publica', 'camara')),
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE orgaos IS 'Órgãos municipais: secretarias, autarquias, fundações, etc.';

CREATE TRIGGER trg_orgaos_updated_at
  BEFORE UPDATE ON orgaos
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

-- =============================================================================
-- TABELA: usuario_perfis
-- RBAC — associação muitos-para-muitos entre usuários e perfis.
-- Um usuário pode ter múltiplos perfis, inclusive em órgãos distintos.
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuario_perfis (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  perfil_codigo   TEXT        NOT NULL REFERENCES perfis_sistema(codigo) ON DELETE RESTRICT,
  municipio_id    UUID        NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  -- Opcional: perfil com escopo em órgão específico
  orgao_id        UUID        REFERENCES orgaos(id) ON DELETE SET NULL,
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, perfil_codigo, orgao_id)
);

COMMENT ON TABLE usuario_perfis IS 'RBAC: associação usuário ↔ perfil, com escopo opcional de órgão.';

-- =============================================================================
-- TABELA: acoes
-- Ações governamentais monitoradas (obras, programas, contratos, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS acoes (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id                UUID           NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
  orgao_id                    UUID           NOT NULL REFERENCES orgaos(id) ON DELETE RESTRICT,
  tipo                        TEXT           NOT NULL
                                             CHECK (tipo IN (
                                               'obra_publica',
                                               'servico_engenharia',
                                               'programa_social',
                                               'acao_saude',
                                               'acao_educacional',
                                               'aquisicao_bens',
                                               'contrato_continuado',
                                               'convenio_transferencia',
                                               'acao_emergencial',
                                               'meta_estrategica',
                                               'servico_continuado',
                                               'projeto_especial',
                                               'reforma_adaptacao',
                                               'manutencao_equipamento'
                                             )),
  titulo                      TEXT           NOT NULL,
  descricao                   TEXT,
  responsavel_id              UUID           REFERENCES usuarios(id) ON DELETE SET NULL,
  responsavel_secundario_id   UUID           REFERENCES usuarios(id) ON DELETE SET NULL,
  status                      TEXT           NOT NULL DEFAULT 'planejada'
                                             CHECK (status IN (
                                               'planejada', 'em_licitacao', 'em_execucao',
                                               'paralisada', 'concluida', 'cancelada'
                                             )),
  nivel_risco                 TEXT           NOT NULL DEFAULT 'baixo'
                                             CHECK (nivel_risco IN ('baixo', 'medio', 'alto', 'critico')),
  data_inicio                 DATE,
  data_prevista_fim           DATE,
  data_real_fim               DATE,
  -- Localização geográfica
  localizacao_bairro          TEXT,
  localizacao_endereco        TEXT,
  localizacao_lat             DOUBLE PRECISION,
  localizacao_lng             DOUBLE PRECISION,
  -- Indicadores de execução
  percentual_fisico           DECIMAL(5,2)   NOT NULL DEFAULT 0
                                             CHECK (percentual_fisico BETWEEN 0 AND 100),
  percentual_financeiro       DECIMAL(5,2)   NOT NULL DEFAULT 0
                                             CHECK (percentual_financeiro BETWEEN 0 AND 100),
  meta_quantitativa           DECIMAL(12,2),
  unidade_meta                TEXT,
  -- Dados contratuais e licitatórios
  numero_contrato             TEXT,
  numero_licitacao            TEXT,
  fonte_recurso               TEXT
                              CHECK (fonte_recurso IN (
                                'tesouro_municipal', 'federal', 'estadual',
                                'emenda', 'convenio'
                              )),
  observacoes                 TEXT,
  created_by                  UUID           REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acoes IS 'Ações governamentais monitoradas: obras, programas, contratos, etc.';
COMMENT ON COLUMN acoes.percentual_fisico IS 'Percentual de execução física (0-100%).';
COMMENT ON COLUMN acoes.percentual_financeiro IS 'Percentual de execução financeira (0-100%).';
COMMENT ON COLUMN acoes.nivel_risco IS 'Nível de risco da ação: baixo, medio, alto, critico.';

CREATE TRIGGER trg_acoes_updated_at
  BEFORE UPDATE ON acoes
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

-- =============================================================================
-- TABELA: modelos_questionario
-- Templates de questionário por tipo de ação. municipio_id NULL = modelo global.
-- =============================================================================
CREATE TABLE IF NOT EXISTS modelos_questionario (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL indica modelo global disponível para todos os municípios
  municipio_id    UUID        REFERENCES municipios(id) ON DELETE CASCADE,
  tipo_acao       TEXT        NOT NULL,
  nome            TEXT        NOT NULL,
  -- Estrutura JSON: [{id, texto, tipo, obrigatoria, opcoes}]
  perguntas       JSONB       NOT NULL DEFAULT '[]',
  ciclo           TEXT        NOT NULL DEFAULT 'semanal'
                              CHECK (ciclo IN ('semanal', 'quinzenal', 'mensal')),
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE modelos_questionario IS 'Templates de questionário por tipo de ação. municipio_id NULL = global.';
COMMENT ON COLUMN modelos_questionario.perguntas IS 'Array JSON: [{id, texto, tipo, obrigatoria, opcoes}]. Tipos: texto, numero, sim_nao, selecao, data, arquivo.';

-- =============================================================================
-- TABELA: ciclos_monitoramento
-- Define os períodos de monitoramento (semana, quinzena, mês).
-- =============================================================================
CREATE TABLE IF NOT EXISTS ciclos_monitoramento (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id    UUID        NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  data_inicio     DATE        NOT NULL,
  data_fim        DATE        NOT NULL,
  ciclo           TEXT        NOT NULL
                              CHECK (ciclo IN ('semanal', 'quinzenal', 'mensal')),
  status          TEXT        NOT NULL DEFAULT 'ativo'
                              CHECK (status IN ('ativo', 'encerrado', 'cancelado')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ciclo_datas CHECK (data_fim >= data_inicio)
);

COMMENT ON TABLE ciclos_monitoramento IS 'Períodos de monitoramento: semanal, quinzenal ou mensal.';

-- =============================================================================
-- TABELA: questionarios_instancia
-- Instâncias de questionário geradas para cada ação em cada ciclo.
-- =============================================================================
CREATE TABLE IF NOT EXISTS questionarios_instancia (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id          UUID        NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
  acao_id               UUID        NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
  ciclo_id              UUID        NOT NULL REFERENCES ciclos_monitoramento(id) ON DELETE RESTRICT,
  modelo_id             UUID        NOT NULL REFERENCES modelos_questionario(id) ON DELETE RESTRICT,
  responsavel_id        UUID        NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  status                TEXT        NOT NULL DEFAULT 'pendente'
                                    CHECK (status IN (
                                      'pendente', 'em_andamento', 'respondido', 'atrasado', 'cancelado'
                                    )),
  data_envio            TIMESTAMPTZ,
  data_prazo            TIMESTAMPTZ,
  data_resposta         TIMESTAMPTZ,
  notificacao_enviada   BOOLEAN     NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Cada responsável responde apenas uma vez por ação/ciclo
  UNIQUE (acao_id, ciclo_id, responsavel_id)
);

COMMENT ON TABLE questionarios_instancia IS 'Questionários gerados por ciclo de monitoramento para cada ação.';

-- =============================================================================
-- TABELA: respostas_questionario
-- Respostas individuais às perguntas de cada questionário.
-- =============================================================================
CREATE TABLE IF NOT EXISTS respostas_questionario (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id        UUID           NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
  questionario_id     UUID           NOT NULL REFERENCES questionarios_instancia(id) ON DELETE CASCADE,
  -- ID da pergunta conforme definido no modelo_questionario.perguntas[].id
  pergunta_id         TEXT           NOT NULL,
  -- Campos de resposta: apenas um deve ser preenchido por tipo de pergunta
  resposta_texto      TEXT,
  resposta_numero     DECIMAL(15,4),
  resposta_booleana   BOOLEAN,
  resposta_data       DATE,
  resposta_opcoes     TEXT[],
  observacao          TEXT,
  respondido_por      UUID           REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (questionario_id, pergunta_id)
);

COMMENT ON TABLE respostas_questionario IS 'Respostas às perguntas dos questionários. Um registro por pergunta.';

-- =============================================================================
-- TABELA: evidencias
-- Arquivos, fotos, documentos e links de evidência das ações.
-- =============================================================================
CREATE TABLE IF NOT EXISTS evidencias (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id        UUID           NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
  acao_id             UUID           NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
  questionario_id     UUID           REFERENCES questionarios_instancia(id) ON DELETE SET NULL,
  tipo                TEXT           NOT NULL
                                     CHECK (tipo IN (
                                       'foto', 'documento', 'video', 'link', 'laudo',
                                       'medicao', 'ata', 'contrato_doc'
                                     )),
  titulo              TEXT,
  descricao           TEXT,
  arquivo_url         TEXT,
  arquivo_nome        TEXT,
  arquivo_tamanho     BIGINT,
  arquivo_mimetype    TEXT,
  -- Coordenadas GPS capturadas no momento do upload
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,
  endereco_captura    TEXT,
  data_captura        TIMESTAMPTZ,
  enviado_por         UUID           REFERENCES usuarios(id) ON DELETE SET NULL,
  -- Campos de validação (fiscal ou engenheiro)
  validado_por        UUID           REFERENCES usuarios(id) ON DELETE SET NULL,
  validado_em         TIMESTAMPTZ,
  -- Hash SHA-256 do arquivo para integridade
  hash_arquivo        TEXT,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE evidencias IS 'Evidências das ações: fotos, documentos, vídeos, laudos, medições.';
COMMENT ON COLUMN evidencias.hash_arquivo IS 'Hash SHA-256 do arquivo para verificação de integridade.';
COMMENT ON COLUMN evidencias.lat IS 'Latitude GPS capturada no momento do upload da evidência.';

-- =============================================================================
-- TABELA: orcamento_dotacoes
-- Dotações orçamentárias vinculadas às ações.
-- =============================================================================
CREATE TABLE IF NOT EXISTS orcamento_dotacoes (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id        UUID           NOT NULL REFERENCES municipios(id) ON DELETE RESTRICT,
  acao_id             UUID           REFERENCES acoes(id) ON DELETE SET NULL,
  exercicio           INTEGER        NOT NULL,
  -- Classificação orçamentária
  funcao              TEXT,
  subfuncao           TEXT,
  programa            TEXT,
  acao_orcamentaria   TEXT,
  elemento_despesa    TEXT,
  fonte_recurso       TEXT,
  -- Valores orçamentários em reais
  valor_dotacao       DECIMAL(15,2)  NOT NULL DEFAULT 0,
  valor_suplementado  DECIMAL(15,2)  NOT NULL DEFAULT 0,
  valor_empenhado     DECIMAL(15,2)  NOT NULL DEFAULT 0,
  valor_liquidado     DECIMAL(15,2)  NOT NULL DEFAULT 0,
  valor_pago          DECIMAL(15,2)  NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE orcamento_dotacoes IS 'Dotações orçamentárias por exercício vinculadas a ações governamentais.';

CREATE TRIGGER trg_orcamento_dotacoes_updated_at
  BEFORE UPDATE ON orcamento_dotacoes
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

-- =============================================================================
-- TABELA: alertas
-- Alertas gerados pelo sistema para situações críticas.
-- =============================================================================
CREATE TABLE IF NOT EXISTS alertas (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id        UUID           NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  acao_id             UUID           REFERENCES acoes(id) ON DELETE CASCADE,
  questionario_id     UUID           REFERENCES questionarios_instancia(id) ON DELETE SET NULL,
  tipo                TEXT           NOT NULL
                                     CHECK (tipo IN (
                                       'obra_paralisada',
                                       'questionario_atrasado',
                                       'divergencia_fisico_financeira',
                                       'omissao_responsavel',
                                       'contrato_vencendo',
                                       'prazo_critico',
                                       'evidencia_ausente',
                                       'meta_em_risco',
                                       'aditivo_suspeito'
                                     )),
  titulo              TEXT           NOT NULL,
  descricao           TEXT,
  nivel_gravidade     TEXT           NOT NULL DEFAULT 'medio'
                                     CHECK (nivel_gravidade IN (
                                       'informativo', 'baixo', 'medio', 'alto', 'critico'
                                     )),
  status              TEXT           NOT NULL DEFAULT 'ativo'
                                     CHECK (status IN (
                                       'ativo', 'em_tratamento', 'resolvido', 'descartado'
                                     )),
  -- Perfil destinatário do alerta (ex: prefeito, secretario, gestor)
  destinatario_perfil TEXT,
  -- Array de UUIDs dos usuários que visualizaram o alerta
  visualizado_por     UUID[]         NOT NULL DEFAULT '{}',
  resolved_by         UUID           REFERENCES usuarios(id) ON DELETE SET NULL,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE alertas IS 'Alertas automáticos do sistema para situações críticas que requerem atenção.';
COMMENT ON COLUMN alertas.visualizado_por IS 'Array de UUIDs dos usuários que já visualizaram o alerta.';

CREATE TRIGGER trg_alertas_updated_at
  BEFORE UPDATE ON alertas
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

-- =============================================================================
-- TABELA: pendencias
-- Pendências criadas a partir de alertas ou manualmente pelos gestores.
-- =============================================================================
CREATE TABLE IF NOT EXISTS pendencias (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id    UUID        NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  alerta_id       UUID        REFERENCES alertas(id) ON DELETE SET NULL,
  acao_id         UUID        REFERENCES acoes(id) ON DELETE CASCADE,
  titulo          TEXT        NOT NULL,
  descricao       TEXT,
  responsavel_id  UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  prazo           DATE,
  status          TEXT        NOT NULL DEFAULT 'aberta'
                              CHECK (status IN (
                                'aberta', 'em_andamento', 'concluida', 'cancelada'
                              )),
  providencia     TEXT,
  created_by      UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pendencias IS 'Pendências geradas por alertas ou manualmente, com responsável e prazo.';

CREATE TRIGGER trg_pendencias_updated_at
  BEFORE UPDATE ON pendencias
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

-- =============================================================================
-- TABELA: auditoria
-- Trilha de auditoria imutável — sem UPDATE/DELETE permitido via RLS.
-- =============================================================================
CREATE TABLE IF NOT EXISTS auditoria (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id      UUID        NOT NULL,
  tabela            TEXT        NOT NULL,
  operacao          TEXT        NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id       UUID        NOT NULL,
  usuario_id        UUID,
  dados_anteriores  JSONB,
  dados_novos       JSONB,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE auditoria IS 'Trilha de auditoria imutável. Nenhum usuário pode alterar ou excluir registros.';
COMMENT ON COLUMN auditoria.dados_anteriores IS 'Estado do registro ANTES da operação (NULL para INSERT).';
COMMENT ON COLUMN auditoria.dados_novos IS 'Estado do registro APÓS a operação (NULL para DELETE).';

-- =============================================================================
-- TABELA: fcm_tokens
-- Tokens FCM para notificações push (web, Android, iOS).
-- =============================================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  municipio_id    UUID        NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  token           TEXT        NOT NULL,
  plataforma      TEXT        CHECK (plataforma IN ('web', 'android', 'ios')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, token)
);

COMMENT ON TABLE fcm_tokens IS 'Tokens FCM para push notifications em dispositivos dos usuários.';

CREATE TRIGGER trg_fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_updated_at();

-- =============================================================================
-- ÍNDICES — Performance e isolamento multi-tenant
-- =============================================================================

-- municipio_id em todas as tabelas (fundamental para RLS e performance)
CREATE INDEX IF NOT EXISTS idx_usuarios_municipio_id               ON usuarios(municipio_id);
CREATE INDEX IF NOT EXISTS idx_orgaos_municipio_id                 ON orgaos(municipio_id);
CREATE INDEX IF NOT EXISTS idx_usuario_perfis_municipio_id         ON usuario_perfis(municipio_id);
CREATE INDEX IF NOT EXISTS idx_acoes_municipio_id                  ON acoes(municipio_id);
CREATE INDEX IF NOT EXISTS idx_modelos_questionario_municipio_id   ON modelos_questionario(municipio_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_monitoramento_municipio_id   ON ciclos_monitoramento(municipio_id);
CREATE INDEX IF NOT EXISTS idx_questionarios_instancia_municipio_id ON questionarios_instancia(municipio_id);
CREATE INDEX IF NOT EXISTS idx_respostas_questionario_municipio_id ON respostas_questionario(municipio_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_municipio_id             ON evidencias(municipio_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_dotacoes_municipio_id     ON orcamento_dotacoes(municipio_id);
CREATE INDEX IF NOT EXISTS idx_alertas_municipio_id                ON alertas(municipio_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_municipio_id             ON pendencias(municipio_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_municipio_id              ON auditoria(municipio_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_municipio_id             ON fcm_tokens(municipio_id);

-- acao_id em tabelas relacionadas
CREATE INDEX IF NOT EXISTS idx_questionarios_instancia_acao_id    ON questionarios_instancia(acao_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_acao_id                 ON evidencias(acao_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_dotacoes_acao_id         ON orcamento_dotacoes(acao_id);
CREATE INDEX IF NOT EXISTS idx_alertas_acao_id                    ON alertas(acao_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_acao_id                 ON pendencias(acao_id);

-- responsavel_id
CREATE INDEX IF NOT EXISTS idx_acoes_responsavel_id               ON acoes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_questionarios_instancia_responsavel ON questionarios_instancia(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_responsavel_id          ON pendencias(responsavel_id);

-- status (filtros frequentes)
CREATE INDEX IF NOT EXISTS idx_acoes_status                       ON acoes(status);
CREATE INDEX IF NOT EXISTS idx_questionarios_instancia_status     ON questionarios_instancia(status);
CREATE INDEX IF NOT EXISTS idx_alertas_status                     ON alertas(status);
CREATE INDEX IF NOT EXISTS idx_pendencias_status                  ON pendencias(status);

-- created_at (ordenação e auditoria)
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at               ON auditoria(created_at);
CREATE INDEX IF NOT EXISTS idx_evidencias_created_at              ON evidencias(created_at);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_acoes_municipio_status             ON acoes(municipio_id, status);
CREATE INDEX IF NOT EXISTS idx_alertas_municipio_nivel            ON alertas(municipio_id, nivel_gravidade, status);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela_registro          ON auditoria(tabela, registro_id);
CREATE INDEX IF NOT EXISTS idx_usuario_perfis_usuario             ON usuario_perfis(usuario_id, perfil_codigo);
CREATE INDEX IF NOT EXISTS idx_acoes_orgao_id                     ON acoes(orgao_id);
CREATE INDEX IF NOT EXISTS idx_questionarios_ciclo_id             ON questionarios_instancia(ciclo_id);
