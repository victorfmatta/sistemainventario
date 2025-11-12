import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth.context"; // 1. Importar o hook de autenticação
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

// 2. Definir um tipo para os dados da unidade que virão da API
interface Unit {
  id: string;
  name: string;
  // Por enquanto, não temos itemCount e pendingRequests vindos da API, então vamos omiti-los
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth(); // 3. Pegar o token e a função de logout do contexto

  // 4. Criar estados para as unidades e para o carregamento da página
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 5. O useEffect agora buscará as unidades
  useEffect(() => {
    // Se não houver token, não faz sentido fazer a requisição
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchUnits = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/units', {
          method: 'GET',
          headers: {
            // 6. Enviar o token de autorização no cabeçalho
            'Authorization': `Bearer ${token}`,
          },
        } );

        if (response.ok) {
          const data: Unit[] = await response.json();
          setUnits(data); // Armazena as unidades no estado
        } else {
          // Se o token for inválido/expirado, a API retornará 401
          if (response.status === 401) {
            toast.error("Sua sessão expirou. Por favor, faça login novamente.");
            logout(); // Limpa a sessão do frontend
            navigate('/'); // Redireciona para o login
          } else {
            toast.error("Falha ao buscar as unidades.");
          }
        }
      } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        toast.error("Não foi possível conectar ao servidor.");
      } finally {
        setIsLoading(false); // Finaliza o carregamento
      }
    };

    fetchUnits();
  }, [token, navigate, logout]); // Dependências do useEffect

  // 7. Mostrar uma tela de carregamento enquanto os dados são buscados
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground">Minhas Unidades</h1>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              + Adicionar Nova Unidade
            </Button>
          </div>

          {/* 8. Mapear a lista de unidades do estado, em vez dos mockUnits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.length > 0 ? (
              units.map((unit) => (
                <Card key={unit.id} className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">{unit.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Temporariamente removemos os contadores, pois não vêm da API ainda */}
                    <p className="text-sm text-muted-foreground">
                      Clique para ver os detalhes da unidade.
                    </p>
                    <Button
                      onClick={() => navigate(`/inventory/${unit.id}`)}
                      variant="secondary"
                      className="w-full"
                    >
                      Gerenciar Inventário
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground col-span-3 text-center">Nenhuma unidade encontrada.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
