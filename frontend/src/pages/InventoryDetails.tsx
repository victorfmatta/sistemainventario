import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { toast } from 'sonner';
import { AddRequestForm } from '@/components/forms/AddRequestForm';

interface InventoryItem {
  id: string;
  quantity: number;
  item: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
  };
}

interface Unit {
  id: string;
  name: string;
  inventoryItems: InventoryItem[];
}

const InventoryDetails = () => {
  const { id: unitId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchInventoryData = async () => {
    if (!token || !unitId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/units/${unitId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      } );
      if (response.ok) {
        setUnit(await response.json());
      } else {
        toast.error("Falha ao buscar dados da unidade.");
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [unitId, token]);

  const handleRequestSuccess = () => {
    setIsRequestModalOpen(false);
    toast.success("Solicitação criada com sucesso!");
  };

  if (isLoading) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background"><LoaderCircle className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!unit) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background"><p>Unidade não encontrada.</p></div>;
  }

  // --- INÍCIO DA ALTERAÇÃO ---
  // Apenas o COORDENADOR pode fazer solicitações.
  const canMakeRequest = user?.role === 'COORDENADOR';
  // --- FIM DA ALTERAÇÃO ---

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Inventário Local: {unit.name}</h1>
            
            {canMakeRequest && (
              <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogTrigger asChild>
                  <Button>Fazer Nova Solicitação</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Fazer Nova Solicitação para {unit.name}</DialogTitle></DialogHeader>
                  <AddRequestForm
                    unitId={unit.id}
                    token={token}
                    onSuccess={handleRequestSuccess}
                    onCancel={() => setIsRequestModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Itens no Inventário da Unidade</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="text-secondary-foreground">Nome do Item</TableHead>
                    <TableHead className="text-secondary-foreground">Quantidade na Unidade</TableHead>
                    <TableHead className="text-secondary-foreground">Última Atualização (Item Mestre)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unit.inventoryItems.length > 0 ? (
                    unit.inventoryItems.map((inventoryItem) => (
                      <TableRow key={inventoryItem.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{inventoryItem.item.name}</TableCell>
                        <TableCell className="text-foreground">{inventoryItem.quantity}</TableCell>
                        <TableCell className="text-foreground">
                          {new Date(inventoryItem.item.updatedAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-24">Nenhum item no inventário desta unidade.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default InventoryDetails;
