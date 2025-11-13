import { useEffect, useState } from 'react';
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/auth.context";
import { Navigate } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LoaderCircle, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EditUnitForm } from '@/components/forms/EditUnitForm';
import { CreateUserForm } from '@/components/forms/CreateUserForm';
// --- INÍCIO DAS NOVAS ALTERAÇÕES ---
import { AssignUnitForm } from '@/components/forms/AssignUnitForm'; // 1. Importar o novo formulário
// --- FIM DAS NOVAS ALTERAÇÕES ---

// Tipos de dados
interface Unit { id: string; name: string; coordinatorId: string | null; coordinator: { name: string } | null; }
// Atualizar o tipo User para incluir a unidade associada
interface User { id: string; name: string; email: string; role: string; unit: { id: string; name: string; } | null; }

const AdminPage = () => {
  const { user, token } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para modais de Unidade
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Estados para modais de Usuário
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // --- INÍCIO DAS NOVAS ALTERAÇÕES ---
  // 2. Estados para o modal de associação de unidade
  const [isAssignUnitModalOpen, setIsAssignUnitModalOpen] = useState(false);
  const [assigningInstructor, setAssigningInstructor] = useState<User | null>(null);
  // --- FIM DAS NOVAS ALTERAÇÕES ---

  const fetchData = async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setIsLoading(true);
    try {
      const unitsResponse = await fetch('http://localhost:3001/api/units', { headers: { 'Authorization': `Bearer ${token}` } } );
      const usersResponse = await fetch('http://localhost:3001/api/users', { headers: { 'Authorization': `Bearer ${token}` } } );

      if (unitsResponse.ok && usersResponse.ok) {
        const allUnits = await unitsResponse.json();
        const allUsers = await usersResponse.json();
        setUnits(allUnits);
        setUsers(allUsers);
        setCoordinators(allUsers.filter((u: User) => u.role === 'COORDENADOR'));
      } else {
        toast.error("Falha ao carregar dados de administração.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => { if(token) fetchData(); }, [token]);

  const handleUnitSuccess = async () => {
    const message = editingUnit ? "Unidade atualizada!" : "Unidade criada!";
    toast.success(message);
    await fetchData(false);
    setIsUnitModalOpen(false);
    setEditingUnit(null);
  };

  const handleUserCreateSuccess = async () => {
    toast.success("Usuário criado com sucesso!");
    await fetchData(false);
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const response = await fetch(`http://localhost:3001/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      } );
      if (response.ok) {
        toast.success(`Usuário "${deletingUser.name}" excluído com sucesso.`);
        await fetchData(false);
      } else {
        toast.error("Falha ao excluir o usuário.");
      }
    } catch (error) {
      toast.error("Erro de conexão ao tentar excluir.");
    } finally {
      setDeletingUser(null);
    }
  };

  // --- INÍCIO DAS NOVAS ALTERAÇÕES ---
  // 3. Handler de sucesso para o novo formulário
  const handleAssignUnitSuccess = async () => {
    toast.success("Instrutor associado à unidade com sucesso!");
    await fetchData(false);
    setIsAssignUnitModalOpen(false);
    setAssigningInstructor(null);
  };

  const openAssignUnitModal = (instructor: User) => {
    setAssigningInstructor(instructor);
    setIsAssignUnitModalOpen(true);
  };
  // --- FIM DAS NOVAS ALTERAÇÕES ---

  const openUnitModalForEdit = (unit: Unit) => { setEditingUnit(unit); setIsUnitModalOpen(true); };
  const openUnitModalForCreate = () => { setEditingUnit(null); setIsUnitModalOpen(true); };

  if (!user || (user.role !== 'DIRETOR' && user.role !== 'COORDENADOR')) {
    return <Navigate to="/dashboard" />;
  }

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
          <h1 className="text-3xl font-bold text-foreground">Painel de Administração</h1>
          
          {user.role === 'DIRETOR' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">Gerenciamento de Unidades</h2>
                <Button onClick={openUnitModalForCreate}>+ Criar Nova Unidade</Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="text-secondary-foreground">Nome da Unidade</TableHead>
                    <TableHead className="text-secondary-foreground">Coordenador Responsável</TableHead>
                    <TableHead className="text-secondary-foreground text-right">Ações</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {units.length > 0 ? (
                      units.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell className="text-muted-foreground">{unit.coordinator?.name || 'Nenhum'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openUnitModalForEdit(unit)}><Pencil className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (<TableRow><TableCell colSpan={3} className="text-center h-24">Nenhuma unidade cadastrada.</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                {user.role === 'DIRETOR' ? 'Gerenciamento de Usuários' : 'Gerenciamento de Instrutores'}
              </h2>
              <Button onClick={() => setIsUserModalOpen(true)}>
                {user.role === 'DIRETOR' ? '+ Criar Novo Usuário' : '+ Criar Novo Instrutor'}
              </Button>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader><TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="text-secondary-foreground">Nome</TableHead>
                  <TableHead className="text-secondary-foreground">Email</TableHead>
                  <TableHead className="text-secondary-foreground">Cargo</TableHead>
                  {/* 4. Adicionar coluna "Unidade" para o Coordenador */}
                  {user.role === 'COORDENADOR' && <TableHead className="text-secondary-foreground">Unidade Associada</TableHead>}
                  <TableHead className="text-secondary-foreground text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="text-muted-foreground">{u.role}</TableCell>
                        {/* 5. Exibir a unidade do instrutor */}
                        {user.role === 'COORDENADOR' && <TableCell className="text-muted-foreground">{u.unit?.name || 'Nenhuma'}</TableCell>}
                        <TableCell className="text-right">
                          {/* 6. Botão de Editar/Associar para o Coordenador */}
                          {user.role === 'COORDENADOR' && u.role === 'INSTRUTOR' && (
                            <Button variant="ghost" size="icon" onClick={() => openAssignUnitModal(u)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {user && u.id !== user.id && (
                            <Button variant="ghost" size="icon" onClick={() => setDeletingUser(u)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (<TableRow><TableCell colSpan={user.role === 'COORDENADOR' ? 5 : 4} className="text-center h-24">Nenhum usuário encontrado.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </main>

      {/* Modal para Criar/Editar Unidade */}
      <Dialog open={isUnitModalOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsUnitModalOpen(false); setEditingUnit(null); }}}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUnit ? `Editar Unidade: ${editingUnit.name}` : 'Criar Nova Unidade'}</DialogTitle></DialogHeader>
          <EditUnitForm unit={editingUnit} coordinators={coordinators} onSuccess={handleUnitSuccess} onCancel={() => setIsUnitModalOpen(false)} token={token} />
        </DialogContent>
      </Dialog>

      {/* Modal para Criar Usuário */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>
            {user.role === 'DIRETOR' ? 'Criar Novo Usuário' : 'Criar Novo Instrutor'}
          </DialogTitle></DialogHeader>
          <CreateUserForm onSuccess={handleUserCreateSuccess} onCancel={() => setIsUserModalOpen(false)} token={token} />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingUser} onOpenChange={(isOpen) => !isOpen && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário <strong>{deletingUser?.name}</strong> e todo o seu acesso.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- INÍCIO DAS NOVAS ALTERAÇÕES --- */}
      {/* 7. Modal para Associar Instrutor a uma Unidade */}
      <Dialog open={isAssignUnitModalOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsAssignUnitModalOpen(false); setAssigningInstructor(null); }}}>
        <DialogContent>
          <DialogHeader><DialogTitle>Associar Instrutor: {assigningInstructor?.name}</DialogTitle></DialogHeader>
          {assigningInstructor && (
            <AssignUnitForm
              instructor={assigningInstructor}
              units={units} // Passa a lista de unidades que o coordenador gerencia
              onSuccess={handleAssignUnitSuccess}
              onCancel={() => setIsAssignUnitModalOpen(false)}
              token={token}
            />
          )}
        </DialogContent>
      </Dialog>
      {/* --- FIM DAS NOVAS ALTERAÇÕES --- */}
    </div>
  );
};

export default AdminPage;
