import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LoaderCircle,
  MoreHorizontal,
  Info,
  BookOpen,
  Briefcase,
  Truck,
  PackageCheck,
  KeyRound
} from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { toast } from 'sonner';
import { api } from "@/lib/api";

type RequestStatus = 'SOLICITADO' | 'ENVIADO' | 'RECEBIDO' | 'CANCELADO';

interface Request {
  id: string;
  quantity: number;
  status: RequestStatus;
  createdAt: string;
  purpose: 'AULA' | 'PROJETO' | null;
  observation: string | null;
  trackingCode: string | null;     // Campo de Rastreio
  deliveryPassword: string | null; // Campo de Senha
  item: { name: string };
  requestedBy: { name: string };
  unit: { name: string };
}

const statusVariants: Record<RequestStatus, string> = {
  SOLICITADO: 'bg-yellow-600/80 text-white',
  ENVIADO: 'bg-blue-600/80 text-white',
  RECEBIDO: 'bg-green-600/80 text-white',
  CANCELADO: 'bg-red-600/80 text-white',
};

const RequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  // Estados do Modal de Envio
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [requestToSend, setRequestToSend] = useState<string | null>(null);
  
  // Inputs do Modal
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [deliveryPasswordInput, setDeliveryPasswordInput] = useState(''); // Nova senha
  
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api('/requests');
      if (response.ok) {
        setRequests(await response.json());
      } else {
        toast.error('Falha ao buscar solicitações.');
      }
    } catch {
      toast.error('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    let result = requests.slice();
    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (debouncedQuery.trim() !== '') {
      const q = debouncedQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.item.name.toLowerCase().includes(q) ||
          r.requestedBy.name.toLowerCase().includes(q) ||
          (r.unit?.name || '').toLowerCase().includes(q)
      );
    }
    setFilteredRequests(result);
  }, [requests, statusFilter, debouncedQuery]);

  // Abre o modal
  const handleOpenSendModal = (requestId: string) => {
    setRequestToSend(requestId);
    setTrackingCodeInput('');
    setDeliveryPasswordInput('');
    setIsSendModalOpen(true);
  };

  // Confirma o envio
  const handleConfirmSend = async () => {
    if (!requestToSend) return;

    setIsUpdating(true);
    try {
        const response = await api(`/requests/${requestToSend}/status`, {
            method: 'PUT',
            body: JSON.stringify({ 
                status: 'ENVIADO',
                trackingCode: trackingCodeInput,
                deliveryPassword: deliveryPasswordInput // Enviamos a senha também
            }),
        });

        if (response.ok) {
            toast.success("Solicitação enviada com sucesso!");
            setIsSendModalOpen(false);
            fetchRequests();
        } else {
            const data = await response.json();
            toast.error(data.message || "Erro ao atualizar.");
        }
    } catch {
        toast.error("Erro de conexão.");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleSimpleStatusChange = async (requestId: string, newStatus: RequestStatus) => {
    try {
      const response = await api(`/requests/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Status atualizado para ${newStatus}.`);
        fetchRequests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Falha.');
      }
    } catch {
      toast.error('Erro de conexão.');
    }
  };

  const canViewDetails = user?.role === 'DIRETOR' || user?.role === 'COORDENADOR';

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
          <header>
            <h1 className="text-3xl font-bold text-white">Todas as Solicitações</h1>
            <p className="text-sm text-white/60 mt-1">Gerencie os pedidos e envios de materiais</p>
          </header>

          {(user?.role === 'DIRETOR' || user?.role === 'COORDENADOR' || user?.role === 'INSTRUTOR') && (
            <div className="flex gap-3 items-center mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-white/80 text-sm">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md bg-white/5 text-white px-3 py-2 appearance-none"
                  style={{ color: '#fff' }}
                >
                  <option value="ALL" className="text-black">Todos</option>
                  <option value="SOLICITADO" className="text-black">Solicitado</option>
                  <option value="ENVIADO" className="text-black">Enviado</option>
                  <option value="RECEBIDO" className="text-black">Recebido</option>
                  <option value="CANCELADO" className="text-black">Cancelado</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <input
                  type="text"
                  placeholder="Buscar item, solicitante..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md bg-white/5 text-white/90 px-3 py-2"
                />
              </div>
            </div>
          )}

          <section className="rounded-xl border border-brand-blue/30 bg-brand-blue/40 backdrop-blur-md overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-brand-blue/60 hover:bg-brand-blue/60">
                  <TableHead className="text-white">Data</TableHead>
                  <TableHead className="text-white">Item</TableHead>
                  <TableHead className="text-white">Qtd.</TableHead>
                  <TableHead className="text-white">Unidade</TableHead>
                  <TableHead className="text-white">Solicitante</TableHead>
                  <TableHead className="text-white">Status / Entrega</TableHead>
                  {canViewDetails && <TableHead className="text-white">Detalhes</TableHead>}
                  <TableHead className="text-white text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => {
                    const actions: JSX.Element[] = [];

                    if (user?.role === 'DIRETOR' || user?.role === 'COORDENADOR') {
                      if (request.status === 'SOLICITADO') {
                        actions.push(
                          <DropdownMenuItem key="enviar" onClick={() => handleOpenSendModal(request.id)}>
                            <Truck className="w-4 h-4 mr-2" /> Marcar como Enviado
                          </DropdownMenuItem>
                        );
                        actions.push(
                          <DropdownMenuItem key="cancelar" onClick={() => handleSimpleStatusChange(request.id, 'CANCELADO')} className="text-red-400">
                            Cancelar Solicitação
                          </DropdownMenuItem>
                        );
                      }
                    } else if (user?.role === 'INSTRUTOR' && request.status === 'ENVIADO') {
                      actions.push(
                        <DropdownMenuItem key="receber" onClick={() => handleSimpleStatusChange(request.id, 'RECEBIDO')}>
                          <PackageCheck className="w-4 h-4 mr-2" /> Marcar como Recebido
                        </DropdownMenuItem>
                      );
                    }

                    return (
                      <TableRow key={request.id} className="border-brand-blue/20 hover:bg-white/5">
                        <TableCell className="text-white">
                          {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium text-white">{request.item.name}</TableCell>
                        <TableCell className="text-white">{request.quantity}</TableCell>
                        <TableCell className="text-white">{request.unit.name}</TableCell>
                        <TableCell className="text-white">{request.requestedBy.name}</TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                              <Badge className={statusVariants[request.status]}>
                                {request.status}
                              </Badge>
                              
                              {/* RASTREIO */}
                              {request.trackingCode && (
                                  <div className="flex items-center gap-1 text-xs text-brand-cyan font-mono mt-1 bg-brand-blue/50 px-2 py-0.5 rounded border border-brand-cyan/30" title="Código de Rastreio">
                                      <Truck className="w-3 h-3" />
                                      {request.trackingCode}
                                  </div>
                              )}
                              
                              {/* SENHA DE ENTREGA */}
                              {request.deliveryPassword && (
                                  <div className="flex items-center gap-1 text-xs text-amber-300 font-mono mt-0.5 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/30" title="Senha de Coleta">
                                      <KeyRound className="w-3 h-3" />
                                      Senha: {request.deliveryPassword}
                                  </div>
                              )}
                          </div>
                        </TableCell>

                        {canViewDetails && (
                          <TableCell>
                            <div className="flex gap-2">
                              {request.purpose && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    {request.purpose === 'AULA' ? <BookOpen className="h-4 w-4 text-white/70" /> : <Briefcase className="h-4 w-4 text-white/70" />}
                                  </TooltipTrigger>
                                  <TooltipContent>{request.purpose === 'AULA' ? 'Aula' : 'Projeto'}</TooltipContent>
                                </Tooltip>
                              )}
                              {request.observation && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-white/70" />
                                  </TooltipTrigger>
                                  <TooltipContent><p className="max-w-xs">{request.observation}</p></TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        )}

                        <TableCell className="text-right">
                          {actions.length > 0 ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                  <MoreHorizontal className="h-4 w-4 text-white" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>{actions}</DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={canViewDetails ? 8 : 7} className="text-center text-white/60 h-24">
                      Nenhuma solicitação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
        </div>
      </main>

      {/* --- MODAL DE ENVIO COM SENHA --- */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="bg-background border-brand-blue/30 text-white">
            <DialogHeader>
                <DialogTitle>Confirmar Envio</DialogTitle>
                <DialogDescription className="text-white/60">
                    Preencha os dados de entrega para o instrutor.
                </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="tracking">Código de Rastreio (Opcional)</Label>
                    <Input 
                        id="tracking" 
                        value={trackingCodeInput} 
                        onChange={(e) => setTrackingCodeInput(e.target.value)}
                        placeholder="Ex: BR123456789"
                        className="bg-white/5 border-brand-blue/30 text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Senha de Coleta (Opcional)</Label>
                    <Input 
                        id="password" 
                        value={deliveryPasswordInput} 
                        onChange={(e) => setDeliveryPasswordInput(e.target.value)}
                        placeholder="Ex: SENHA123"
                        className="bg-white/5 border-brand-blue/30 text-white"
                    />
                    <p className="text-xs text-white/40">Se preenchido, o instrutor verá esta senha para receber o produto.</p>
                </div>
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSendModalOpen(false)} disabled={isUpdating}>Cancelar</Button>
                <Button onClick={handleConfirmSend} disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isUpdating && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
                    Confirmar Envio
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default RequestsPage;