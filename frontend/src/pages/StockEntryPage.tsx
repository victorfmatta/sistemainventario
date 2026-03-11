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
import { LoaderCircle, Plus, Trash2, Save, MinusCircle, History, Pencil, X } from "lucide-react";
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
    quantity?: number;
}

interface UnitOption {
    id: string;
    name: string;
}

interface UnitItemInfo {
    id: string;
    quantity: number;
    item: Item;
}

interface EntryItem {
    itemId: string;
    quantity: number;
    unitPrice: number;
}

interface ExitItem {
    itemId: string;
    quantity: number;
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

    // ========== SAÍDA DE ESTOQUE ==========
    const [units, setUnits] = useState<UnitOption[]>([]);
    const [exitReason, setExitReason] = useState("");
    const [exitDescription, setExitDescription] = useState("");
    const [exitTarget, setExitTarget] = useState<string>("CENTRAL");
    const [exitUnitId, setExitUnitId] = useState("");
    const [exitItems, setExitItems] = useState<ExitItem[]>([]);
    const [exitCurrentItemId, setExitCurrentItemId] = useState("");
    const [exitCurrentQty, setExitCurrentQty] = useState<string | number>("");
    const [isSubmittingExit, setIsSubmittingExit] = useState(false);
    const [unitInventory, setUnitInventory] = useState<UnitItemInfo[]>([]);

    // ========== HISTORY ==========
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [exitHistory, setExitHistory] = useState<any[]>([]);
    const [deletingExitId, setDeletingExitId] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Substituído fetch por api
            const [suppliersRes, itemsRes, unitsRes] = await Promise.all([
                api("/suppliers"),
                api("/items?all=true"),
                api("/units"),
            ]);

            if (suppliersRes.ok && itemsRes.ok) {
                setSuppliers(await suppliersRes.json());
                setItems(await itemsRes.json());
            } else {
                toast.error("Falha ao carregar dados da empresa.");
            }

            if (unitsRes.ok) {
                setUnits(await unitsRes.json());
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

    // ========== FUNÇÕES DA SAÍDA DE ESTOQUE ==========

    const fetchUnitInventory = async (unitId: string) => {
        try {
            const res = await api(`/units/${unitId}`);
            if (res.ok) {
                const unitData = await res.json();
                setUnitInventory(unitData.inventoryItems || []);
            }
        } catch {
            toast.error("Erro ao carregar inventário da unidade.");
        }
    };

    const handleExitTargetChange = (value: string) => {
        setExitTarget(value);
        setExitUnitId("");
        setExitItems([]);
        setExitCurrentItemId("");
        setExitCurrentQty("");
        setUnitInventory([]);
    };

    const handleExitUnitChange = (value: string) => {
        setExitUnitId(value);
        setExitItems([]);
        setExitCurrentItemId("");
        setExitCurrentQty("");
        fetchUnitInventory(value);
    };

    const getExitItemName = (id: string) => {
        if (exitTarget === 'UNIT') {
            const ui = unitInventory.find((u) => u.item.id === id);
            return ui?.item.name || id;
        }
        return items.find((i) => i.id === id)?.name || id;
    };

    const getExitAvailableItems = () => {
        if (exitTarget === 'UNIT') {
            return unitInventory
                .filter((ui) => ui.quantity > 0)
                .map((ui) => ({ id: ui.item.id, name: ui.item.name, internalCode: ui.item.internalCode, quantity: ui.quantity }));
        }
        return items.filter((i) => (i.quantity ?? 0) > 0);
    };

    const handleAddExitItem = () => {
        if (!exitCurrentItemId) {
            toast.error("Selecione um produto.");
            return;
        }
        const qty = Number(exitCurrentQty);
        if (!qty || qty <= 0) {
            toast.error("Quantidade deve ser maior que zero.");
            return;
        }

        // Verificar estoque disponível
        const availableItems = getExitAvailableItems();
        const selectedItem = availableItems.find((i) => i.id === exitCurrentItemId);
        const alreadyAdded = exitItems
            .filter((ei) => ei.itemId === exitCurrentItemId)
            .reduce((sum, ei) => sum + ei.quantity, 0);

        if (selectedItem && (selectedItem.quantity ?? 0) < qty + alreadyAdded) {
            toast.error(`Estoque insuficiente. Disponível: ${(selectedItem.quantity ?? 0) - alreadyAdded}`);
            return;
        }

        setExitItems([...exitItems, { itemId: exitCurrentItemId, quantity: qty }]);
        setExitCurrentItemId("");
        setExitCurrentQty("");
    };

    const handleRemoveExitItem = (index: number) => {
        const newItems = [...exitItems];
        newItems.splice(index, 1);
        setExitItems(newItems);
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api("/stock-exits");
            if (res.ok) {
                setExitHistory(await res.json());
            } else {
                toast.error("Erro ao carregar histórico.");
            }
        } catch {
            toast.error("Erro ao carregar histórico.");
        } finally {
            setHistoryLoading(false);
        }
    };

    const confirmDeleteExit = async (restoreInventory: boolean) => {
        if (!deletingExitId) return;
        
        try {
            const res = await api(`/stock-exits/${deletingExitId}?restore=${restoreInventory}`, { method: "DELETE" });
            if (res.ok) {
                const data = await res.json();
                toast.success(data.message);
                fetchHistory(); // Atualiza a lista
                fetchData(); // Atualiza os estoques na tela principal
            } else {
                const data = await res.json();
                toast.error(data.message || "Erro ao excluir.");
            }
        } catch {
            toast.error("Erro ao excluir.");
        } finally {
            setDeletingExitId(null);
        }
    };

    const handleSubmitExit = async () => {
        if (exitItems.length === 0) {
            toast.error("Adicione pelo menos um item à saída.");
            return;
        }
        if (!exitReason) {
            toast.error("Selecione o motivo da saída.");
            return;
        }
        if (exitTarget === 'UNIT' && !exitUnitId) {
            toast.error("Selecione a unidade.");
            return;
        }

        setIsSubmittingExit(true);

        try {
            const response = await api("/stock-exits", {
                method: "POST",
                body: JSON.stringify({
                    reason: exitReason,
                    description: exitDescription || null,
                    target: exitTarget,
                    unitId: exitTarget === 'UNIT' ? exitUnitId : null,
                    items: exitItems,
                }),
            });

            if (response.ok) {
                toast.success("Saída registrada com sucesso!");
                // Reset form
                setExitReason("");
                setExitDescription("");
                setExitTarget("CENTRAL");
                setExitUnitId("");
                setExitItems([]);
                setUnitInventory([]);
                // Recarregar dados para atualizar quantidades
                fetchData();
            } else {
                const data = await response.json();
                toast.error(data.message || "Erro ao registrar saída.");
            }
        } catch {
            toast.error("Erro de conexão.");
        } finally {
            setIsSubmittingExit(false);
        }
    };

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

                    {/* ========== SAÍDA DE ESTOQUE ========== */}
                    <header className="pt-4">
                        <h1 className="text-3xl font-bold text-white">Nova Saída de Estoque</h1>
                        <p className="text-sm text-white/60 mt-1">
                            Registre saídas por perda, roubo, avaria ou outros motivos
                        </p>
                    </header>

                    <div className="bg-red-900/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30 space-y-6">
                        {/* Cabeçalho da Saída */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white">Motivo da Saída</Label>
                                <Select value={exitReason} onValueChange={setExitReason}>
                                    <SelectTrigger className="bg-white/5 border-red-500/30 text-white">
                                        <SelectValue placeholder="Selecione o motivo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ROUBO">Roubo</SelectItem>
                                        <SelectItem value="PERDA">Perda</SelectItem>
                                        <SelectItem value="AVARIA">Avaria</SelectItem>
                                        <SelectItem value="OUTRO">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white">Origem da Saída</Label>
                                <Select value={exitTarget} onValueChange={handleExitTargetChange}>
                                    <SelectTrigger className="bg-white/5 border-red-500/30 text-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CENTRAL">Estoque Central</SelectItem>
                                        <SelectItem value="UNIT">Unidade</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {exitTarget === 'UNIT' && (
                            <div className="space-y-2">
                                <Label className="text-white">Unidade</Label>
                                <Select value={exitUnitId} onValueChange={handleExitUnitChange}>
                                    <SelectTrigger className="bg-white/5 border-red-500/30 text-white">
                                        <SelectValue placeholder="Selecione a unidade..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-white">Descrição / Observação (Opcional)</Label>
                            <Input
                                value={exitDescription}
                                onChange={(e) => setExitDescription(e.target.value)}
                                className="bg-white/5 border-red-500/30 text-white"
                                placeholder="Descreva detalhes da ocorrência..."
                            />
                        </div>

                        <div className="border-t border-red-500/30 my-4" />

                        {/* Adicionar Item à Saída */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Itens da Saída</h3>

                            {exitTarget === 'UNIT' && !exitUnitId ? (
                                <p className="text-white/50 text-sm">Selecione uma unidade para visualizar os itens disponíveis.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-7 space-y-2">
                                        <Label className="text-white">Produto</Label>
                                        <Select value={exitCurrentItemId} onValueChange={setExitCurrentItemId}>
                                            <SelectTrigger className="bg-white/5 border-red-500/30 text-white">
                                                <SelectValue placeholder="Selecione o produto..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getExitAvailableItems().map((i) => (
                                                    <SelectItem key={i.id} value={i.id}>
                                                        {i.internalCode ? `[${i.internalCode}] ` : ''}{i.name} (Disp: {i.quantity ?? 0})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-white">Qtd</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={exitCurrentQty}
                                            onChange={(e) => setExitCurrentQty(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="Qtd"
                                            className="bg-white/5 border-red-500/30 text-white"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <Button onClick={handleAddExitItem} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
                                            <Plus className="w-4 h-4 mr-1" /> Adicionar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lista de Itens da Saída */}
                        <div className="rounded-lg border border-red-500/30 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-red-900/40 hover:bg-red-900/40">
                                        <TableHead className="text-white">Produto</TableHead>
                                        <TableHead className="text-white text-right">Qtd</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exitItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-white/50 h-20">Nenhum item adicionado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        exitItems.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-white/5 border-red-500/20">
                                                <TableCell className="text-white font-medium">{getExitItemName(item.itemId)}</TableCell>
                                                <TableCell className="text-white text-right">{item.quantity}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveExitItem(idx)}>
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-end pt-4 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsHistoryModalOpen(true);
                                    fetchHistory();
                                }}
                                className="border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                            >
                                <History className="w-4 h-4 mr-2" /> Histórico
                            </Button>

                            <Button
                                size="lg"
                                onClick={handleSubmitExit}
                                disabled={isSubmittingExit || exitItems.length === 0}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isSubmittingExit ? (
                                    <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <MinusCircle className="w-5 h-5 mr-2" />
                                )}
                                Confirmar Saída
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de Histórico de Saídas */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background border-brand-blue/30">
                    <DialogHeader>
                        <DialogTitle>Histórico de Saídas</DialogTitle>
                    </DialogHeader>
                    
                    {historyLoading ? (
                        <div className="flex justify-center p-8">
                            <LoaderCircle className="w-8 h-8 animate-spin text-brand-blue" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {exitHistory.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">Nenhum registro encontrado.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Motivo</TableHead>
                                            <TableHead>Origem</TableHead>
                                            <TableHead>Itens</TableHead>
                                            <TableHead>Responsável</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {exitHistory.map((exit) => (
                                            <TableRow key={exit.id}>
                                                <TableCell>{new Date(exit.exitDate).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{exit.reason}</span>
                                                    {exit.description && <p className="text-xs text-muted-foreground">{exit.description}</p>}
                                                </TableCell>
                                                <TableCell>
                                                    {exit.target === 'CENTRAL' ? 'Estoque Central' : `Unidade: ${exit.unit?.name || 'N/A'}`}
                                                </TableCell>
                                                <TableCell>
                                                    <ul className="text-sm list-disc pl-4">
                                                        {exit.items.map((i: any) => (
                                                            <li key={i.id}>
                                                                {i.quantity}x {i.item.name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </TableCell>
                                                <TableCell>{exit.registeredBy.name}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setDeletingExitId(exit.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingExitId} onOpenChange={(open) => !open && setDeletingExitId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir registro de saída?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Escolha se deseja devolver os itens ao estoque ou apenas apagar o registro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                        <Button 
                            variant="default" 
                            className="bg-green-600 hover:bg-green-700 w-full"
                            onClick={() => confirmDeleteExit(true)}
                        >
                            Devolver itens ao estoque original
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Os itens serão somados novamente ao inventário (Entrada por estorno).
                        </p>
                        
                        <div className="border-t border-border my-2"></div>

                        <Button 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => confirmDeleteExit(false)}
                        >
                            Excluir apenas o registro (histórico)
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Os itens NÃO voltarão ao estoque. Use para limpar registros errados que não afetaram o saldo físico.
                        </p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


        </div>
    );
};

export default StockEntryPage;