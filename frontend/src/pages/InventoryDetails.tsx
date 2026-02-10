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
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { FileDown, FileSpreadsheet, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api"; // <--- IMPORTANTE

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
  const { user, token } = useAuth(); // token mantido apenas para passar pro form se necessário

  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchInventoryData = async () => {
    if (!unitId) return;
    setIsLoading(true);
    try {
      // Substituído fetch por api
      const response = await api(`/units/${unitId}`);
      
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
  }, [unitId]); // Removemos dependência de token

  const handleRequestSuccess = () => {
    setIsRequestModalOpen(false);
    toast.success("Solicitação criada com sucesso!");
    fetchInventoryData(); // Recarrega os dados após sucesso
  };

  if (isLoading) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background"><LoaderCircle className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!unit) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background"><p>Unidade não encontrada.</p></div>;
  }

  const canMakeRequest = user?.role === 'COORDENADOR';
  const isDirector = user?.role === 'DIRETOR';

  const handleExportExcel = () => {
    if (!unit || unit.inventoryItems.length === 0) {
      toast.error("Nenhum item para exportar.");
      return;
    }
    const columns = [
      { header: "Item", key: "item.name" },
      { header: "Qtd", key: "quantity" },
      { header: "Atualizado em", key: "item.updatedAt" },
    ];
    const dataToExport = unit.inventoryItems.map(inv => ({
      ...inv,
      "item.name": inv.item.name,
      "item.updatedAt": new Date(inv.item.updatedAt).toLocaleString('pt-BR')
    }));
    exportToExcel(dataToExport, columns, `Inventario_${unit.name}`);
    toast.success("Download do Excel iniciado.");
  };

  const handleExportPDF = () => {
    if (!unit || unit.inventoryItems.length === 0) {
      toast.error("Nenhum item para exportar.");
      return;
    }
    const columns = [
      { header: "Item", key: "item.name" },
      { header: "Qtd", key: "quantity" },
      { header: "Atualizado em", key: "item.updatedAt" },
    ];
    const dataToExport = unit.inventoryItems.map(inv => ({
      ...inv,
      "item.name": inv.item.name,
      "item.updatedAt": new Date(inv.item.updatedAt).toLocaleString('pt-BR')
    }));
    exportToPDF(dataToExport, columns, `Inventário: ${unit.name}`, `Inventario_${unit.name}`);
    toast.success("Download do PDF iniciado.");
  };

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
                    token={token} // Mantemos prop se o form precisar, mas ele deve ser atualizado
                    onSuccess={handleRequestSuccess}
                    onCancel={() => setIsRequestModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}

            {isDirector && (
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer text-green-600 focus:text-green-700">
                      <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar para Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer text-red-600 focus:text-red-700">
                      <FileDown className="w-4 h-4 mr-2" /> Exportar para PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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