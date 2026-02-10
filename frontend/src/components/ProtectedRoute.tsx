import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth.context';
import { LoaderCircle } from 'lucide-react';

const ProtectedRoute = () => {
  // Pega o estado de autenticação, carregamento e a empresa selecionada
  const { isAuthenticated, isLoading, selectedCompanyId } = useAuth();
  const location = useLocation();

  // 1. Loading inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoaderCircle className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Se não estiver logado -> Login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 3. --- NOVA LÓGICA DE MULTI-TENANCY ---
  // Se o usuário está logado, mas NÃO tem empresa selecionada (Diretor recém logado),
  // e ele NÃO está na página de seleção... Força o redirecionamento para a seleção.
  if (!selectedCompanyId && location.pathname !== "/select-company") {
    return <Navigate to="/select-company" replace />;
  }

  // 4. Tudo certo (Logado e com empresa definida), libera o acesso
  return <Outlet />;
};

export default ProtectedRoute;