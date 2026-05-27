/**
 * Verifica se as migrations 005 e 006 foram aplicadas com sucesso no Supabase.
 * Executa: npm run check-migrations
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface Verificacao {
  nome: string;
  ok: boolean;
  detalhe: string;
}

async function verificarTabela(tabela: string, esperadoMinimo: number): Promise<Verificacao> {
  const { count, error } = await supabase
    .from(tabela)
    .select("*", { count: "exact", head: true });

  if (error) {
    return {
      nome: tabela,
      ok: false,
      detalhe: `erro: ${error.message}`,
    };
  }

  const total = count ?? 0;
  const ok = total >= esperadoMinimo;
  return {
    nome: tabela,
    ok,
    detalhe: ok
      ? `${total} registros`
      : `${total} registros (esperado >= ${esperadoMinimo})`,
  };
}

async function verificarColuna(tabela: string, coluna: string): Promise<Verificacao> {
  const { error } = await supabase
    .from(tabela)
    .select(coluna)
    .limit(1);

  if (error) {
    return {
      nome: `${tabela}.${coluna}`,
      ok: false,
      detalhe: error.message,
    };
  }
  return {
    nome: `${tabela}.${coluna}`,
    ok: true,
    detalhe: "coluna presente",
  };
}

async function main() {
  console.log("\n🔎 Verificando migrations 005 e 006...\n");

  const resultados: Verificacao[] = [];

  // Migration 005 — Tabelas novas
  resultados.push(await verificarTabela("cat_funcoes", 28));
  resultados.push(await verificarTabela("cat_subfuncoes", 50));
  resultados.push(await verificarTabela("cat_naturezas_despesa", 20));
  resultados.push(await verificarTabela("cat_fontes_recurso", 15));
  resultados.push(await verificarTabela("unidades_orcamentarias", 0));

  // Migration 005 — Colunas adicionadas em acoes
  resultados.push(await verificarColuna("acoes", "acao_pai_id"));
  resultados.push(await verificarColuna("acoes", "unidade_orcamentaria_id"));
  resultados.push(await verificarColuna("acoes", "funcao_codigo"));
  resultados.push(await verificarColuna("acoes", "subfuncao_codigo"));
  resultados.push(await verificarColuna("acoes", "programa_codigo"));
  resultados.push(await verificarColuna("acoes", "acao_orcamentaria_codigo"));
  resultados.push(await verificarColuna("acoes", "natureza_despesa_codigo"));
  resultados.push(await verificarColuna("acoes", "origem"));
  resultados.push(await verificarColuna("acoes", "origem_referencia"));
  // Valores orçamentários (Fase A.1 — ajuste pós-feedback)
  resultados.push(await verificarColuna("acoes", "valor_fixado"));
  resultados.push(await verificarColuna("acoes", "valor_atualizado"));
  resultados.push(await verificarColuna("acoes", "valor_empenhado"));
  resultados.push(await verificarColuna("acoes", "valor_liquidado"));
  resultados.push(await verificarColuna("acoes", "valor_pago"));
  // VIEW de indicadores derivados
  resultados.push(await verificarTabela("vw_acoes_indicadores", 0));

  let okCount = 0;
  for (const r of resultados) {
    const icon = r.ok ? "✅" : "❌";
    console.log(`${icon} ${r.nome.padEnd(40)} ${r.detalhe}`);
    if (r.ok) okCount++;
  }

  console.log(`\n${okCount}/${resultados.length} verificações OK`);

  if (okCount === resultados.length) {
    console.log("\n🎉 Migrations 005 e 006 aplicadas com sucesso!");
  } else {
    console.log("\n⚠️  Migrations ainda NÃO aplicadas (ou aplicadas parcialmente).");
    console.log("\n👉 Como aplicar:");
    console.log("   1. Abra https://supabase.com/dashboard");
    console.log("   2. Selecione o projeto MonitorGov360");
    console.log("   3. Menu lateral → SQL Editor → New Query");
    console.log("   4. Cole o conteúdo de supabase/migrations/005_acoes_expansao.sql → Run");
    console.log("   5. Cole o conteúdo de supabase/migrations/006_seed_catalogos_orcamentarios.sql → Run");
    console.log("   6. Rode este script novamente: npm run check-migrations\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Erro inesperado:", err);
  process.exit(1);
});
