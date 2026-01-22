import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

interface Instructor {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  coordinator?: {
    id: string;
    name: string;
  } | null;
  instructors: Instructor[];
}

const MyUnits = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchUnits = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/units", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: Unit[] = await response.json();
          setUnits(data);
        } else {
          if (response.status === 401) {
            toast.error("Sua sessão expirou. Faça login novamente.");
            logout();
            navigate("/");
          } else {
            toast.error("Falha ao buscar as unidades.");
          }
        }
      } catch {
        toast.error("Erro de conexão com o servidor.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnits();
  }, [token, logout, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-brand-blue/30 via-background to-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background">
      <AppSidebar />

      <main className="flex-1 p-10">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-white">Minhas Unidades</h1>
            <p className="text-sm text-white/60 mt-1">Gerencie as unidades sob sua responsabilidade</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.length > 0 ? (
              units.map((unit) => {
                const instructorName =
                  unit.instructors.length > 0
                    ? unit.instructors[0].name
                    : "Sem instrutor responsável";

                return (
                  <Card
                    key={unit.id}
                    className="
                      bg-brand-blue/50
                      border border-brand-blue/30
                      backdrop-blur-md
                      shadow-lg
                      hover:shadow-xl
                      transition-all duration-300
                    "
                  >
                    <CardHeader>
                      <CardTitle className="text-white font-semibold">{unit.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="text-sm text-white/70 space-y-1">
                        <p>
                          <span className="text-white/50">Coordenador:</span>{' '}
                          {unit.coordinator?.name || 'Sem coordenação'}
                        </p>
                        <p>
                          <span className="text-white/50">Instrutor responsável:</span>{' '}
                          {instructorName}
                        </p>
                      </div>

                      <Button
                        onClick={() => navigate(`/inventory/${unit.id}`)}
                        className="
                          w-full
                          bg-brand-blue-soft
                          text-white
                          hover:bg-brand-blue
                          transition-colors
                        "
                      >
                        Gerenciar Inventário
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="text-white/60 col-span-3 text-center">Nenhuma unidade encontrada.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyUnits;
