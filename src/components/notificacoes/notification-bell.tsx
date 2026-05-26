"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, AlertTriangle, Clock, Info, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Severidade = "critico" | "atencao" | "info";

interface Notificacao {
  id: string;
  severidade: Severidade;
  titulo: string;
  descricao: string;
  tempo: string;
  lida: boolean;
  link?: string;
}

const NOTIFICACOES_MOCK: Notificacao[] = [
  {
    id: "n1",
    severidade: "critico",
    titulo: "Obra paralisada há 30 dias",
    descricao: "Pavimentação Av. Central sem atualização",
    tempo: "há 2 min",
    lida: false,
    link: "/dashboard/alertas",
  },
  {
    id: "n2",
    severidade: "critico",
    titulo: "Questionário em atraso",
    descricao: "Reforma UBS Jardim Esperança — vencido hoje",
    tempo: "há 15 min",
    lida: false,
    link: "/dashboard/questionarios",
  },
  {
    id: "n3",
    severidade: "atencao",
    titulo: "Divergência físico-financeira",
    descricao: "% físico < % financeiro na Av. Central",
    tempo: "há 1h",
    lida: false,
    link: "/dashboard/alertas",
  },
  {
    id: "n4",
    severidade: "atencao",
    titulo: "Documentação pendente",
    descricao: "Contrato 2026NE00089 sem laudo técnico",
    tempo: "há 3h",
    lida: true,
    link: "/dashboard/alertas",
  },
  {
    id: "n5",
    severidade: "info",
    titulo: "Novo ciclo de questionários",
    descricao: "6 questionários da semana foram gerados",
    tempo: "ontem",
    lida: true,
    link: "/dashboard/questionarios",
  },
];

const severidadeConfig = {
  critico: {
    icon: AlertTriangle,
    iconClasses: "text-red-500 bg-red-50",
  },
  atencao: {
    icon: Clock,
    iconClasses: "text-amber-500 bg-amber-50",
  },
  info: {
    icon: Info,
    iconClasses: "text-blue-500 bg-blue-50",
  },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(NOTIFICACOES_MOCK);
  const containerRef = useRef<HTMLDivElement>(null);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [open]);

  function marcarTodasComoLidas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  function marcarComoLida(id: string) {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-primary-900">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden text-gray-900">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Notificações</h3>
              <p className="text-xs text-gray-500">
                {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? "s" : ""}` : "Tudo em dia"}
              </p>
            </div>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasComoLidas}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">Sem notificações</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notificacoes.map((n) => {
                  const cfg = severidadeConfig[n.severidade];
                  const Icone = cfg.icon;
                  return (
                    <Link
                      key={n.id}
                      href={n.link ?? "#"}
                      onClick={() => {
                        marcarComoLida(n.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                        !n.lida && "bg-blue-50/40"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.iconClasses)}>
                        <Icone className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm truncate", !n.lida ? "font-semibold text-gray-900" : "text-gray-700")}>
                          {n.titulo}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{n.descricao}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.tempo}</p>
                      </div>
                      {!n.lida && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100">
            <Link
              href="/dashboard/alertas"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              Ver todos os alertas
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
