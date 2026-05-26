"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Loader2,
  ClipboardList,
  Camera,
  Wallet,
  History,
} from "lucide-react";
import { useState } from "react";
import { signoutUser } from "@/lib/supabase/auth-helpers";
import { NotificationBell } from "@/components/notificacoes/notification-bell";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/acoes", label: "Ações", icon: FolderOpen },
  { href: "/dashboard/questionarios", label: "Questionários", icon: ClipboardList },
  { href: "/dashboard/evidencias", label: "Evidências", icon: Camera },
  { href: "/dashboard/orcamento", label: "Orçamento", icon: Wallet },
  { href: "/dashboard/alertas", label: "Alertas", icon: Bell },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/auditoria", label: "Auditoria", icon: History },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

function useSignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signoutUser();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return { handleSignOut, loading };
}

export function Sidebar() {
  const pathname = usePathname();
  const { handleSignOut, loading } = useSignOut();

  return (
    <aside className="w-64 bg-primary-900 text-white flex flex-col shrink-0 hidden lg:flex">
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-secondary-400" />
          <span className="font-bold text-lg">
            MonitorGov<span className="text-secondary-400">360</span>
          </span>
        </Link>
        <NotificationBell />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150
                     disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
          {loading ? "Saindo..." : "Sair"}
        </button>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="lg:hidden bg-primary-900 text-white px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-secondary-400" />
          <span className="font-bold">
            MonitorGov<span className="text-secondary-400">360</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button type="button" aria-label="Abrir menu" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6 text-white" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-primary-900 text-white flex flex-col">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <span className="font-bold text-lg">
                MonitorGov<span className="text-secondary-400">360</span>
              </span>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
