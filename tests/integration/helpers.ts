/**
 * Helpers para testes de integração RLS.
 *
 * Cria fixtures (municípios + usuários) usando service_role e expõe utilitários
 * para autenticar com cliente anon (que respeita RLS).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const hasCredentials = Boolean(
  SUPABASE_URL && SERVICE_ROLE_KEY && ANON_KEY
);

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface TestMunicipio {
  id: string;
  subdomain: string;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  municipio_id: string;
}

const TEST_PASSWORD = "Teste@RLS123!";

/**
 * Cria um município de teste. O subdomain inclui um timestamp+random
 * para evitar colisões em execuções paralelas/repetidas.
 */
export async function criarMunicipioTeste(
  admin: SupabaseClient,
  label: string
): Promise<TestMunicipio> {
  const subdomain = `rls-test-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const { data, error } = await admin
    .from("municipios")
    .insert({
      nome: `RLS Test ${label}`,
      subdomain,
      uf: "PE",
      plano: "basico",
      ativo: true,
    })
    .select("id, subdomain")
    .single();

  if (error) throw new Error(`Falha ao criar município ${label}: ${error.message}`);
  return data as TestMunicipio;
}

/**
 * Cria um usuário de teste no Auth + tabela usuarios + vincula perfil.
 * O perfil vai para usuario_perfis para que fn_usuario_tem_perfil funcione.
 */
export async function criarUsuarioTeste(
  admin: SupabaseClient,
  municipio: TestMunicipio,
  perfilCodigo: string,
  label: string
): Promise<TestUser> {
  const email = `rls-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.local`;

  // 1) Auth user com metadata para o Auth Hook customize_jwt_claims injetar municipio_id
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      municipio_id: municipio.id,
      perfil: perfilCodigo,
      primeiro_acesso: false,
      mfa_verificado: true,
      mfa_obrigatorio: false,
    },
  });
  if (authError || !authData.user) {
    throw new Error(`Falha ao criar auth user ${label}: ${authError?.message}`);
  }

  const userId = authData.user.id;

  // 2) Linha em public.usuarios
  const { error: userInsertError } = await admin.from("usuarios").insert({
    id: userId,
    municipio_id: municipio.id,
    email,
    nome: `RLS Test ${label}`,
    ativo: true,
  });
  if (userInsertError) {
    throw new Error(`Falha ao inserir usuario ${label}: ${userInsertError.message}`);
  }

  // 3) Vínculo de perfil ativo
  const { error: perfilError } = await admin.from("usuario_perfis").insert({
    usuario_id: userId,
    municipio_id: municipio.id,
    perfil_codigo: perfilCodigo,
    ativo: true,
  });
  if (perfilError) {
    throw new Error(`Falha ao vincular perfil ${perfilCodigo} para ${label}: ${perfilError.message}`);
  }

  return {
    id: userId,
    email,
    password: TEST_PASSWORD,
    municipio_id: municipio.id,
  };
}

/**
 * Faz signin e retorna um cliente já autenticado (respeitando RLS).
 */
export async function signinAs(user: TestUser): Promise<SupabaseClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`Falha no signin de ${user.email}: ${error.message}`);
  return client;
}

/**
 * Cleanup: remove usuários, perfis, ações e municípios criados pelo teste.
 * Idempotente — pode ser chamado em afterAll mesmo se setUp parcial.
 */
export async function limpar(
  admin: SupabaseClient,
  ids: { userIds: string[]; municipioIds: string[] }
): Promise<void> {
  // Ordem importante: dependentes antes de pais
  if (ids.userIds.length > 0) {
    await admin.from("usuario_perfis").delete().in("usuario_id", ids.userIds);
    await admin.from("usuarios").delete().in("id", ids.userIds);
    for (const userId of ids.userIds) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    }
  }
  if (ids.municipioIds.length > 0) {
    // Limpa registros que referenciam municípios — ações criadas no teste, etc.
    await admin.from("acoes").delete().in("municipio_id", ids.municipioIds);
    await admin.from("orgaos").delete().in("municipio_id", ids.municipioIds);
    await admin.from("municipios").delete().in("id", ids.municipioIds);
  }
}
