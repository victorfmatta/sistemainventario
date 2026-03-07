import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/auth.context";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api"; // <--- IMPORTAMOS NOSSA API INTELIGENTE

import { EditUnitForm } from "@/components/forms/EditUnitForm";
import { CreateUserForm } from "@/components/forms/CreateUserForm";
import { EditUserForm } from "@/components/forms/EditUserForm";
import { AssignUnitForm } from "@/components/forms/AssignUnitForm";

/* ===================== TIPOS ===================== */

interface Unit {
  id: string;
  name: string;
  coordinatorId: string | null;
  coordinator: { name: string } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  unit: { id: string; name: string } | null;
}

/* ===================== COMPONENTE ===================== */

const AdminPage = () => {
  const { user, token } = useAuth();

  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* -------- filtros -------- */
  const [unitSearch, setUnitSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");

  /* -------- modais -------- */
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [assigningInstructor, setAssigningInstructor] =
    useState<User | null>(null);

  /* ===================== FETCH (ATUALIZADO) ===================== */

  const fetchData = async (showLoading = true) => {
    // Agora não dependemos apenas do token, mas a api trata isso internamente
    if (showLoading) setIsLoading(true);

    try {
      // Substituímos fetch por api e removemos o header manual de Authorization
      const [unitsRes, usersRes] = await Promise.all([
        api("/units"),
        api("/users"),
      ]);

      if (unitsRes.ok && usersRes.ok) {
        const unitsData = await unitsRes.json();
        const usersData = await usersRes.json();

        setUnits(unitsData);
        setUsers(usersData);
        setCoordinators(
          usersData.filter((u: User) => u.role === "COORDENADOR")
        );
      } else {
        // Se der erro 401 ou 403, a api.ts pode já ter tratado, mas avisamos aqui
        console.error("Erro ao buscar dados", unitsRes.status, usersRes.status);
        toast.error("Falha ao carregar dados de administração.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro de conexão com o servidor.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Removemos a dependência do token, pois a api.ts busca do localStorage

  /* ===================== FILTROS DERIVADOS ===================== */

  const filteredUnits = useMemo(
    () =>
      units.filter((u) =>
        u.name.toLowerCase().includes(unitSearch.toLowerCase())
      ),
    [units, unitSearch]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());

      const matchRole = roleFilter === "ALL" || u.role === roleFilter;

      const effectiveUnitId = u.unit?.id || units.find((unit) => unit.coordinatorId === u.id)?.id;
      const matchUnit = unitFilter === "ALL" || effectiveUnitId === unitFilter;

      return matchSearch && matchRole && matchUnit;
    });
  }, [users, userSearch, roleFilter, unitFilter]);

  /* ===================== HANDLERS (ATUALIZADOS) ===================== */

  const handleUnitSuccess = async () => {
    toast.success("Unidade salva com sucesso!");
    await fetchData(false);
    setIsUnitModalOpen(false);
    setEditingUnit(null);
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;

    try {
      // DELETE com api
      const res = await api(`/units/${deletingUnit.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Unidade excluída com sucesso!");
        await fetchData(false);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Falha ao excluir a unidade.");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setDeletingUnit(null);
    }
  };

  const handleUserCreateSuccess = async () => {
    toast.success("Usuário criado com sucesso!");
    await fetchData(false);
    setIsUserModalOpen(false);
  };

  const handleUserEditSuccess = async () => {
    toast.success("Usuário atualizado com sucesso!");
    await fetchData(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      // DELETE com api
      const res = await api(`/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Usuário excluído com sucesso!");
        await fetchData(false);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Falha ao excluir o usuário.");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setDeletingUser(null);
    }
  };

  /* ===================== GUARDAS ===================== */

  if (!user || (user.role !== "DIRETOR" && user.role !== "COORDENADOR" && user.role !== "AUDITOR")) {
    return <Navigate to="/my-units" />;
  }

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

  /* ===================== RENDER ===================== */

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background">
      <AppSidebar />

      <main className="flex-1 p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-white">Administração</h1>
            <p className="text-sm text-white/60 mt-1">
              Gerenciamento de unidades e usuários
            </p>
          </header>

          <Tabs defaultValue="units">
            <TabsList className="bg-brand-blue/40">
              <TabsTrigger value="units">Unidades</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            {/* ===================== UNIDADES ===================== */}
            <TabsContent value="units" className="space-y-4">
              <div className="flex justify-between gap-4">
                <Input
                  placeholder="Buscar unidade..."
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                />
                {user.role === "DIRETOR" && (
                  <Button onClick={() => setIsUnitModalOpen(true)}>
                    + Nova Unidade
                  </Button>
                )}
              </div>

              <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/40 backdrop-blur-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/60">
                      <TableHead className="text-white">Nome</TableHead>
                      <TableHead className="text-white">Coordenador</TableHead>
                      <TableHead className="text-white text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => (
                      <TableRow key={unit.id} className="hover:bg-white/5">
                        <TableCell className="text-white">
                          {unit.name}
                        </TableCell>
                        <TableCell className="text-white/70">
                          {unit.coordinator?.name || "Nenhum"}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.role === "DIRETOR" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingUnit(unit);
                                  setIsUnitModalOpen(true);
                                }}
                              >
                                <Pencil className="w-4 h-4 text-white" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingUnit(unit)}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </>
                          )}
                          {user.role === "AUDITOR" && <span className="text-xs text-white/30">Somente leitura</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ===================== USUÁRIOS ===================== */}
            <TabsContent value="users" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Buscar usuário..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Cargo</SelectItem>
                    <SelectItem value="DIRETOR">Diretor</SelectItem>
                    <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                    <SelectItem value="INSTRUTOR">Instrutor</SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Unidade</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {user.role !== "AUDITOR" && (
                  <Button onClick={() => setIsUserModalOpen(true)}>
                    + Novo Usuário
                  </Button>
                )}
              </div>

              <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/40 backdrop-blur-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/60">
                      <TableHead className="text-white">Nome</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Cargo</TableHead>
                      <TableHead className="text-white">Unidade</TableHead>
                      <TableHead className="text-white text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} className="hover:bg-white/5">
                        <TableCell className="text-white">
                          {u.name}
                        </TableCell>
                        <TableCell className="text-white">
                          {u.email}
                        </TableCell>
                        <TableCell className="text-white/70">
                          {u.role}
                        </TableCell>
                        <TableCell className="text-white/70">
                          {u.unit?.name || units.find((unit) => unit.coordinatorId === u.id)?.name || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.role === "DIRETOR" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingUser(u)}
                            >
                              <Pencil className="w-4 h-4 text-white" />
                            </Button>
                          )}
                          {/* Botão de Associar Unidade (Apenas Coordenador) */}
                          {user.role === "COORDENADOR" && u.role === "INSTRUTOR" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Associar Unidade"
                              onClick={() => setAssigningInstructor(u)}
                            >
                              <Link className="w-4 h-4 text-blue-400" />
                            </Button>
                          )}
                          {user.role !== "AUDITOR" && u.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingUser(u)}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          )}
                          {user.role === "AUDITOR" && <span className="text-xs text-white/30">Somente leitura</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* ===================== MODAIS ===================== */}

      <Dialog open={isUnitModalOpen} onOpenChange={setIsUnitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Editar Unidade" : "Nova Unidade"}
            </DialogTitle>
          </DialogHeader>
          <EditUnitForm
            unit={editingUnit}
            coordinators={coordinators}
            token={token!}
            onSuccess={handleUnitSuccess}
            onCancel={() => {
              setIsUnitModalOpen(false);
              setEditingUnit(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <CreateUserForm
            creatorRole={user.role}
            token={token!}
            onSuccess={handleUserCreateSuccess}
            onCancel={() => setIsUserModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <EditUserForm
              user={editingUser}
              token={token!}
              onSuccess={handleUserEditSuccess}
              onCancel={() => setEditingUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!assigningInstructor}
        onOpenChange={(open) => !open && setAssigningInstructor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associar Instrutor</DialogTitle>
          </DialogHeader>
          {assigningInstructor && (
            <AssignUnitForm
              instructor={assigningInstructor}
              units={units}
              token={token!}
              onSuccess={() => {
                toast.success("Instrutor associado!");
                fetchData(false);
                setAssigningInstructor(null);
              }}
              onCancel={() => setAssigningInstructor(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingUnit}
        onOpenChange={(open) => !open && setDeletingUnit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnit}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPage;