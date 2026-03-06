import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, LoaderCircle, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { toast } from 'sonner';
import { AddRequestForm } from '@/components/forms/AddRequestForm';
import { AddUnitItemForm } from '@/components/forms/AddUnitItemForm';
import { EditUnitItemForm } from '@/components/forms/EditUnitItemForm';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { FileDown, FileSpreadsheet, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    internalCode: string | null;
    unitOfMeasure: string | null;
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
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

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
    fetchInventoryData();
  };

  const handleAddItemSuccess = () => {
    setIsAddItemModalOpen(false);
    toast.success("Item adicionado ao inventário com sucesso!");
    fetchInventoryData();
  };

  const handleEditSuccess = () => {
    setEditingItem(null);
    toast.success("Quantidade atualizada com sucesso!");
    fetchInventoryData();
  };

  const handleDeleteItem = async () => {
    if (!deletingItem || !unitId) return;
    try {
      const response = await api(`/units/${unitId}/items/${deletingItem.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success(`Item "${deletingItem.item.name}" removido do inventário.`);
        fetchInventoryData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Falha ao remover o item.');
      }
    } catch {
      toast.error('Erro de conexão ao tentar remover o item.');
    } finally {
      setDeletingItem(null);
    }
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
                <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
                  <DialogTrigger asChild>
                    <Button>Adicionar Item</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Item ao Inventário de {unit.name}</DialogTitle></DialogHeader>
                    <AddUnitItemForm
                      unitId={unit.id}
                      onItemAdded={handleAddItemSuccess}
                      onCancel={() => setIsAddItemModalOpen(false)}
                    />
                  </DialogContent>
                </Dialog>

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
                    {isDirector && <TableHead className="text-secondary-foreground text-right">Ações</TableHead>}
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
                        {isDirector && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setViewingItem(inventoryItem)} title="Ver detalhes">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setEditingItem(inventoryItem)} title="Editar quantidade">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeletingItem(inventoryItem)} title="Remover item">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={isDirector ? 4 : 3} className="text-center text-muted-foreground h-24">Nenhum item no inventário desta unidade.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </main>

      {/* VISUALIZAR DETALHES */}
      {viewingItem && (
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Detalhes: {viewingItem.item.name}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div><strong>Nome:</strong> {viewingItem.item.name}</div>
              <div><strong>Quantidade na Unidade:</strong> {viewingItem.quantity}</div>
              {viewingItem.item.internalCode && <div><strong>Código Interno/SKU:</strong> {viewingItem.item.internalCode}</div>}
              {viewingItem.item.unitOfMeasure && <div><strong>Unidade de Medida:</strong> {viewingItem.item.unitOfMeasure}</div>}
              {viewingItem.item.description && <div><strong>Descrição:</strong> {viewingItem.item.description}</div>}
              <div><strong>Última Atualização:</strong> {new Date(viewingItem.item.updatedAt).toLocaleString('pt-BR')}</div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* EDITAR QUANTIDADE */}
      {editingItem && unitId && (
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Item</DialogTitle></DialogHeader>
            <EditUnitItemForm
              unitId={unitId}
              unitItemId={editingItem.id}
              itemName={editingItem.item.name}
              currentQuantity={editingItem.quantity}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* CONFIRMAR EXCLUSÃO */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item <strong>{deletingItem?.item.name}</strong> será removido do inventário desta unidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700 text-white">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryDetails;