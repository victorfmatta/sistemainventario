import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // 1. Importar Tooltip
import { LoaderCircle, MoreHorizontal, Info, BookOpen, Briefcase } from 'lucide-react'; // 2. Importar novos ícones
import { useAuth } from '@/contexts/auth.context';
import { toast } from 'sonner';

type RequestStatus = 'SOLICITADO' | 'ENVIADO' | 'RECEBIDO' | 'CANCELADO';

// --- INÍCIO DAS ALTERAÇÕES ---
// 3. Atualizar o tipo Request para incluir os novos campos
interface Request {
  id: string;
  quantity: number;
  status: RequestStatus;
  createdAt: string;
  purpose: 'AULA' | 'PROJETO' | null;
  observation: string | null;
  item: { name: string };
  requestedBy: { name: string }; // Corrigido
  unit: { name: string };
}
// --- FIM DAS ALTERAÇÕES ---

const statusVariants: Record<RequestStatus, string> = {
  SOLICITADO: 'bg-yellow-500 hover:bg-yellow-500/80 text-primary-foreground',
  ENVIADO: 'bg-blue-500 hover:bg-blue-500/80 text-primary-foreground',
  RECEBIDO: 'bg-green-500 hover:bg-green-500/80 text-primary-foreground',
  CANCELADO: 'bg-red-500 hover:bg-red-500/80 text-primary-foreground',
};

const RequestsPage = () => {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3001/api/requests', {
        headers: { 'Authorization': `Bearer ${token}` },
      } );
      if (response.ok) {
        setRequests(await response.json());
      } else {
        toast.error("Falha ao buscar solicitações.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [token]);

  const handleStatusChange = async (requestId: string, newStatus: RequestStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus } ),
      });
      if (response.ok) {
        toast.success(`Status da solicitação atualizado para ${newStatus}.`);
        fetchRequests(); // Re-busca os dados para garantir consistência
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Falha ao atualizar o status.");
      }
    } catch (error) {
      toast.error("Erro de conexão ao tentar atualizar o status.");
    }
  };

  if (isLoading) { /* ... (código de loading sem alteração) ... */ }

  // --- INÍCIO DAS ALTERAÇÕES ---
  // 4. Determinar se o usuário pode ver os detalhes
  const canViewDetails = user?.role === 'DIRETOR' || user?.role === 'COORDENADOR';
  // --- FIM DAS ALTERAÇÕES ---

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-foreground">Todas as Solicitações</h1>
          <section className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="text-secondary-foreground">Data</TableHead>
                    <TableHead className="text-secondary-foreground">Item</TableHead>
                    <TableHead className="text-secondary-foreground">Qtd.</TableHead>
                    <TableHead className="text-secondary-foreground">Unidade</TableHead>
                    <TableHead className="text-secondary-foreground">Solicitante</TableHead>
                    <TableHead className="text-secondary-foreground">Status</TableHead>
                    {/* 5. Adicionar nova coluna se o usuário tiver permissão */}
                    {canViewDetails && <TableHead className="text-secondary-foreground">Detalhes</TableHead>}
                    <TableHead className="text-secondary-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((request) => {
                      const availableActions: JSX.Element[] = [];
                      if (user?.role === 'DIRETOR' || user?.role === 'COORDENADOR') {
                        if (request.status === 'SOLICITADO') {
                          availableActions.push(<DropdownMenuItem key="enviar" onClick={() => handleStatusChange(request.id, 'ENVIADO')}>Marcar como Enviado</DropdownMenuItem>);
                          availableActions.push(<DropdownMenuItem key="cancelar" onClick={() => handleStatusChange(request.id, 'CANCELADO')} className="text-red-500">Cancelar Solicitação</DropdownMenuItem>);
                        }
                      } else if (user?.role === 'INSTRUTOR') {
                        if (request.status === 'ENVIADO') {
                          availableActions.push(<DropdownMenuItem key="receber" onClick={() => handleStatusChange(request.id, 'RECEBIDO')}>Marcar como Recebido</DropdownMenuItem>);
                        }
                      }

                      return (
                        <TableRow key={request.id} className="border-border">
                          <TableCell className="text-foreground">{new Date(request.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="font-medium text-foreground">{request.item.name}</TableCell>
                          <TableCell className="text-foreground">{request.quantity}</TableCell>
                          <TableCell className="text-foreground">{request.unit.name}</TableCell>
                          <TableCell className="text-foreground">{request.requestedBy.name}</TableCell>
                          <TableCell><Badge className={statusVariants[request.status]}>{request.status}</Badge></TableCell>
                          
                          {/* 6. Renderizar a célula de detalhes */}
                          {canViewDetails && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {request.purpose === 'AULA' && <Tooltip><TooltipTrigger><BookOpen className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent>Uso em Aula</TooltipContent></Tooltip>}
                                {request.purpose === 'PROJETO' && <Tooltip><TooltipTrigger><Briefcase className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent>Uso em Projeto</TooltipContent></Tooltip>}
                                {request.observation && (
                                  <Tooltip><TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">{request.observation}</p></TooltipContent></Tooltip>
                                )}
                              </div>
                            </TableCell>
                          )}

                          <TableCell className="text-right">
                            {availableActions.length > 0 ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>{availableActions}</DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell colSpan={canViewDetails ? 8 : 7} className="text-center text-muted-foreground h-24">Nenhuma solicitação encontrada.</TableCell></TableRow>
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

export default RequestsPage;
