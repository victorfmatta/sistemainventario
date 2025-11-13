import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LoaderCircle, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { toast } from 'sonner';
import { AddItemForm } from '@/components/forms/AddItemForm';
import { EditItemForm } from '@/components/forms/EditItemForm';

// Tipo para um item do Estoque Central
interface CentralStockItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  updatedAt: string;
}

const CentralStockPage = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<CentralStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para controlar os modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CentralStockItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CentralStockItem | null>(null);

  // Função para buscar os dados do Estoque Central
  const fetchCentralStock = async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/items', {
        headers: { 'Authorization': `Bearer ${token}` },
      } );
      if (response.ok) {
        setItems(await response.json());
      } else {
        toast.error("Falha ao buscar dados do estoque central.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentralStock();
  }, [token]);

  // Handlers para CRUD
  const handleItemAdded = () => {
    setIsAddModalOpen(false);
    toast.success("Item adicionado ao estoque central!");
    fetchCentralStock(false);
  };

  const handleItemUpdated = () => {
    setEditingItem(null);
    toast.success("Item do estoque central atualizado!");
    fetchCentralStock(false);
  };

  const handleDeleteItem = async () => {
    if (!deletingItem || !token) return;
    try {
      const response = await fetch(`http://localhost:3001/api/items/${deletingItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      } );
      if (response.ok) {
        toast.success(`Item "${deletingItem.name}" excluído com sucesso!`);
        fetchCentralStock(false);
      } else {
        const data = await response.json();
        toast.error(data.message || "Falha ao excluir o item.");
      }
    } catch (error) {
      toast.error("Erro de conexão ao tentar excluir o item.");
    } finally {
      setDeletingItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento do Estoque Central</h1>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild><Button>+ Adicionar Novo Item ao Estoque</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Novo Item ao Estoque Central</DialogTitle></DialogHeader>
                <AddItemForm token={token} onItemAdded={handleItemAdded} onCancel={() => setIsAddModalOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <section className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="text-secondary-foreground">Nome do Item</TableHead>
                    <TableHead className="text-secondary-foreground">Quantidade em Estoque</TableHead>
                    <TableHead className="text-secondary-foreground">Última Atualização</TableHead>
                    <TableHead className="text-secondary-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                        <TableCell className="text-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-foreground">{new Date(item.updatedAt).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}><Pencil className="w-4 h-4 text-foreground" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingItem(item)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">Nenhum item no estoque central.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </main>

      {/* Modais de Edição e Exclusão */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Item: {editingItem.name}</DialogTitle></DialogHeader>
            <EditItemForm item={editingItem} token={token} onItemUpdated={handleItemUpdated} onCancel={() => setEditingItem(null)} />
          </DialogContent>
        </Dialog>
      )}
      <AlertDialog open={!!deletingItem} onOpenChange={(isOpen) => !isOpen && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o item <strong>{deletingItem?.name}</strong>.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CentralStockPage;
