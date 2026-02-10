import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/auth.context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AddItemForm } from "@/components/forms/AddItemForm";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { LoaderCircle, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api"; // <--- IMPORTANTE

interface Supplier {
    id: string;
    name: string;
}

interface Item {
    id: string;
    name: string;
    internalCode?: string;
}

interface EntryItem {
    itemId: string;
    quantity: number;
    unitPrice: number;
}

const StockEntryPage = () => {
    const { token, user } = useAuth(); // Mantemos token apenas para passar pro AddItemForm se necessário
    const navigate = useNavigate();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [supplierId, setSupplierId] = useState<string>("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [issueDate, setIssueDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    // Items Grid State
    const [entryItems, setEntryItems] = useState<EntryItem[]>([]);

    // Current Item to Add
    const [currentItemId, setCurrentItemId] = useState("");
    const [currentQty, setCurrentQty] = useState<string | number>("");
    const [currentPrice, setCurrentPrice] = useState<string | number>("");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Substituído fetch por api
            const [suppliersRes, itemsRes] = await Promise.all([
                api("/suppliers"),
                api("/items"),
            ]);

            if (suppliersRes.ok && itemsRes.ok) {
                setSuppliers(await suppliersRes.json());
                setItems(await itemsRes.json());
            } else {
                toast.error("Falha ao carregar dados da empresa.");
            }
        } catch {
            toast.error("Erro ao carregar dados.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Sem dependência de token, pois a api gerencia

    const handleNewItemAdded = (newItem?: any) => {
        setIsAddModalOpen(false);
        if (newItem) {
            setItems((prev) => [...prev, newItem]);
            setCurrentItemId(newItem.id);
            toast.success("Item adicionado ao estoque central e selecionado.");
        } else {
            fetchData();
        }
    };

    const handleAddItem = () => {
        if (!currentItemId) {
            toast.error("Selecione um produto.");
            return;
        }

        const qty = Number(currentQty);
        const price = Number(currentPrice);

        if (!qty || qty <= 0) {
            toast.error("Quantidade deve ser maior que zero.");
            return;
        }
        if (price < 0) {
            toast.error("Preço não pode ser negativo.");
            return;
        }

        setEntryItems([
            ...entryItems,
            {
                itemId: currentItemId,
                quantity: qty,
                unitPrice: price,
            },
        ]);

        // Reset current item inputs
        setCurrentItemId("");
        setCurrentQty("");
        setCurrentPrice("");
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...entryItems];
        newItems.splice(index, 1);
        setEntryItems(newItems);
    };

    const handleSubmit = async () => {
        if (entryItems.length === 0) {
            toast.error("Adicione pelo menos um item à entrada.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Substituído fetch por api
            const response = await api("/stock-entries", {
                method: "POST",
                body: JSON.stringify({
                    supplierId: supplierId === "none" ? null : supplierId,
                    invoiceNumber,
                    issueDate,
                    items: entryItems,
                }),
            });

            if (response.ok) {
                toast.success("Entrada de estoque registrada com sucesso!");
                navigate("/stock-history");
            } else {
                const data = await response.json();
                toast.error(data.message || "Erro ao registrar entrada.");
            }
        } catch {
            toast.error("Erro de conexão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background items-center justify-center">
                <LoaderCircle className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    const getItemName = (id: string) => items.find((i) => i.id === id)?.name || id;

    return (
        <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background">
            <AppSidebar />
            <main className="flex-1 p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <header>
                        <h1 className="text-3xl font-bold text-white">Nova Entrada de Estoque</h1>
                        <p className="text-sm text-white/60 mt-1">
                            Registre a entrada de mercadorias confirmando a Nota Fiscal
                        </p>
                    </header>

                    <div className="bg-brand-blue/40 backdrop-blur-md rounded-xl p-6 border border-brand-blue/30 space-y-6">
                        {/* Cabeçalho da Nota */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="supplier" className="text-white">Fornecedor</Label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger className="bg-white/5 border-brand-blue/30 text-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sem Fornecedor</SelectItem>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="invoice" className="text-white">Número da Nota (Opcional)</Label>
                                <Input
                                    id="invoice"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="bg-white/5 border-brand-blue/30 text-white"
                                    placeholder="Ex: 123456"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-white">Data de Emissão</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="bg-white/5 border-brand-blue/30 text-white"
                                />
                            </div>
                        </div>

                        <div className="border-t border-brand-blue/30 my-4" />

                        {/* Adicionar Item */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Adicionar Produtos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-5 space-y-2">
                                    <Label className="text-white">Produto</Label>
                                    <div className="flex gap-2">
                                        <Select value={currentItemId} onValueChange={setCurrentItemId}>
                                            <SelectTrigger className="flex-1 bg-white/5 border-brand-blue/30 text-white">
                                                <SelectValue placeholder="Selecione o produto..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {items.map((i) => (
                                                    <SelectItem key={i.id} value={i.id}>
                                                        {i.internalCode ? `[${i.internalCode}] ` : ''}{i.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {user?.role === 'DIRETOR' && (
                                            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="h-10 w-10 p-0">
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-background border-brand-blue/30">
                                                    <DialogHeader>
                                                        <DialogTitle>Novo Produto</DialogTitle>
                                                    </DialogHeader>
                                                    <AddItemForm token={token} onItemAdded={handleNewItemAdded} onCancel={() => setIsAddModalOpen(false)} />
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-white">Qtd</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={currentQty}
                                        onChange={(e) => setCurrentQty(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        placeholder="Qtd"
                                        className="bg-white/5 border-brand-blue/30 text-white"
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label className="text-white">Valor Unit. (R$)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={currentPrice}
                                        onChange={(e) => setCurrentPrice(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        placeholder="0,00"
                                        className="bg-white/5 border-brand-blue/30 text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Button onClick={handleAddItem} className="w-full bg-brand-cyan hover:bg-brand-cyan/80 text-brand-dark-blue font-bold">
                                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Itens */}
                        <div className="rounded-lg border border-brand-blue/30 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-brand-blue/60 hover:bg-brand-blue/60">
                                        <TableHead className="text-white">Produto</TableHead>
                                        <TableHead className="text-white text-right">Qtd</TableHead>
                                        <TableHead className="text-white text-right">Valor Unit.</TableHead>
                                        <TableHead className="text-white text-right">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entryItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-white/50 h-20">Nenhum item adicionado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        entryItems.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-white/5 border-brand-blue/20">
                                                <TableCell className="text-white font-medium">{getItemName(item.itemId)}</TableCell>
                                                <TableCell className="text-white text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-white text-right">
                                                    {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                                <TableCell className="text-white text-right">
                                                    {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                size="lg"
                                onClick={handleSubmit}
                                disabled={isSubmitting || entryItems.length === 0}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isSubmitting ? (
                                    <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                Confirmar Entrada
                            </Button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default StockEntryPage;