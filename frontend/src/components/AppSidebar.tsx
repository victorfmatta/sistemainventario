import {
  LayoutDashboard,
  Building2,
  FileText,
  LogOut,
  Warehouse,
  Shield,
  Truck,
  PackagePlus,
  History,
} from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth.context";
import { Button } from "./ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["DIRETOR", "COORDENADOR", "INSTRUTOR"],
  },
  {
    title: "Minhas Unidades",
    url: "/dashboard",
    icon: Building2,
    roles: ["DIRETOR", "COORDENADOR", "INSTRUTOR"],
  },
  {
    title: "Solicitações",
    url: "/requests",
    icon: FileText,
    roles: ["DIRETOR", "COORDENADOR", "INSTRUTOR"],
  },
  {
    title: "Estoque Central",
    url: "/central-stock",
    icon: Warehouse,
    roles: ["DIRETOR"],
  },
  {
    title: "Administração",
    url: "/admin",
    icon: Shield,
    roles: ["DIRETOR", "COORDENADOR"],
  },
  {
    title: "Fornecedores",
    url: "/suppliers",
    icon: Truck,
    roles: ["DIRETOR"],
  },
  {
    title: "Entrada de Estoque",
    url: "/stock-entry",
    icon: PackagePlus,
    roles: ["DIRETOR"],
  },
  {
    title: "Histórico",
    url: "/stock-history",
    icon: History,
    roles: ["DIRETOR"],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 h-screen sticky top-0 flex-shrink-0 flex flex-col
      bg-brand-blue/40 backdrop-blur-xl
      border-r border-brand-blue/30
      shadow-xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-brand-blue/30">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Inventário
        </h2>
      </div>

      {/* User info */}
      <div className="p-6 border-b border-brand-blue/30">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">
            {user?.name || "Usuário"}
          </p>
          <p className="text-xs text-white/60">
            {user?.role || "Cargo"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.url;

              return (
                <li key={item.title}>
                  <RouterNavLink
                    to={item.url}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${isActive
                        ? "bg-gradient-to-r from-brand-blue-soft to-brand-purple text-white shadow-md"
                        : "text-white/80 hover:bg-white/10"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {item.title}
                    </span>
                  </RouterNavLink>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-brand-blue/30">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full flex items-center justify-start gap-3
            text-white/80 hover:text-white hover:bg-white/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair</span>
        </Button>
      </div>
    </aside>
  );
}
