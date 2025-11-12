import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth.context';
import { LoaderCircle } from 'lucide-react';

const ProtectedRoute = () => {
  // 1. Pega o estado de autenticação E o estado de carregamento
  const { isAuthenticated, isLoading } = useAuth();

  // 2. Se o contexto ainda está verificando a sessão, mostra uma tela de loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoaderCircle className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // 3. Se o carregamento terminou E o usuário não está autenticado, redireciona
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 4. Se o carregamento terminou E o usuário está autenticado, mostra a página
  return <Outlet />;
};

export default ProtectedRoute;
