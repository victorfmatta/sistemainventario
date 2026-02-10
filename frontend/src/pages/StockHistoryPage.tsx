import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/auth.context"; // token não é mais necessário explicitamente
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { LoaderCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api"; // <--- IMPORTANTE

interface StockEntry {
    id: string;
    invoiceNumber: string | null;
    issueDate: string;
    entryDate: string;
    supplier: { name: string } | null;
    registeredBy: { name: string };
    _count: { items: number };
}

interface StockEntryDetail extends StockEntry {
    items: {
        id: string;
        quantity: number;
        unitPrice: number;
        item: {
            name: string;
            internalCode: string | null;
            unitOfMeasure: string | null;
        }
    }[]
}

const StockHistoryPage = () => {
    // const { token } = useAuth(); // Não precisamos mais do token aqui
    const [entries, setEntries] = useState<StockEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState<StockEntryDetail | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            // Substituído fetch por api
            const res = await api("/stock-entries");
            
            if (res.ok) {
                setEntries(await res.json());
            } else {
                toast.error("Erro ao carregar histórico.");
            }
        } catch {
            toast.error("Erro de conexão ao carregar histórico.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = async (id: string) => {
        setIsDetailLoading(true);
        try {
            // Substituído fetch por api
            const res = await api(`/stock-entries/${id}`);
            
            if (res.ok) {
                setSelectedEntry(await res.json());
            } else {
                toast.error("Erro ao carregar detalhes.");
            }
        } catch {
            toast.error("Erro de conexão.");
        } finally {
            setIsDetailLoading(false);
        }
    }

    useEffect(() => {
        fetchEntries();
    }, []); // Removemos a dependência do token

    return (
        <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background">
            <AppSidebar />
            <main className="flex-1 p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    <header>
                        <h1 className="text-3xl font-bold text-white">Histórico de Entradas</h1>
                        <p className="text-sm text-white/60 mt-1">
                            Registro completo de movimentações de entrada de nota
                        </p>
                    </header>

                    <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/40 backdrop-blur-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-brand-blue/60 hover:bg-brand-blue/60">
                                    <TableHead className="text-white">Data Entrada</TableHead>
                                    <TableHead className="text-white">Nota Fiscal</TableHead>
                                    <TableHead className="text-white">Fornecedor</TableHead>
                                    <TableHead className="text-white">Resp. Registro</TableHead>
                                    <TableHead className="text-white text-right">Itens</TableHead>
                                    <TableHead className="text-white text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <LoaderCircle className="w-6 h-6 animate-spin mx-auto text-white" />
                                        </TableCell>
                                    </TableRow>
                                ) : entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-white/50">
                                            Nenhuma entrada registrada nesta empresa.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entries.map((entry) => (
                                        <TableRow key={entry.id} className="hover:bg-white/5 border-brand-blue/20">
                                            <TableCell className="text-white">
                                                {format(new Date(entry.entryDate), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell className="text-white font-mono text-xs">
                                                {entry.invoiceNumber || "S/N"}
                                            </TableCell>
                                            <TableCell className="text-white/80">
                                                {entry.supplier?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-white/60">
                                                {entry.registeredBy.name}
                                            </TableCell>
                                            <TableCell className="text-white text-right">
                                                {entry._count.items}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(entry.id)}
                                                    className="hover:bg-white/10 text-brand-cyan hover:text-brand-cyan"
                                                >
                                                    {isDetailLoading && selectedEntry?.id === entry.id ? (
                                                         <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                         <FileText className="w-4 h-4 mr-2" />
                                                    )}
                                                    Detalhes
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </main>

            <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
                <DialogContent className="max-w-3xl bg-background border-brand-blue/30">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Entrada</DialogTitle>
                    </DialogHeader>
                    {selectedEntry && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Fornecedor</p>
                                    <p className="font-medium text-white">{selectedEntry.supplier?.name || "Não informado"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Nota Fiscal</p>
                                    <p className="font-medium text-white">{selectedEntry.invoiceNumber || "S/N"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Data Emissão</p>
                                    <p className="font-medium text-white">{format(new Date(selectedEntry.issueDate), "dd/MM/yyyy")}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Registrado por</p>
                                    <p className="font-medium text-white">{selectedEntry.registeredBy.name}</p>
                                </div>
                            </div>

                            <div className="border border-brand-blue/20 rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-brand-blue/10">
                                            <TableHead className="text-white">Produto</TableHead>
                                            <TableHead className="text-white">SKU</TableHead>
                                            <TableHead className="text-right text-white">Qtd</TableHead>
                                            <TableHead className="text-right text-white">Valor Unit.</TableHead>
                                            <TableHead className="text-right text-white">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedEntry.items.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-white">{item.item.name}</TableCell>
                                                <TableCell className="text-white/70">{item.item.internalCode || "-"}</TableCell>
                                                <TableCell className="text-right text-white">{item.quantity} {item.item.unitOfMeasure}</TableCell>
                                                <TableCell className="text-right text-white">
                                                    {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                                <TableCell className="text-right text-white">
                                                    {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StockHistoryPage;