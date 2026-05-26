"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Camera, Plus, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { EvidenciaCard } from "@/components/evidencias/evidencia-card";
import {
  EVIDENCIAS_MOCK,
  type Evidencia,
  type TipoEvidencia,
} from "@/lib/evidencias/mock";

type FiltroTipo = "todas" | TipoEvidencia;

const FILTROS: { key: FiltroTipo; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "foto", label: "Fotos" },
  { key: "documento", label: "Documentos" },
  { key: "link", label: "Links" },
  { key: "video", label: "Vídeos" },
];

export default function EvidenciasPage() {
  const [filtro, setFiltro] = useState<FiltroTipo>("todas");
  const [busca, setBusca] = useState<string>("");

  const evidenciasFiltradas = useMemo(() => {
    return EVIDENCIAS_MOCK.filter((ev) => {
      if (filtro !== "todas" && ev.tipo !== filtro) return false;
      if (
        busca &&
        !ev.acaoTitulo.toLowerCase().includes(busca.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [filtro, busca]);

  const contadores: Record<FiltroTipo, number> = useMemo(
    () => ({
      todas: EVIDENCIAS_MOCK.length,
      foto: EVIDENCIAS_MOCK.filter((e) => e.tipo === "foto").length,
      documento: EVIDENCIAS_MOCK.filter((e) => e.tipo === "documento").length,
      link: EVIDENCIAS_MOCK.filter((e) => e.tipo === "link").length,
      video: EVIDENCIAS_MOCK.filter((e) => e.tipo === "video").length,
    }),
    []
  );

  function handleCardClick(_evidencia: Evidencia) {
    // Reservado para abertura de detalhes em iteração futura.
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary-600" />
            Evidências
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Centralize fotos, documentos, links e vídeos que comprovam a execução das ações
          </p>
        </div>
        <Link
          href="/dashboard/evidencias/upload"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nova Evidência
        </Link>
      </div>

      {/* Filtros tipo chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap",
              filtro === f.key
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
            <span
              className={cn(
                "text-xs font-semibold px-1.5 rounded-full min-w-[1.5rem] text-center",
                filtro === f.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {contadores[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar pela ação vinculada..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-lg"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {/* Grid de cards */}
        {evidenciasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <Camera className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-700">
              Nenhuma evidência encontrada
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Ajuste os filtros ou cadastre uma nova evidência para começar a documentar a execução das ações.
            </p>
            <Link
              href="/dashboard/evidencias/upload"
              className="inline-flex items-center gap-2 mt-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Evidência
            </Link>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidenciasFiltradas.map((ev) => (
              <EvidenciaCard
                key={ev.id}
                evidencia={ev}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
