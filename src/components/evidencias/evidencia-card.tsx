"use client";

import {
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Video,
  MapPin,
  User,
  Calendar,
} from "lucide-react";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import {
  TIPOS_EVIDENCIA_LABELS,
  type Evidencia,
  type TipoEvidencia,
} from "@/lib/evidencias/mock";

interface EvidenciaCardProps {
  evidencia: Evidencia;
  onClick?: (evidencia: Evidencia) => void;
}

const TIPO_CONFIG: Record<
  TipoEvidencia,
  {
    icon: typeof ImageIcon;
    badge: string;
    miniatura: string;
  }
> = {
  foto: {
    icon: ImageIcon,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    miniatura: "bg-gradient-to-br from-emerald-200 to-emerald-400",
  },
  documento: {
    icon: FileText,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    miniatura: "bg-gradient-to-br from-blue-200 to-blue-400",
  },
  link: {
    icon: LinkIcon,
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    miniatura: "bg-gradient-to-br from-violet-200 to-violet-400",
  },
  video: {
    icon: Video,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    miniatura: "bg-gradient-to-br from-amber-200 to-amber-400",
  },
};

export function EvidenciaCard({ evidencia, onClick }: EvidenciaCardProps) {
  const config = TIPO_CONFIG[evidencia.tipo];
  const Icon = config.icon;

  const handleClick = () => {
    if (onClick) onClick(evidencia);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-left w-full bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all overflow-hidden group"
    >
      {/* Miniatura */}
      <div
        className={cn(
          "relative w-full h-36 flex items-center justify-center",
          config.miniatura
        )}
      >
        <Icon className="h-12 w-12 text-white/90 drop-shadow" />
        <span
          className={cn(
            "absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full border bg-white/90 backdrop-blur",
            config.badge
          )}
        >
          {TIPOS_EVIDENCIA_LABELS[evidencia.tipo]}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {evidencia.acaoTitulo}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2">
          {evidencia.descricao}
        </p>

        <div className="pt-2 border-t border-gray-100 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{evidencia.autor}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatDate(evidencia.dataUpload)}</span>
            {evidencia.ciclo && (
              <>
                <span className="text-gray-300">•</span>
                <span className="truncate">{evidencia.ciclo}</span>
              </>
            )}
          </div>
          {evidencia.geolocalizacao && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0 text-secondary-600" />
              <span className="truncate">
                {evidencia.geolocalizacao.endereco}
              </span>
            </div>
          )}
          {evidencia.tipo !== "link" && evidencia.arquivo.tamanhoKb > 0 && (
            <div className="text-xs text-gray-400 truncate">
              {evidencia.arquivo.nome} ·{" "}
              {formatFileSize(evidencia.arquivo.tamanhoKb * 1024)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
