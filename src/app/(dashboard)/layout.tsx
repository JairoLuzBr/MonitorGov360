import type { Metadata } from "next";
import { Sidebar, MobileHeader } from "./sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s | MonitorGov360",
    default: "Dashboard | MonitorGov360",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
