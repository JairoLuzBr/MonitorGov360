"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Path, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  acaoCreateSchema,
  type AcaoCreateInput,
} from "@/lib/acoes/schema";
import {
  FONTES_RECURSO_LEGADO,
  NIVEIS_RISCO,
  NIVEL_RISCO_LABELS,
  ORIGENS_ACAO,
  ORIGEM_ACAO_LABELS,
  STATUS_ACAO,
  STATUS_ACAO_LABELS,
  TIPOS_ACAO,
  TIPO_ACAO_LABELS,
} from "@/lib/acoes/types";
import {
  listarAcoesPaiCandidatas,
  listarFuncoes,
  listarNaturezasDespesa,
  listarOrgaos,
  listarSubfuncoes,
  listarUnidadesOrcamentarias,
  listarUsuariosAtivos,
  type FuncaoOption,
  type NaturezaDespesaOption,
  type OrgaoOption,
  type SubfuncaoOption,
  type UnidadeOrcamentariaOption,
  type UsuarioOption,
} from "@/lib/acoes/queries";

import {
  Field,
  MoneyInput,
  SecaoForm,
  Select,
  Textarea,
  TextInput,
} from "./campos-form";

// =============================================================================
// Tipos auxiliares
// =============================================================================

type FormValues = AcaoCreateInput;

interface AcaoFormProps {
  modo: "criar" | "editar";
  acaoId?: string;
  defaultValues?: Partial<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
}

const DEFAULT_VALUES: Partial<FormValues> = {
  tipo: "obra_publica",
  status: "planejada",
  nivel_risco: "baixo",
  origem: "manual",
  percentual_fisico: 0,
  percentual_financeiro: 0,
  valor_fixado: 0,
  valor_atualizado: 0,
  valor_empenhado: 0,
  valor_liquidado: 0,
  valor_pago: 0,
};

// =============================================================================
// Wizard: definição das 7 etapas e quais campos cada uma valida
// =============================================================================

interface StepMeta {
  id: string;
  titulo: string;
  descricaoCurta: string;
  /** Campos validados via trigger() antes de permitir avançar */
  campos: Path<FormValues>[];
}

const STEPS: StepMeta[] = [
  {
    id: "identificacao",
    titulo: "Identificação",
    descricaoCurta: "Tipo, título e escopo",
    campos: ["tipo", "titulo", "acao_pai_id", "descricao"],
  },
  {
    id: "classificacao",
    titulo: "Classificação",
    descricaoCurta: "Órgão, função, programa",
    campos: [
      "orgao_id",
      "unidade_orcamentaria_id",
      "funcao_codigo",
      "subfuncao_codigo",
      "programa_codigo",
      "acao_orcamentaria_codigo",
    ],
  },
  {
    id: "responsaveis",
    titulo: "Responsáveis",
    descricaoCurta: "Quem responde pela ação",
    campos: ["responsavel_id", "responsavel_secundario_id"],
  },
  {
    id: "execucao",
    titulo: "Execução",
    descricaoCurta: "Status, datas, indicadores",
    campos: [
      "status",
      "nivel_risco",
      "data_inicio",
      "data_prevista_fim",
      "data_real_fim",
      "percentual_fisico",
      "percentual_financeiro",
      "meta_quantitativa",
    ],
  },
  {
    id: "localizacao",
    titulo: "Localização",
    descricaoCurta: "Onde a ação acontece",
    campos: [
      "localizacao_bairro",
      "localizacao_endereco",
      "localizacao_lat",
      "localizacao_lng",
    ],
  },
  {
    id: "recursos",
    titulo: "Recursos",
    descricaoCurta: "Fonte, natureza, valores",
    campos: [
      "fonte_recurso",
      "natureza_despesa_codigo",
      "valor_fixado",
      "valor_atualizado",
      "valor_empenhado",
      "valor_liquidado",
      "valor_pago",
    ],
  },
  {
    id: "contratuais",
    titulo: "Contratuais",
    descricaoCurta: "Contrato, licitação, observações",
    campos: ["numero_contrato", "numero_licitacao", "observacoes"],
  },
];

const ULTIMO_STEP = STEPS.length - 1;

// =============================================================================
// Componente principal
// =============================================================================

type EscopoAcao = "macro" | "sub";

export function AcaoForm({
  modo,
  acaoId,
  defaultValues,
  onSubmit,
}: AcaoFormProps) {
  // Catálogos remotos
  const [orgaos, setOrgaos] = useState<OrgaoOption[]>([]);
  const [unidades, setUnidades] = useState<UnidadeOrcamentariaOption[]>([]);
  const [funcoes, setFuncoes] = useState<FuncaoOption[]>([]);
  const [subfuncoes, setSubfuncoes] = useState<SubfuncaoOption[]>([]);
  const [naturezas, setNaturezas] = useState<NaturezaDespesaOption[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [acoesPai, setAcoesPai] = useState<{ id: string; titulo: string }[]>([]);
  const [catalogosCarregando, setCatalogosCarregando] = useState(true);

  // Escopo: define se está cadastrando uma Ação Macro ou uma Sub-ação.
  // Inferido dos defaultValues: se já tem acao_pai_id → é sub-ação.
  const [escopo, setEscopo] = useState<EscopoAcao>(
    defaultValues?.acao_pai_id ? "sub" : "macro"
  );

  // Wizard
  const [passoAtual, setPassoAtual] = useState(0);

  // Form
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(acaoCreateSchema) as never,
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues } as FormValues,
  });

  const funcaoSelecionada = watch("funcao_codigo");
  const acaoPaiSelecionada = watch("acao_pai_id");
  const ehSubAcao = escopo === "sub";

  // Ao mudar o escopo: limpar campos relacionados conforme o caso
  function handleMudarEscopo(novo: EscopoAcao) {
    setEscopo(novo);
    if (novo === "macro") {
      // Macro: zera pai
      setValue("acao_pai_id", null);
      clearErrors("acao_pai_id");
    } else {
      // Sub-ação: zera valores orçamentários (CHECK constraint do banco)
      setValue("valor_fixado", 0);
      setValue("valor_atualizado", 0);
      setValue("valor_empenhado", 0);
      setValue("valor_liquidado", 0);
      setValue("valor_pago", 0);
    }
  }

  // Carrega catálogos
  useEffect(() => {
    let cancelado = false;
    Promise.all([
      listarOrgaos(),
      listarUnidadesOrcamentarias(),
      listarFuncoes(),
      listarSubfuncoes(),
      listarNaturezasDespesa(),
      listarUsuariosAtivos(),
      listarAcoesPaiCandidatas(acaoId),
    ])
      .then(([os, uos, fs, sfs, nds, us, ap]) => {
        if (cancelado) return;
        setOrgaos(os);
        setUnidades(uos);
        setFuncoes(fs);
        setSubfuncoes(sfs);
        setNaturezas(nds);
        setUsuarios(us);
        setAcoesPai(ap);
      })
      .catch((e) => toast.error("Falha ao carregar catálogos: " + (e as Error).message))
      .finally(() => !cancelado && setCatalogosCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [acaoId]);

  // Subfunções filtradas pela função selecionada
  const subfuncoesFiltradas = useMemo(
    () =>
      funcaoSelecionada
        ? subfuncoes.filter((s) => s.funcao_codigo === funcaoSelecionada)
        : [],
    [subfuncoes, funcaoSelecionada]
  );

  // Sincroniza funcao_nome e subfuncao_nome ao mudar o código
  useEffect(() => {
    const f = funcoes.find((x) => x.codigo === funcaoSelecionada);
    if (f) setValue("funcao_nome", f.nome);
    else if (!funcaoSelecionada) setValue("funcao_nome", null);
  }, [funcaoSelecionada, funcoes, setValue]);

  // Avança para o próximo step validando os campos do step atual.
  async function proximo() {
    // Regra especial do step 0: sub-ação precisa de pai
    if (passoAtual === 0 && escopo === "sub" && !watch("acao_pai_id")) {
      setError("acao_pai_id", {
        type: "manual",
        message: "Selecione a ação macro pai antes de continuar.",
      });
      return;
    }

    const ok = await trigger(STEPS[passoAtual].campos);
    if (!ok) return;
    setPassoAtual((s) => Math.min(s + 1, ULTIMO_STEP));
  }

  function anterior() {
    setPassoAtual((s) => Math.max(0, s - 1));
  }

  // Navegação direta pelos chips do stepper (apenas para etapas já visitadas
  // ou anteriores ao step atual — não permite "pular pra frente" sem validar).
  function irPara(idx: number) {
    if (idx <= passoAtual) setPassoAtual(idx);
  }

  const submeter: SubmitHandler<FormValues> = async (values) => {
    // Defesa: só aceita submit a partir da última etapa do wizard.
    // Evita submit acidental (Enter num campo, click em algum botão sem type).
    if (passoAtual !== ULTIMO_STEP) {
      return;
    }

    // Validação do escopo: sub-ação SEMPRE precisa de ação pai.
    if (escopo === "sub" && !values.acao_pai_id) {
      setError("acao_pai_id", {
        type: "manual",
        message: "Selecione a ação macro pai. Sub-ações sempre dependem de uma ação macro.",
      });
      return;
    }

    // Em macro, força acao_pai_id = null (defensivo)
    const acao_pai_id = escopo === "sub" ? values.acao_pai_id : null;

    // Espelha nomes do catálogo no payload (snapshot histórico)
    const subfuncao = subfuncoes.find((s) => s.codigo === values.subfuncao_codigo);
    const natureza = naturezas.find((n) => n.codigo === values.natureza_despesa_codigo);

    const payload: FormValues = {
      ...values,
      acao_pai_id,
      subfuncao_nome: subfuncao?.nome ?? null,
      natureza_despesa_nome: natureza?.nome ?? null,
    };

    await onSubmit(payload);
  };

  if (catalogosCarregando) {
    return (
      <div className="flex items-center gap-3 text-gray-500 p-10">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Carregando catálogos...</span>
      </div>
    );
  }

  // Previne submit acidental por Enter em inputs (exceto na última etapa).
  // Em <textarea> o Enter deve continuar inserindo nova linha — não afeta.
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    const target = e.target as HTMLElement;
    if (
      e.key === "Enter" &&
      passoAtual !== ULTIMO_STEP &&
      target.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
    }
  }

  // Handler explícito do "Salvar". Como o botão é type="button", o submit
  // só acontece quando o usuário clica de fato neste botão na última etapa.
  function aoClicarSalvar() {
    handleSubmit(submeter)();
  }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      className="space-y-5"
    >
      {/* Stepper de navegação entre etapas */}
      <Stepper
        steps={STEPS}
        atual={passoAtual}
        onClick={irPara}
      />

      {/* =========================================================== */}
      {/* 1. IDENTIFICAÇÃO                                              */}
      {/* =========================================================== */}
      {passoAtual === 0 && (
      <SecaoForm
        titulo="1. Identificação"
        descricao="Defina se é uma ação macro ou sub-ação, e os dados principais."
      >
        {/* Toggle: Ação Macro vs Sub-ação ============================= */}
        <div className="md:col-span-2">
          <span className="block text-xs font-medium text-gray-700 mb-2">
            Escopo do cadastro <span className="text-red-500">*</span>
          </span>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => handleMudarEscopo("macro")}
              className={
                escopo === "macro"
                  ? "px-4 py-1.5 rounded-md text-sm font-medium bg-white text-primary-700 shadow-sm"
                  : "px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900"
              }
            >
              Ação Macro
            </button>
            <button
              type="button"
              onClick={() => handleMudarEscopo("sub")}
              className={
                escopo === "sub"
                  ? "px-4 py-1.5 rounded-md text-sm font-medium bg-white text-primary-700 shadow-sm"
                  : "px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900"
              }
            >
              Sub-ação
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {escopo === "macro"
              ? "Macro: ação principal, carrega os valores orçamentários e pode ter várias sub-ações."
              : "Sub-ação: detalhamento operacional de uma ação macro. Obrigatório vincular a uma macro existente."}
          </p>
        </div>

        {/* Campo "Ação Pai" — só aparece quando escopo === sub */}
        {escopo === "sub" && (
          <Field
            label="Ação macro pai"
            required
            colSpan={2}
            hint={
              acoesPai.length === 0
                ? "Nenhuma ação macro disponível — cadastre uma macro primeiro."
                : "A sub-ação herda contexto e contabiliza dentro desta macro."
            }
            error={errors.acao_pai_id?.message}
          >
            <Select
              {...register("acao_pai_id")}
              defaultValue={defaultValues?.acao_pai_id ?? ""}
              hasError={!!errors.acao_pai_id}
              disabled={acoesPai.length === 0}
            >
              <option value="">— Selecione a ação macro —</option>
              {acoesPai.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.titulo}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Tipo de ação" required error={errors.tipo?.message} colSpan={1}>
          <Select {...register("tipo")} hasError={!!errors.tipo}>
            {TIPOS_ACAO.map((t) => (
              <option key={t} value={t}>
                {TIPO_ACAO_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Título"
          required
          colSpan={escopo === "sub" ? 1 : 2}
          error={errors.titulo?.message}
        >
          <TextInput
            placeholder={
              escopo === "macro"
                ? "Ex.: Reforma da UBS Centro"
                : "Ex.: Fase 1 — Demolição e remoção de entulho"
            }
            {...register("titulo")}
            hasError={!!errors.titulo}
          />
        </Field>

        <Field
          label="Descrição"
          colSpan={2}
          hint="Resumo do escopo, beneficiários, justificativa."
          error={errors.descricao?.message}
        >
          <Textarea
            rows={3}
            {...register("descricao")}
            hasError={!!errors.descricao}
          />
        </Field>
      </SecaoForm>
      )}

      {/* =========================================================== */}
      {/* 2. CLASSIFICAÇÃO ORÇAMENTÁRIA                                  */}
      {/* =========================================================== */}
      {passoAtual === 1 && (
      <SecaoForm
        titulo="2. Classificação Orçamentária"
        descricao="Estrutura LRF/LOA — órgão, unidade, função, subfunção, programa, ação orçamentária."
      >
        <Field label="Órgão" required error={errors.orgao_id?.message}>
          <Select {...register("orgao_id")} hasError={!!errors.orgao_id}>
            <option value="">Selecione…</option>
            {orgaos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.sigla ? `${o.sigla} — ${o.nome}` : o.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Unidade Orçamentária"
          hint={unidades.length === 0 ? "Nenhuma UO cadastrada ainda." : undefined}
        >
          <Select {...register("unidade_orcamentaria_id")} defaultValue="">
            <option value="">— Não vinculada —</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.codigo} — {u.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Função" error={errors.funcao_codigo?.message}>
          <Select {...register("funcao_codigo")} defaultValue="">
            <option value="">Selecione…</option>
            {funcoes.map((f) => (
              <option key={f.codigo} value={f.codigo}>
                {f.codigo} — {f.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Subfunção"
          hint={
            !funcaoSelecionada
              ? "Selecione uma função primeiro."
              : subfuncoesFiltradas.length === 0
              ? "Sem subfunções cadastradas para essa função."
              : undefined
          }
        >
          <Select
            {...register("subfuncao_codigo")}
            defaultValue=""
            disabled={!funcaoSelecionada || subfuncoesFiltradas.length === 0}
          >
            <option value="">Selecione…</option>
            {subfuncoesFiltradas.map((s) => (
              <option key={s.codigo} value={s.codigo}>
                {s.codigo} — {s.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Código do programa"
          hint="Código do programa (ex.: 0012)."
        >
          <TextInput placeholder="0012" {...register("programa_codigo")} />
        </Field>

        <Field label="Nome do programa">
          <TextInput placeholder="Mobilidade Urbana" {...register("programa_nome")} />
        </Field>

        <Field
          label="Código da ação orçamentária"
          hint="Código de 4 dígitos (Projeto/Atividade/Op. Especial)."
        >
          <TextInput placeholder="2001" {...register("acao_orcamentaria_codigo")} />
        </Field>

        <Field label="Nome da ação orçamentária">
          <TextInput
            placeholder="Manutenção de Vias Urbanas"
            {...register("acao_orcamentaria_nome")}
          />
        </Field>
      </SecaoForm>
      )}

      {/* =========================================================== */}
      {/* 3. RESPONSÁVEIS                                              */}
      {/* =========================================================== */}
      {passoAtual === 2 && (
      <SecaoForm
        titulo="3. Responsáveis"
        descricao="Quem responde pela execução. Ambos opcionais — podem ser atribuídos depois."
      >
        <Field label="Responsável principal">
          <Select {...register("responsavel_id")} defaultValue="">
            <option value="">— Sem responsável —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
                {u.cargo ? ` — ${u.cargo}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Responsável secundário">
          <Select {...register("responsavel_secundario_id")} defaultValue="">
            <option value="">—</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
                {u.cargo ? ` — ${u.cargo}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </SecaoForm>
      )}

      {/* =========================================================== */}
      {/* 4. EXECUÇÃO                                                  */}
      {/* =========================================================== */}
      {passoAtual === 3 && (
      <SecaoForm
        titulo="4. Execução"
        descricao="Status, datas e indicadores físicos."
      >
        <Field label="Status" required error={errors.status?.message}>
          <Select {...register("status")} hasError={!!errors.status}>
            {STATUS_ACAO.map((s) => (
              <option key={s} value={s}>
                {STATUS_ACAO_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Nível de risco" required error={errors.nivel_risco?.message}>
          <Select {...register("nivel_risco")} hasError={!!errors.nivel_risco}>
            {NIVEIS_RISCO.map((r) => (
              <option key={r} value={r}>
                {NIVEL_RISCO_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Data de início" error={errors.data_inicio?.message}>
          <TextInput type="date" {...register("data_inicio")} hasError={!!errors.data_inicio} />
        </Field>

        <Field label="Previsão de término" error={errors.data_prevista_fim?.message}>
          <TextInput
            type="date"
            {...register("data_prevista_fim")}
            hasError={!!errors.data_prevista_fim}
          />
        </Field>

        <Field label="Data real de término">
          <TextInput type="date" {...register("data_real_fim")} />
        </Field>

        <Field label="Meta quantitativa">
          <TextInput
            type="number"
            step="any"
            placeholder="Ex.: 8"
            {...register("meta_quantitativa", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
          />
        </Field>

        <Field label="Unidade da meta" hint='Ex.: "km", "famílias", "alunos"'>
          <TextInput placeholder="km" {...register("unidade_meta")} />
        </Field>

        <Field
          label="% físico (entrega)"
          hint="Atualizado pelos questionários a partir da Fase F."
          error={errors.percentual_fisico?.message}
        >
          <TextInput
            type="number"
            step="0.1"
            min={0}
            max={100}
            {...register("percentual_fisico", { setValueAs: (v) => Number(v) })}
            hasError={!!errors.percentual_fisico}
          />
        </Field>

        <Field
          label="% financeiro"
          hint="Pode ser preenchido ou virá dos valores."
          error={errors.percentual_financeiro?.message}
        >
          <TextInput
            type="number"
            step="0.1"
            min={0}
            max={100}
            {...register("percentual_financeiro", { setValueAs: (v) => Number(v) })}
            hasError={!!errors.percentual_financeiro}
          />
        </Field>
      </SecaoForm>
      )}

      {/* =========================================================== */}
      {/* 5. LOCALIZAÇÃO                                               */}
      {/* =========================================================== */}
      {passoAtual === 4 && (
      <SecaoForm titulo="5. Localização" descricao="Onde a ação acontece (opcional).">
        <Field label="Bairro">
          <TextInput placeholder="Centro" {...register("localizacao_bairro")} />
        </Field>

        <Field label="Endereço">
          <TextInput
            placeholder="Av. Principal, 250"
            {...register("localizacao_endereco")}
          />
        </Field>

        <Field label="Latitude" hint="Decimal (-90 a 90).">
          <TextInput
            type="number"
            step="any"
            placeholder="-23.5505"
            {...register("localizacao_lat", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
          />
        </Field>

        <Field label="Longitude" hint="Decimal (-180 a 180).">
          <TextInput
            type="number"
            step="any"
            placeholder="-46.6333"
            {...register("localizacao_lng", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
          />
        </Field>
      </SecaoForm>
      )}

      {/* =========================================================== */}
      {/* 6. ORIGEM DOS RECURSOS                                       */}
      {/* =========================================================== */}
      {passoAtual === 5 && (
      <SecaoForm
        titulo="6. Origem dos Recursos"
        descricao={
          ehSubAcao
            ? "⚠️ Sub-ações NÃO recebem valores — preencha somente na ação macro."
            : "Fonte do recurso, natureza da despesa e valores orçamentários."
        }
      >
        <Field label="Fonte de recurso (legado)">
          <Select {...register("fonte_recurso")} defaultValue="">
            <option value="">—</option>
            {FONTES_RECURSO_LEGADO.map((f) => (
              <option key={f} value={f}>
                {f.replace("_", " ")}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Natureza da despesa">
          <Select {...register("natureza_despesa_codigo")} defaultValue="">
            <option value="">— Selecione —</option>
            {naturezas.map((n) => (
              <option key={n.codigo} value={n.codigo}>
                {n.codigo} — {n.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Valor fixado (LOA)"
          hint={ehSubAcao ? "Bloqueado para sub-ações." : "Dotação inicial."}
          error={errors.valor_fixado?.message}
        >
          <Controller
            control={control}
            name="valor_fixado"
            render={({ field }) => (
              <MoneyInput
                value={field.value ?? 0}
                onChange={field.onChange}
                disabled={ehSubAcao}
                hasError={!!errors.valor_fixado}
              />
            )}
          />
        </Field>

        <Field label="Valor atualizado">
          <Controller
            control={control}
            name="valor_atualizado"
            render={({ field }) => (
              <MoneyInput
                value={field.value ?? 0}
                onChange={field.onChange}
                disabled={ehSubAcao}
              />
            )}
          />
        </Field>

        <Field label="Valor empenhado">
          <Controller
            control={control}
            name="valor_empenhado"
            render={({ field }) => (
              <MoneyInput
                value={field.value ?? 0}
                onChange={field.onChange}
                disabled={ehSubAcao}
              />
            )}
          />
        </Field>

        <Field label="Valor liquidado">
          <Controller
            control={control}
            name="valor_liquidado"
            render={({ field }) => (
              <MoneyInput
                value={field.value ?? 0}
                onChange={field.onChange}
                disabled={ehSubAcao}
              />
            )}
          />
        </Field>

        <Field
          label="Valor pago"
          hint="Usado no cálculo do Indicador de Eficiência."
          colSpan={2}
        >
          <Controller
            control={control}
            name="valor_pago"
            render={({ field }) => (
              <MoneyInput
                value={field.value ?? 0}
                onChange={field.onChange}
                disabled={ehSubAcao}
              />
            )}
          />
        </Field>
      </SecaoForm>
      )}

      {/* =========================================================== */}
      {/* 7. DADOS CONTRATUAIS                                         */}
      {/* =========================================================== */}
      {passoAtual === 6 && (
      <SecaoForm
        titulo="7. Dados Contratuais"
        descricao="Contrato, licitação e observações."
      >
        <Field label="Número do contrato">
          <TextInput placeholder="001/2024" {...register("numero_contrato")} />
        </Field>

        <Field label="Número da licitação">
          <TextInput placeholder="TP 002/2023" {...register("numero_licitacao")} />
        </Field>

        <Field label="Origem do cadastro" colSpan={1}>
          <Select {...register("origem")}>
            {ORIGENS_ACAO.map((o) => (
              <option key={o} value={o}>
                {ORIGEM_ACAO_LABELS[o]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Referência externa" hint="ID no sistema de origem, se houver.">
          <TextInput placeholder="—" {...register("origem_referencia")} />
        </Field>

        <Field label="Observações" colSpan={2}>
          <Textarea rows={3} {...register("observacoes")} />
        </Field>
      </SecaoForm>
      )}

      {/* =========================================================== */}
      {/* NAVEGAÇÃO DO WIZARD                                          */}
      {/* =========================================================== */}
      <div className="sticky bottom-0 bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/70 -mx-1 px-1 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/acoes"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancelar
          </Link>
          {passoAtual > 0 && (
            <button
              type="button"
              onClick={anterior}
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 hidden sm:block">
          Etapa <strong>{passoAtual + 1}</strong> de {STEPS.length} — {STEPS[passoAtual].titulo}
        </div>

        {passoAtual < ULTIMO_STEP ? (
          <button
            key="btn-continuar"
            type="button"
            onClick={proximo}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Continuar
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            key="btn-salvar"
            type="button"
            onClick={aoClicarSalvar}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {modo === "criar" ? "Criar ação" : "Salvar alterações"}
          </button>
        )}
      </div>
    </form>
  );
}

// =============================================================================
// Stepper visual: chips numerados das 7 etapas
// =============================================================================

interface StepperProps {
  steps: StepMeta[];
  atual: number;
  onClick: (idx: number) => void;
}

function Stepper({ steps, atual, onClick }: StepperProps) {
  return (
    <nav aria-label="Progresso do cadastro" className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
      <ol className="flex items-center justify-between gap-1 overflow-x-auto">
        {steps.map((step, idx) => {
          const concluido = idx < atual;
          const ativo = idx === atual;
          const navegavel = idx <= atual;
          return (
            <li key={step.id} className="flex items-center gap-1 min-w-0">
              <button
                type="button"
                onClick={() => onClick(idx)}
                disabled={!navegavel}
                aria-current={ativo ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  ativo
                    ? "bg-primary-50 text-primary-700"
                    : concluido
                    ? "text-emerald-700 hover:bg-emerald-50"
                    : "text-gray-400 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                    ativo
                      ? "bg-primary-600 text-white"
                      : concluido
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {concluido ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </span>
                <span className="hidden md:inline whitespace-nowrap">
                  {step.titulo}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
