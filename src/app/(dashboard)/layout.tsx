import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
} from "lucide-react";

export const metadata: Metadata = {
  title: {
    template: "%s | MonitorGov360",
    default: "Dashboard | MonitorGov360",
  },
};

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/acoes",
    label: "Ações",
    icon: FolderOpen,
  },
  {
    href: "/dashboard/relatorios",
    label: "Relatórios",
    icon: BarChart3,
  },
  {
    href: "/dashboard/alertas",
    label: "Alertas",
    icon: Bell,
  },
  {
    href: "/dashboard/configuracoes",
    label: "Configurações",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-900 text-white flex flex-col shrink-0 hidden lg:flex">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-secondary-400" />
            <span className="font-bold text-lg">
              MonitorGov<span className="text-secondary-400">360</span>
            </span>
          </Link>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                         text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
            type="button"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="lg:hidden bg-primary-900 text-white px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-secondary-400" />
            <span className="font-bold">
              MonitorGov<span className="text-secondary-400">360</span>
            </span>
          </Link>
          <button type="button" aria-label="Abrir menu">
            <Menu className="h-6 w-6 text-white" />
          </button>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
