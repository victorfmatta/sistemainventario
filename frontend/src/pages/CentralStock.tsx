import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LoaderCircle, Pencil, Trash2, FileDown, FileSpreadsheet, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "sonner";
import { AddItemForm } from "@/components/forms/AddItemForm";
import { EditItemForm } from "@/components/forms/EditItemForm";
import { exportToExcel, exportToPDF } from "@/utils/exportUtils";

interface CentralStockItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  updatedAt: string;
}

const CentralStockPage = () => {
  const { token, user } = useAuth();

  const [items, setItems] = useState<CentralStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<CentralStockItem | null>(null);
  const [deletingItem, setDeletingItem] =
    useState<CentralStockItem | null>(null);

  const fetchCentralStock = async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3001/api/items",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        setItems(await response.json());
      } else {
        toast.error("Falha ao buscar dados do estoque central.");
      }
    } catch {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentralStock();
  }, [token]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        (item.description &&
          item.description.toLowerCase().includes(query))
      );
    });
  }, [items, search]);

  const handleItemAdded = () => {
    setIsAddModalOpen(false);
    toast.success("Item adicionado ao estoque central!");
    fetchCentralStock(false);
  };

  const handleItemUpdated = () => {
    setEditingItem(null);
    toast.success("Item atualizado!");
    fetchCentralStock(false);
  };

  const handleDeleteItem = async () => {
    if (!deletingItem || !token) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/items/${deletingItem.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        toast.success(
          `Item "${deletingItem.name}" excluído com sucesso!`
        );
        fetchCentralStock(false);
      } else {
        const data = await response.json();
        toast.error(data.message || "Falha ao excluir o item.");
      }
    } catch {
      toast.error("Erro de conexão ao tentar excluir o item.");
    } finally {
      setDeletingItem(null);
    }
  };

  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      toast.error("Nenhum item para exportar.");
      return;
    }
    const columns = [
      { header: "Nome", key: "name" },
      { header: "Descrição", key: "description" },
      { header: "Quantidade", key: "quantity" },
      { header: "Atualizado em", key: "updatedAt" },
    ];
    // Format dates for export
    const dataToExport = filteredItems.map(item => ({
      ...item,
      updatedAt: new Date(item.updatedAt).toLocaleString('pt-BR')
    }));
    exportToExcel(dataToExport, columns, "Estoque_Central");
    toast.success("Download do Excel iniciado.");
  };

  const handleExportPDF = () => {
    if (filteredItems.length === 0) {
      toast.error("Nenhum item para exportar.");
      return;
    }
    const columns = [
      { header: "Nome", key: "name" },
      { header: "Descrição", key: "description" },
      { header: "Qtd", key: "quantity" },
      { header: "Atualizado em", key: "updatedAt" },
    ];
    // Format dates for export
    const dataToExport = filteredItems.map(item => ({
      ...item,
      updatedAt: new Date(item.updatedAt).toLocaleString('pt-BR')
    }));
    exportToPDF(dataToExport, columns, "Relatório de Estoque Central", "Estoque_Central");
    toast.success("Download do PDF iniciado.");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background">
      <AppSidebar />

      <main className="flex-1 p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Estoque Central
              </h1>
              <p className="text-sm text-white/60 mt-1">
                Gerencie os itens disponíveis no estoque geral
              </p>
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
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

              {user?.role === 'DIRETOR' && (
                <Dialog
                  open={isAddModalOpen}
                  onOpenChange={setIsAddModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-brand-blue-soft hover:bg-brand-blue text-white">
                      + Adicionar Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Adicionar Novo Item ao Estoque Central
                      </DialogTitle>
                    </DialogHeader>
                    <AddItemForm
                      token={token}
                      onItemAdded={handleItemAdded}
                      onCancel={() => setIsAddModalOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </header>

          {/* BUSCA */}
          <Input
            placeholder="Buscar item por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />

          <section className="rounded-xl border border-brand-blue/30 bg-brand-blue/40 backdrop-blur-md overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-brand-blue/60">
                  <TableHead className="text-white">
                    Nome do Item
                  </TableHead>
                  <TableHead className="text-white">
                    Quantidade
                  </TableHead>
                  <TableHead className="text-white">
                    Última Atualização
                  </TableHead>
                  <TableHead className="text-white text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-brand-blue/20 hover:bg-white/5"
                    >
                      <TableCell className="font-medium text-white">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-white">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-white">
                        {new Date(
                          item.updatedAt
                        ).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingItem(item)}
                            className="hover:bg-white/10"
                          >
                            <Pencil className="w-4 h-4 text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingItem(item)}
                            className="hover:bg-white/10"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-white/60 h-24"
                    >
                      Nenhum item encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
        </div>
      </main >

      {/* EDITAR */}
      {
        editingItem && (
          <Dialog
            open={!!editingItem}
            onOpenChange={(open) =>
              !open && setEditingItem(null)
            }
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Editar Item: {editingItem.name}
                </DialogTitle>
              </DialogHeader>
              <EditItemForm
                item={editingItem}
                token={token}
                onItemUpdated={handleItemUpdated}
                onCancel={() => setEditingItem(null)}
              />
            </DialogContent>
          </Dialog>
        )
      }

      {/* EXCLUIR */}
      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(open) =>
          !open && setDeletingItem(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Você tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item{" "}
              <strong>{deletingItem?.name}</strong> será
              removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};

export default CentralStockPage;
