import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Nova interface para representar a Empresa vinda do login
export interface Company {
  id: string;
  name: string;
  cnpj?: string;
}

// Atualizamos o User para incluir a lista de empresas permitidas
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companies: Company[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  
  // --- NOVOS CAMPOS PARA MULTI-TENANCY ---
  selectedCompanyId: string | null; // Qual empresa está ativa agora
  selectCompany: (companyId: string) => void; // Função para trocar de empresa
  // ---------------------------------------

  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Estado para armazenar o ID da empresa selecionada
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      const storedCompanyId = localStorage.getItem('selectedCompanyId');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Tenta restaurar a empresa selecionada se ela ainda for válida para o usuário
        if (storedCompanyId) {
            const hasAccess = parsedUser.companies?.some((c: Company) => c.id === storedCompanyId);
            if (hasAccess) {
                setSelectedCompanyId(storedCompanyId);
            }
        }
      }
    } catch (error) {
      console.error("Falha ao carregar dados de autenticação:", error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('selectedCompanyId');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('authUser', JSON.stringify(userData));

    // --- LÓGICA DE SELEÇÃO AUTOMÁTICA ---
    if (userData.companies && userData.companies.length === 1) {
        // Se o usuário só tem 1 empresa (ex: Coordenador), seleciona ela direto
        const uniqueCompanyId = userData.companies[0].id;
        setSelectedCompanyId(uniqueCompanyId);
        localStorage.setItem('selectedCompanyId', uniqueCompanyId);
    } else {
        // Se tem várias (Diretor) ou nenhuma, deixa nulo para forçar a tela de seleção
        setSelectedCompanyId(null);
        localStorage.removeItem('selectedCompanyId');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSelectedCompanyId(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('selectedCompanyId');
  };

  // Função para o usuário trocar de empresa manualmente
  const selectCompany = (companyId: string) => {
      setSelectedCompanyId(companyId);
      localStorage.setItem('selectedCompanyId', companyId);
  };

  const value = {
    user,
    token,
    isLoading,
    selectedCompanyId,
    selectCompany,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};