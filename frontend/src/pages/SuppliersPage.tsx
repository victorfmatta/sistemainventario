import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/auth.context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LoaderCircle, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
    id: string;
    name: string;
    businessName?: string;
    cnpj?: string;
    contact?: string;
    address?: string;
}

const SuppliersPage = () => {
    const { token } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    // Form states
    const [formData, setFormData] = useState<Partial<Supplier>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSuppliers = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/suppliers", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch {
            toast.error("Erro ao carregar fornecedores.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [token]);

    const filteredSuppliers = suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.name) {
            toast.error("Nome fantasia é obrigatório.");
            setIsSubmitting(false);
            return;
        }

        try {
            const url = editingSupplier
                ? `http://localhost:3001/api/suppliers/${editingSupplier.id}`
                : "http://localhost:3001/api/suppliers";
            const method = editingSupplier ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Fornecedor salvo com sucesso!");
                fetchSuppliers();
                setIsModalOpen(false);
                setEditingSupplier(null);
                setFormData({});
            } else {
                const data = await res.json();
                toast.error(data.message || "Erro ao salvar fornecedor.");
            }
        } catch {
            toast.error("Erro de conexão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

        try {
            const res = await fetch(`http://localhost:3001/api/suppliers/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success("Fornecedor excluído!");
                fetchSuppliers();
            } else {
                const data = await res.json();
                toast.error(data.message || "Erro ao excluir.");
            }
        } catch {
            toast.error("Erro de conexão.");
        }
    };

    const openModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({});
        }
        setIsModalOpen(true);
    };

    return (
        <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background">
            <AppSidebar />
            <main className="flex-1 p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    <header className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Fornecedores</h1>
                            <p className="text-sm text-white/60 mt-1">
                                Gestão de parceiros e fornecedores
                            </p>
                        </div>
                        <Button onClick={() => openModal()}>
                            <Plus className="w-4 h-4 mr-2" /> Novo Fornecedor
                        </Button>
                    </header>

                    <div className="flex gap-4">
                        <Input
                            placeholder="Buscar fornecedor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-md bg-white/5 border-brand-blue/30 text-white"
                        />
                    </div>

                    <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/40 backdrop-blur-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-brand-blue/60 hover:bg-brand-blue/60">
                                    <TableHead className="text-white">Nome Fantasia</TableHead>
                                    <TableHead className="text-white">CNPJ</TableHead>
                                    <TableHead className="text-white">Contato</TableHead>
                                    <TableHead className="text-white text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <LoaderCircle className="w-6 h-6 animate-spin mx-auto text-white" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredSuppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-white/50">
                                            Nenhum fornecedor encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSuppliers.map((s) => (
                                        <TableRow key={s.id} className="hover:bg-white/5 border-brand-blue/20">
                                            <TableCell className="text-white font-medium">{s.name}</TableCell>
                                            <TableCell className="text-white/70">{s.cnpj || "-"}</TableCell>
                                            <TableCell className="text-white/70">{s.contact || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openModal(s)}
                                                    className="hover:bg-white/10"
                                                >
                                                    <Pencil className="w-4 h-4 text-brand-cyan" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(s.id)}
                                                    className="hover:bg-white/10"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-background border-brand-blue/30">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Fantasia *</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Tech Distribuidora"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessName">Razão Social</Label>
                            <Input
                                id="businessName"
                                value={formData.businessName || ""}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                placeholder="Ex: Tech Distribuidora LTDA"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cnpj">CNPJ</Label>
                            <Input
                                id="cnpj"
                                value={formData.cnpj || ""}
                                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact">Contato</Label>
                            <Input
                                id="contact"
                                value={formData.contact || ""}
                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                placeholder="Email ou Telefone"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Endereço</Label>
                            <Input
                                id="address"
                                value={formData.address || ""}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Rua Exemplo, 123"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuppliersPage;
