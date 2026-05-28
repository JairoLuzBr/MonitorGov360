/**
 * Promove o usuário admin@test.com a admin_sistema no município demo.
 *
 * O seed-test só cria o registro em auth.users (Supabase Auth).
 * Mas as policies RLS dependem das tabelas `usuarios` e `usuario_perfis`.
 * Este script garante:
 *   1. registro em `usuarios` espelhando o id de auth.users
 *   2. vínculo em `usuario_perfis` com perfil `admin_sistema`
 *
 * Executa: npm run promote-test-user
 * Idempotente — pode rodar várias vezes.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && !key.startsWith("#")) {
      process.env[key.trim()] = value.join("=").trim();
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_EMAIL = "admin@test.com";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Variáveis Supabase ausentes em .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log(`\n🔧 Promovendo ${TEST_EMAIL} a admin_sistema...\n`);

  // 1. Buscar o usuário no auth.users
  const { data: usersList, error: usersErr } =
    await supabase.auth.admin.listUsers({ perPage: 200 });
  if (usersErr) {
    console.error("❌ Falha ao listar usuários do Auth:", usersErr.message);
    process.exit(1);
  }

  const authUser = usersList.users.find((u) => u.email === TEST_EMAIL);
  if (!authUser) {
    console.error(`❌ Usuário ${TEST_EMAIL} não existe no Supabase Auth.`);
    console.error("   Rode antes: npm run seed-test");
    process.exit(1);
  }
  console.log(`✅ Auth user encontrado: ${authUser.id}`);

  // 2. Pegar municipio_id do user_metadata
  const municipio_id =
    (authUser.user_metadata?.municipio_id as string | undefined) ??
    "00000000-0000-0000-0000-000000000001";
  console.log(`✅ Município alvo: ${municipio_id}`);

  // 3. UPSERT em `usuarios`
  const { error: upsertErr } = await supabase.from("usuarios").upsert(
    {
      id: authUser.id,
      municipio_id,
      email: TEST_EMAIL,
      nome: "Administrador de Testes",
      cargo: "Administrador do Sistema",
      ativo: true,
    },
    { onConflict: "id" }
  );
  if (upsertErr) {
    console.error("❌ Erro ao gravar em `usuarios`:", upsertErr.message);
    process.exit(1);
  }
  console.log("✅ Registro em `usuarios` garantido");

  // 4. Vínculo de perfil em usuario_perfis
  //    Conflito por (usuario_id, perfil_codigo, orgao_id) — orgao_id NULL
  const { error: perfilErr } = await supabase
    .from("usuario_perfis")
    .upsert(
      {
        usuario_id: authUser.id,
        perfil_codigo: "admin_sistema",
        municipio_id,
        orgao_id: null,
        ativo: true,
      },
      { onConflict: "usuario_id,perfil_codigo,orgao_id" }
    );

  if (perfilErr) {
    // Em caso o ON CONFLICT em colunas com NULL não funcione, fazer fallback manual
    const { data: existente } = await supabase
      .from("usuario_perfis")
      .select("id")
      .eq("usuario_id", authUser.id)
      .eq("perfil_codigo", "admin_sistema")
      .is("orgao_id", null)
      .maybeSingle();

    if (existente) {
      console.log("✅ Vínculo admin_sistema já existia (no-op)");
    } else {
      const { error: insertErr } = await supabase
        .from("usuario_perfis")
        .insert({
          usuario_id: authUser.id,
          perfil_codigo: "admin_sistema",
          municipio_id,
          orgao_id: null,
          ativo: true,
        });
      if (insertErr) {
        console.error("❌ Erro ao criar vínculo de perfil:", insertErr.message);
        process.exit(1);
      }
      console.log("✅ Vínculo admin_sistema criado");
    }
  } else {
    console.log("✅ Vínculo admin_sistema garantido");
  }

  // 5. Atualizar user_metadata para refletir o perfil
  const novoMetadata = {
    ...(authUser.user_metadata ?? {}),
    municipio_id,
    perfil: "admin_sistema",
  };
  const { error: metaErr } = await supabase.auth.admin.updateUserById(
    authUser.id,
    { user_metadata: novoMetadata }
  );
  if (metaErr) {
    console.error("⚠️  Aviso: falha ao atualizar user_metadata:", metaErr.message);
  } else {
    console.log("✅ user_metadata atualizado (perfil = admin_sistema)");
  }

  console.log("\n🎉 Pronto! Agora você precisa:");
  console.log("   1. Fazer LOGOUT na aplicação");
  console.log("   2. Fazer LOGIN novamente com admin@test.com / Teste@123");
  console.log("   3. O novo JWT terá o claim correto e o RLS vai liberar criar/editar ações.\n");
}

main().catch((e) => {
  console.error("erro:", e);
  process.exit(1);
});
