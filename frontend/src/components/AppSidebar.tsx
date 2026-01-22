import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth.context";
import { Button } from "./ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["DIRETOR"],
  },
  {
    title: "Minhas Unidades",
    url: "/my-units",
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
  
  // INICIALIZAÇÃO CORRIGIDA:
  // Verifica se existe uma preferência salva. Se não existir, começa aberto (false).
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    // Salva a preferência no navegador
    localStorage.setItem("sidebar_collapsed", String(newState));
  };

  return (
    <aside
      className={`
        h-screen sticky top-0 flex-shrink-0 flex flex-col
        bg-brand-blue/40 backdrop-blur-xl
        border-r border-brand-blue/30
        shadow-xl
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Header & Toggle */}
      <div className={`flex items-center p-4 border-b border-brand-blue/30 h-[73px] ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-white tracking-wide whitespace-nowrap overflow-hidden">
            Inventário
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* User info */}
      <div className={`p-4 border-b border-brand-blue/30 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
        <div className="w-10 h-10 rounded-full bg-brand-blue-soft/50 flex items-center justify-center border border-white/10 flex-shrink-0">
            <User className="w-5 h-5 text-white" />
        </div>
        
        {!isCollapsed && (
          <div className="space-y-0.5 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name || "Usuário"}
            </p>
            <p className="text-xs text-white/60 truncate uppercase">
              {user?.role || "Cargo"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {navigationItems
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.url;

              return (
                <li key={item.title} title={isCollapsed ? item.title : ""}>
                  <RouterNavLink
                    to={item.url}
                    className={`
                      flex items-center rounded-xl
                      transition-all duration-200 group
                      ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"}
                      ${
                        isActive
                          ? "bg-gradient-to-r from-brand-blue-soft to-brand-purple text-white shadow-md"
                          : "text-white/80 hover:bg-white/10"
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${!isActive && "group-hover:text-white"}`} />
                    
                    {!isCollapsed && (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {item.title}
                      </span>
                    )}
                  </RouterNavLink>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-brand-blue/30">
        <Button
          onClick={logout}
          variant="ghost"
          className={`w-full flex items-center text-white/80 hover:text-white hover:bg-white/10
            ${isCollapsed ? "justify-center px-0" : "justify-start gap-3"}
          `}
          title={isCollapsed ? "Sair" : ""}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}