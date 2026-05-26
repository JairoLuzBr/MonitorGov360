"use client";

import { useState } from "react";
import { Upload, X, Camera, FileText, HelpCircle, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pergunta, QuestionarioSchema } from "@/lib/questionarios/schema";

interface FormularioDinamicoProps {
  schema: QuestionarioSchema;
  onSubmit: (respostas: Record<string, unknown>) => Promise<void> | void;
}

export function FormularioDinamico({ schema, onSubmit }: FormularioDinamicoProps) {
  const [respostas, setRespostas] = useState<Record<string, unknown>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function setResposta(id: string, value: unknown) {
    setRespostas((prev) => ({ ...prev, [id]: value }));
    if (erros[id]) {
      setErros((prev) => {
        const novo = { ...prev };
        delete novo[id];
        return novo;
      });
    }
  }

  function validar(): boolean {
    const novosErros: Record<string, string> = {};

    for (const p of schema.perguntas) {
      const valor = respostas[p.id];

      if (p.obrigatoria) {
        const vazio =
          valor === undefined ||
          valor === null ||
          valor === "" ||
          (Array.isArray(valor) && valor.length === 0);
        if (vazio) {
          novosErros[p.id] = "Campo obrigatório";
          continue;
        }
      }

      if (p.validacao) {
        if (p.tipo === "numero" || p.tipo === "percentual" || p.tipo === "moeda") {
          const n = Number(valor);
          if (!Number.isNaN(n)) {
            if (p.validacao.min !== undefined && n < p.validacao.min) {
              novosErros[p.id] = `Mínimo: ${p.validacao.min}`;
            }
            if (p.validacao.max !== undefined && n > p.validacao.max) {
              novosErros[p.id] = `Máximo: ${p.validacao.max}`;
            }
          }
        }
        if (p.validacao.maxLength && typeof valor === "string" && valor.length > p.validacao.maxLength) {
          novosErros[p.id] = `Máximo ${p.validacao.maxLength} caracteres`;
        }
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) {
      const firstError = document.querySelector("[data-error='true']");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setEnviando(true);
    try {
      await onSubmit(respostas);
      setSucesso(true);
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Questionário Enviado!</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Suas respostas foram registradas com sucesso. Você pode visualizar este envio na lista de questionários respondidos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {schema.perguntas.map((p) => (
        <CampoDinamico
          key={p.id}
          pergunta={p}
          valor={respostas[p.id]}
          erro={erros[p.id]}
          onChange={(v) => setResposta(p.id, v)}
        />
      ))}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Respostas"
          )}
        </button>
      </div>
    </form>
  );
}

// ============== CAMPO DINÂMICO ==============

interface CampoDinamicoProps {
  pergunta: Pergunta;
  valor: unknown;
  erro?: string;
  onChange: (v: unknown) => void;
}

function CampoDinamico({ pergunta, valor, erro, onChange }: CampoDinamicoProps) {
  const baseInputClass = cn(
    "w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400",
    "text-sm transition-colors outline-none",
    "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
    erro ? "border-red-400" : "border-gray-300"
  );

  return (
    <div data-error={!!erro} className="space-y-1.5">
      <label htmlFor={pergunta.id} className="block text-sm font-medium text-gray-700">
        {pergunta.pergunta}
        {pergunta.obrigatoria && <span className="text-red-500 ml-1">*</span>}
      </label>

      {pergunta.ajuda && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <HelpCircle className="h-3 w-3 inline" />
          {pergunta.ajuda}
        </p>
      )}

      {pergunta.tipo === "texto" && (
        <input
          id={pergunta.id}
          type="text"
          value={(valor as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={pergunta.validacao?.maxLength}
          className={baseInputClass}
        />
      )}

      {pergunta.tipo === "textarea" && (
        <textarea
          id={pergunta.id}
          value={(valor as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          maxLength={pergunta.validacao?.maxLength}
          className={cn(baseInputClass, "resize-none")}
        />
      )}

      {pergunta.tipo === "numero" && (
        <input
          id={pergunta.id}
          type="number"
          value={(valor as number | string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          min={pergunta.validacao?.min}
          max={pergunta.validacao?.max}
          className={baseInputClass}
        />
      )}

      {pergunta.tipo === "percentual" && (
        <div className="relative">
          <input
            id={pergunta.id}
            type="number"
            value={(valor as number | string) ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
            min={0}
            max={100}
            step={0.1}
            className={cn(baseInputClass, "pr-8")}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
        </div>
      )}

      {pergunta.tipo === "moeda" && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
          <input
            id={pergunta.id}
            type="number"
            value={(valor as number | string) ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
            min={0}
            step={0.01}
            className={cn(baseInputClass, "pl-10")}
          />
        </div>
      )}

      {pergunta.tipo === "data" && (
        <input
          id={pergunta.id}
          type="date"
          value={(valor as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      )}

      {pergunta.tipo === "select" && (
        <select
          id={pergunta.id}
          value={(valor as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          <option value="">Selecione...</option>
          {pergunta.opcoes?.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      )}

      {pergunta.tipo === "multiselect" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pergunta.opcoes?.map((op) => {
            const selecionados = (valor as string[]) || [];
            const ativo = selecionados.includes(op);
            return (
              <button
                key={op}
                type="button"
                onClick={() => {
                  if (ativo) {
                    onChange(selecionados.filter((s) => s !== op));
                  } else {
                    onChange([...selecionados, op]);
                  }
                }}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg border transition-colors text-left",
                  ativo
                    ? "bg-primary-50 border-primary-500 text-primary-700 font-medium"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                )}
              >
                {op}
              </button>
            );
          })}
        </div>
      )}

      {pergunta.tipo === "checkbox" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            id={pergunta.id}
            type="checkbox"
            checked={!!valor}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Sim</span>
        </label>
      )}

      {(pergunta.tipo === "fotos" || pergunta.tipo === "documento") && (
        <UploadArquivos
          tipo={pergunta.tipo}
          arquivos={(valor as File[]) || []}
          onChange={(files) => onChange(files)}
        />
      )}

      {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
    </div>
  );
}

// ============== UPLOAD DE ARQUIVOS ==============

interface UploadArquivosProps {
  tipo: "fotos" | "documento";
  arquivos: File[];
  onChange: (files: File[]) => void;
}

function UploadArquivos({ tipo, arquivos, onChange }: UploadArquivosProps) {
  const accept = tipo === "fotos" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx";
  const Icon = tipo === "fotos" ? Camera : FileText;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(e.target.files || []);
    onChange([...arquivos, ...novos]);
  }

  function remover(index: number) {
    onChange(arquivos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={`upload-${tipo}`}
        className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
          <Upload className="h-5 w-5 text-primary-600" />
        </div>
        <p className="text-sm text-gray-700 font-medium">
          {tipo === "fotos" ? "Anexar fotos" : "Anexar documentos"}
        </p>
        <p className="text-xs text-gray-500">
          {tipo === "fotos" ? "JPG, PNG, HEIC" : "PDF, DOC, XLS"}
        </p>
        <input
          id={`upload-${tipo}`}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {arquivos.length > 0 && (
        <div className="space-y-1.5">
          {arquivos.map((arq, i) => (
            <div
              key={`${arq.name}-${i}`}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm"
            >
              <Icon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="flex-1 truncate text-gray-700">{arq.name}</span>
              <span className="text-xs text-gray-400">{(arq.size / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={() => remover(i)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
