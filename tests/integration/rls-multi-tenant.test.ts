/**
 * Testes de Integração — Isolamento Multi-tenant via RLS.
 *
 * Estes testes validam que as Row Level Security policies impedem que um
 * usuário de um município (tenant) acesse dados de outro município, mesmo
 * conhecendo IDs ou tentando forjar campos.
 *
 * Requisitos: .env.local com NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * e SUPABASE_SERVICE_ROLE_KEY apontando para um Supabase com as migrations aplicadas.
 *
 * Execução: npm run test:rls
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adminClient,
  anonClient,
  criarMunicipioTeste,
  criarUsuarioTeste,
  hasCredentials,
  limpar,
  signinAs,
  type TestMunicipio,
  type TestUser,
} from "./helpers";

describe.skipIf(!hasCredentials)("RLS — Isolamento Multi-tenant", () => {
  let admin: SupabaseClient;
  let municipioA: TestMunicipio;
  let municipioB: TestMunicipio;
  let userA: TestUser;
  let userB: TestUser;
  let orgaoB: string;
  let acaoB: string;

  beforeAll(async () => {
    admin = adminClient();

    municipioA = await criarMunicipioTeste(admin, "A");
    municipioB = await criarMunicipioTeste(admin, "B");

    // Prefeito em cada município (perfil com mais privilégios — se este isolar,
    // perfis menores também isolam)
    userA = await criarUsuarioTeste(admin, municipioA, "prefeito", "A");
    userB = await criarUsuarioTeste(admin, municipioB, "prefeito", "B");

    // Dados pré-existentes no município B (para userA tentar acessar)
    const { data: orgao, error: orgaoErr } = await admin
      .from("orgaos")
      .insert({
        municipio_id: municipioB.id,
        nome: "Secretaria de Obras (B)",
        sigla: "SEOB-B",
        tipo: "secretaria",
        ativo: true,
      })
      .select("id")
      .single();
    if (orgaoErr) throw orgaoErr;
    orgaoB = orgao.id;

    const { data: acao, error: acaoErr } = await admin
      .from("acoes")
      .insert({
        municipio_id: municipioB.id,
        orgao_id: orgaoB,
        tipo: "obra_publica",
        titulo: "Obra confidencial do município B",
        status: "em_execucao",
        nivel_risco: "medio",
      })
      .select("id")
      .single();
    if (acaoErr) throw acaoErr;
    acaoB = acao.id;
  });

  afterAll(async () => {
    if (!admin) return;
    await limpar(admin, {
      userIds: [userA?.id, userB?.id].filter(Boolean) as string[],
      municipioIds: [municipioA?.id, municipioB?.id].filter(Boolean) as string[],
    });
  });

  // ===========================================================================
  // CROSS-TENANT SELECT — usuário de A não pode LER dados de B
  // ===========================================================================
  describe("Cross-tenant SELECT", () => {
    let clientA: SupabaseClient;

    beforeAll(async () => {
      clientA = await signinAs(userA);
    });

    it("não retorna ações do município B mesmo filtrando por municipio_id de B", async () => {
      const { data, error } = await clientA
        .from("acoes")
        .select("*")
        .eq("municipio_id", municipioB.id);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("não retorna a ação de B mesmo conhecendo o ID exato", async () => {
      const { data, error } = await clientA
        .from("acoes")
        .select("*")
        .eq("id", acaoB);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("não retorna órgãos do município B", async () => {
      const { data, error } = await clientA
        .from("orgaos")
        .select("*")
        .eq("municipio_id", municipioB.id);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("não retorna usuários do município B", async () => {
      const { data, error } = await clientA
        .from("usuarios")
        .select("*")
        .eq("municipio_id", municipioB.id);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("retorna os próprios dados do município A (sanity check)", async () => {
      const { data, error } = await clientA
        .from("usuarios")
        .select("id, email")
        .eq("id", userA.id);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(userA.id);
    });
  });

  // ===========================================================================
  // CROSS-TENANT INSERT — usuário de A não pode CRIAR dados em B
  // ===========================================================================
  describe("Cross-tenant INSERT", () => {
    let clientA: SupabaseClient;

    beforeAll(async () => {
      clientA = await signinAs(userA);
    });

    it("falha ao inserir ação forjando municipio_id de B", async () => {
      const { data, error } = await clientA
        .from("acoes")
        .insert({
          municipio_id: municipioB.id,
          orgao_id: orgaoB,
          tipo: "obra_publica",
          titulo: "Tentativa de injeção cross-tenant",
          status: "planejada",
        })
        .select();
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("falha ao inserir órgão em B", async () => {
      const { error } = await clientA.from("orgaos").insert({
        municipio_id: municipioB.id,
        nome: "Órgão falso",
        tipo: "secretaria",
        ativo: true,
      });
      expect(error).not.toBeNull();
    });
  });

  // ===========================================================================
  // CROSS-TENANT UPDATE — usuário de A não pode ALTERAR dados de B
  // ===========================================================================
  describe("Cross-tenant UPDATE", () => {
    it("não afeta linhas ao tentar atualizar ação de B", async () => {
      const clientA = await signinAs(userA);
      const { data, error } = await clientA
        .from("acoes")
        .update({ titulo: "Tentativa de sequestro" })
        .eq("id", acaoB)
        .select();
      expect(error).toBeNull();
      // RLS faz o WHERE retornar 0 linhas — UPDATE não falha mas não afeta nada
      expect(data).toEqual([]);

      // Confirma via admin que o título original não mudou
      const { data: check } = await admin
        .from("acoes")
        .select("titulo")
        .eq("id", acaoB)
        .single();
      expect(check?.titulo).toBe("Obra confidencial do município B");
    });
  });

  // ===========================================================================
  // AUDITORIA IMUTÁVEL — INSERT direto deve falhar para qualquer usuário
  // ===========================================================================
  describe("Auditoria imutável", () => {
    it("usuário não consegue inserir registro direto em auditoria", async () => {
      const clientA = await signinAs(userA);
      const { error } = await clientA.from("auditoria").insert({
        municipio_id: municipioA.id,
        usuario_id: userA.id,
        operacao: "INSERT",
        tabela: "acoes",
        registro_id: acaoB,
      });
      expect(error).not.toBeNull();
    });

    it("usuário não consegue atualizar registros de auditoria", async () => {
      const clientA = await signinAs(userA);
      const { data, error } = await clientA
        .from("auditoria")
        .update({ operacao: "DELETE" })
        .eq("municipio_id", municipioA.id)
        .select();
      // Pode retornar erro PGRST ou array vazio — ambos indicam que UPDATE foi bloqueado
      const blocked = error !== null || (data?.length ?? 0) === 0;
      expect(blocked).toBe(true);
    });
  });

  // ===========================================================================
  // ANON SEM SESSÃO — não vê nada exceto município público
  // ===========================================================================
  describe("Cliente anônimo (sem login)", () => {
    it("usuário não-autenticado não consegue ler ações", async () => {
      const anon = anonClient();
      const { data, error } = await anon.from("acoes").select("*");
      // RLS bloqueia — pode retornar erro ou array vazio dependendo da policy
      expect(error || (data?.length ?? 0) === 0).toBeTruthy();
    });

    it("usuário não-autenticado pode listar municípios (necessário para login)", async () => {
      const anon = anonClient();
      const { data, error } = await anon
        .from("municipios")
        .select("id, subdomain")
        .eq("id", municipioA.id);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });
});

if (!hasCredentials) {
  describe("RLS — Isolamento Multi-tenant", () => {
    it.skip("Credenciais Supabase ausentes — defina NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY em .env.local", () => {});
  });
}
