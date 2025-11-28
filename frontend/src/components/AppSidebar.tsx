import { LayoutDashboard, Building2, FileText, LogOut, Warehouse, Shield } from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth.context";
import { Button } from "./ui/button";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ['DIRETOR', 'COORDENADOR', 'INSTRUTOR'] },
  { title: "Minhas Unidades", url: "/dashboard", icon: Building2, roles: ['DIRETOR', 'COORDENADOR', 'INSTRUTOR'] },
  { title: "Solicitações", url: "/requests", icon: FileText, roles: ['DIRETOR', 'COORDENADOR', 'INSTRUTOR'] },
  { title: "Estoque Central", url: "/central-stock", icon: Warehouse, roles: ['DIRETOR'] },
  { title: "Administração", url: "/admin", icon: Shield, roles: ['DIRETOR', 'COORDENADOR'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-lg border-r border-border flex flex-col h-screen sticky top-0 flex-shrink-0">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">Inventário</h2>
      </div>

      <div className="p-6 border-b border-border">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{user?.name || 'Usuário'}</p>
          <p className="text-xs text-muted-foreground">{user?.role || 'Cargo'}</p>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems
            .filter(item => user && item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.url;

              return (
                <li key={item.title}>
                  <RouterNavLink
                    to={item.url}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </RouterNavLink>
                </li>
              );
            })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          onClick={logout}
          variant="ghost"
          className="flex items-center justify-start gap-3 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair</span>
        </Button>
      </div>
    </aside>
  );
}
