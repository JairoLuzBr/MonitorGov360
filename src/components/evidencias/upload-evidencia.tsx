"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Upload,
  X,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video,
  File as FileIcon,
} from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { QUESTIONARIOS_MOCK } from "@/lib/questionarios/schema";

interface ArquivoSelecionado {
  id: string;
  file: File;
}

interface GeoCapturada {
  lat: number;
  lng: number;
}

type StatusGeo = "idle" | "obtendo" | "ok" | "erro";
type StatusEnvio = "idle" | "enviando" | "sucesso";

interface UploadEvidenciaProps {
  onSuccess?: () => void;
}

function iconePorMime(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return Video;
  if (mime === "application/pdf" || mime.startsWith("text/")) return FileText;
  return FileIcon;
}

export function UploadEvidencia({ onSuccess }: UploadEvidenciaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivos, setArquivos] = useState<ArquivoSelecionado[]>([]);
  const [acaoId, setAcaoId] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [dragAtivo, setDragAtivo] = useState<boolean>(false);

  const [statusGeo, setStatusGeo] = useState<StatusGeo>("idle");
  const [geo, setGeo] = useState<GeoCapturada | null>(null);
  const [erroGeo, setErroGeo] = useState<string>("");

  const [statusEnvio, setStatusEnvio] = useState<StatusEnvio>("idle");
  const [erros, setErros] = useState<Record<string, string>>({});

  function adicionarArquivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    const novos: ArquivoSelecionado[] = Array.from(lista).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
    }));
    setArquivos((prev) => [...prev, ...novos]);
    if (erros.arquivos) {
      setErros((prev) => {
        const novo = { ...prev };
        delete novo.arquivos;
        return novo;
      });
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    adicionarArquivos(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragAtivo(false);
    adicionarArquivos(e.dataTransfer.files);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragAtivo(true);
  }

  function handleDragLeave() {
    setDragAtivo(false);
  }

  function removerArquivo(id: string) {
    setArquivos((prev) => prev.filter((a) => a.id !== id));
  }

  function capturarGeolocalizacao() {
    setErroGeo("");
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatusGeo("erro");
      setErroGeo("Geolocalização não é suportada por este navegador.");
      return;
    }
    setStatusGeo("obtendo");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatusGeo("ok");
      },
      (err) => {
        setStatusGeo("erro");
        if (err.code === err.PERMISSION_DENIED) {
          setErroGeo("Permissão de localização negada. Habilite nas configurações do navegador.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErroGeo("Localização indisponível no momento.");
        } else if (err.code === err.TIMEOUT) {
          setErroGeo("Tempo esgotado ao obter a localização.");
        } else {
          setErroGeo("Não foi possível obter a localização.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function removerGeo() {
    setGeo(null);
    setStatusGeo("idle");
    setErroGeo("");
  }

  function validar(): boolean {
    const novosErros: Record<string, string> = {};
    if (arquivos.length === 0) novosErros.arquivos = "Selecione ao menos um arquivo";
    if (!acaoId) novosErros.acaoId = "Selecione a ação vinculada";
    if (!descricao.trim()) novosErros.descricao = "Descreva brevemente a evidência";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setStatusEnvio("enviando");
    setTimeout(() => {
      setStatusEnvio("sucesso");
      if (onSuccess) onSuccess();
    }, 1200);
  }

  if (statusEnvio === "sucesso") {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Evidência enviada!</h3>
          <p className="text-sm text-gray-500 mt-1">
            {arquivos.length === 1
              ? "1 arquivo foi vinculado à ação selecionada."
              : `${arquivos.length} arquivos foram vinculados à ação selecionada.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Área de drag & drop */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Arquivos <span className="text-red-500">*</span>
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            dragAtivo
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-primary-400 hover:bg-gray-50",
            erros.arquivos && "border-red-300 bg-red-50/40"
          )}
        >
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Arraste arquivos aqui ou{" "}
            <span className="text-primary-600 underline">clique para selecionar</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Aceita fotos, documentos PDF, vídeos e outros arquivos.
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
        {erros.arquivos && (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {erros.arquivos}
          </p>
        )}

        {/* Lista de arquivos */}
        {arquivos.length > 0 && (
          <ul className="mt-4 space-y-2">
            {arquivos.map((a) => {
              const Icon = iconePorMime(a.file.type);
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {a.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(a.file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerArquivo(a.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                    aria-label={`Remover ${a.file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Ação vinculada */}
      <div>
        <label
          htmlFor="acao-vinculada"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Vincular à ação <span className="text-red-500">*</span>
        </label>
        <select
          id="acao-vinculada"
          value={acaoId}
          onChange={(e) => {
            setAcaoId(e.target.value);
            if (erros.acaoId) {
              setErros((prev) => {
                const novo = { ...prev };
                delete novo.acaoId;
                return novo;
              });
            }
          }}
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30",
            erros.acaoId ? "border-red-300" : "border-gray-200"
          )}
        >
          <option value="">Selecione uma ação...</option>
          {QUESTIONARIOS_MOCK.map((q) => (
            <option key={q.acaoId} value={q.acaoId}>
              {q.acaoTitulo}
            </option>
          ))}
        </select>
        {erros.acaoId && (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {erros.acaoId}
          </p>
        )}
      </div>

      {/* Geolocalização */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Geolocalização (opcional)
        </label>
        {geo ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800">
                Localização capturada
              </p>
              <p className="text-xs text-emerald-700">
                Lat: {geo.lat.toFixed(6)} · Lng: {geo.lng.toFixed(6)}
              </p>
            </div>
            <button
              type="button"
              onClick={removerGeo}
              className="text-xs text-emerald-700 hover:text-emerald-900 underline"
            >
              Remover
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={capturarGeolocalizacao}
            disabled={statusGeo === "obtendo"}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-60"
          >
            {statusGeo === "obtendo" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {statusGeo === "obtendo"
              ? "Obtendo localização..."
              : "Capturar localização atual"}
          </button>
        )}
        {statusGeo === "erro" && erroGeo && (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {erroGeo}
          </p>
        )}
      </div>

      {/* Descrição */}
      <div>
        <label
          htmlFor="descricao-evidencia"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Descrição <span className="text-red-500">*</span>
        </label>
        <textarea
          id="descricao-evidencia"
          value={descricao}
          onChange={(e) => {
            setDescricao(e.target.value);
            if (erros.descricao) {
              setErros((prev) => {
                const novo = { ...prev };
                delete novo.descricao;
                return novo;
              });
            }
          }}
          rows={4}
          maxLength={1000}
          placeholder="Descreva brevemente o contexto e o conteúdo desta evidência..."
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30",
            erros.descricao ? "border-red-300" : "border-gray-200"
          )}
        />
        <div className="flex items-center justify-between mt-1.5">
          {erros.descricao ? (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {erros.descricao}
            </p>
          ) : (
            <span className="text-xs text-gray-400">Máx. 1000 caracteres</span>
          )}
          <span className="text-xs text-gray-400">{descricao.length}/1000</span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={statusEnvio === "enviando"}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {statusEnvio === "enviando" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Enviar evidência
            </>
          )}
        </button>
      </div>
    </form>
  );
}
