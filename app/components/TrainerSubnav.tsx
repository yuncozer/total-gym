"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Dumbbell, Calendar, UserCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function TrainerSubnav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: "/entrenador", label: t("trainer.rosterTitle"), icon: Users, active: pathname === "/entrenador" },
    { href: "/entrenador/rutinas", label: t("trainer.myRoutinesLink"), icon: Dumbbell, active: pathname.startsWith("/entrenador/rutinas") },
    { href: "/entrenador/agenda", label: t("trainer.agendaTitle"), icon: Calendar, active: pathname.startsWith("/entrenador/agenda") },
    { href: "/entrenador/perfil", label: t("trainer.publicProfileLink"), icon: UserCircle, active: pathname.startsWith("/entrenador/perfil") },
  ];

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            tab.active
              ? "bg-accent text-black"
              : "bg-card border border text-muted-foreground hover:text-white"
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
