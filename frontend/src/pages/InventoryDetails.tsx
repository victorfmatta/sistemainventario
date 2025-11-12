import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoaderCircle, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { toast } from 'sonner';
import { AddItemForm } from '@/components/forms/AddItemForm'; // 1. Importar nosso formulário

// --- Definição de Tipos ---
interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  updatedAt: string;
}

interface Unit {
  id: string;
  name: string;
  items: Item[];
}

const InventoryDetails = () => {
  const { id: unitId } = useParams(); // Pega o ID da unidade da URL
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // 2. Estado para controlar o modal

  // 3. Função para buscar os dados da unidade e seus itens
  const fetchInventoryData = async () => {
    if (!token || !unitId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/units/${unitId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      } );

      if (response.ok) {
        const data = await response.json();
        setUnit(data);
      } else {
        if (response.status === 401) {
          toast.error("Sessão expirada.");
          logout();
          navigate('/');
        } else {
          toast.error("Unidade não encontrada ou falha ao buscar dados.");
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. useEffect para buscar os dados quando o componente carregar
  useEffect(() => {
    fetchInventoryData();
  }, [unitId, token]);

  // 5. Função que será chamada quando um item for adicionado com sucesso
  const handleItemAdded = () => {
    setIsModalOpen(false); // Fecha o modal
    toast.success("Item adicionado com sucesso!");
    fetchInventoryData(); // Recarrega os dados para mostrar o novo item
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <p>Unidade não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Inventário: {unit.name}</h1>
            
            {/* 6. Botão que abre o Dialog (modal) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>+ Adicionar Novo Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Item à {unit.name}</DialogTitle>
                </DialogHeader>
                {/* 7. Renderiza nosso formulário dentro do modal */}
                <AddItemForm
                  unitId={unit.id}
                  token={token}
                  onItemAdded={handleItemAdded}
                  onCancel={() => setIsModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Itens em Estoque</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="text-secondary-foreground">Nome do Item</TableHead>
                    <TableHead className="text-secondary-foreground">Quantidade</TableHead>
                    <TableHead className="text-secondary-foreground">Última Atualização</TableHead>
                    <TableHead className="text-secondary-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unit.items.length > 0 ? (
                    unit.items.map((item) => (
                      <TableRow key={item.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                        <TableCell className="text-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-foreground">
                          {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                              <Pencil className="w-4 h-4 text-foreground" />
                            </button>
                            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum item encontrado nesta unidade.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* A seção de histórico de solicitações foi removida por enquanto, pois não temos os dados */}
        </div>
      </main>
    </div>
  );
};

export default InventoryDetails;
