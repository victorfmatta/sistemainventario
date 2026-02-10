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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { toast } from 'sonner';
import { api } from "@/lib/api"; // <--- IMPORTANTE

type RequestStatus = 'SOLICITADO' | 'ENVIADO' | 'RECEBIDO' | 'CANCELADO';

interface Request {
  id: string;
  quantity: number;
  status: RequestStatus;
  createdAt: string;
  purpose: 'AULA' | 'PROJETO' | null;
  observation: string | null;
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
  const { user } = useAuth(); // token não é mais necessário aqui
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // Substituído fetch por api
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
  }, []); // Sem dependência de token

  // Debounce para o campo de busca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Lógica de Filtro no Cliente
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
    
    if (startDate) {
      const sd = new Date(startDate);
      result = result.filter((r) => new Date(r.createdAt) >= sd);
    }
    
    if (endDate) {
      const ed = new Date(endDate);
      ed.setHours(23, 59, 59, 999);
      result = result.filter((r) => new Date(r.createdAt) <= ed);
    }
    
    setFilteredRequests(result);
  }, [requests, statusFilter, debouncedQuery, startDate, endDate]);

  const handleStatusChange = async (
    requestId: string,
    newStatus: RequestStatus
  ) => {
    try {
      // Substituído fetch por api
      const response = await api(`/requests/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Status atualizado para ${newStatus}.`);
        fetchRequests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Falha ao atualizar status.');
      }
    } catch {
      toast.error('Erro de conexão ao atualizar status.');
    }
  };

  const canViewDetails =
    user?.role === 'DIRETOR' || user?.role === 'COORDENADOR';

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
            <h1 className="text-3xl font-bold text-white">
              Todas as Solicitações
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Acompanhe e gerencie as solicitações de materiais
            </p>
          </header>

          {/* Filtros visíveis para Diretor, Coordenador e Instrutor */}
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

              <div className="flex items-center gap-2">
                <label className="text-white/80 text-sm">Período</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-md bg-white/5 text-white/90 px-3 py-2"
                />
                <span className="text-white/60">até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-md bg-white/5 text-white/90 px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <input
                  type="text"
                  placeholder="Buscar por item, solicitante ou unidade"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md bg-white/5 text-white/90 px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSearchQuery('');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  Limpar
                </Button>
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
                  <TableHead className="text-white">Status</TableHead>
                  {canViewDetails && (
                    <TableHead className="text-white">
                      Detalhes
                    </TableHead>
                  )}
                  <TableHead className="text-white text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => {
                    const actions: JSX.Element[] = [];

                    if (
                      user?.role === 'DIRETOR' ||
                      user?.role === 'COORDENADOR'
                    ) {
                      if (request.status === 'SOLICITADO') {
                        actions.push(
                          <DropdownMenuItem
                            key="enviar"
                            onClick={() =>
                              handleStatusChange(
                                request.id,
                                'ENVIADO'
                              )
                            }
                          >
                            Marcar como Enviado
                          </DropdownMenuItem>
                        );
                        actions.push(
                          <DropdownMenuItem
                            key="cancelar"
                            onClick={() =>
                              handleStatusChange(
                                request.id,
                                'CANCELADO'
                              )
                            }
                            className="text-red-400"
                          >
                            Cancelar Solicitação
                          </DropdownMenuItem>
                        );
                      }
                    } else if (
                      user?.role === 'INSTRUTOR' &&
                      request.status === 'ENVIADO'
                    ) {
                      actions.push(
                        <DropdownMenuItem
                          key="receber"
                          onClick={() =>
                            handleStatusChange(
                              request.id,
                              'RECEBIDO'
                            )
                          }
                        >
                          Marcar como Recebido
                        </DropdownMenuItem>
                      );
                    }

                    return (
                      <TableRow
                        key={request.id}
                        className="border-brand-blue/20 hover:bg-white/5"
                      >
                        <TableCell className="text-white">
                          {new Date(
                            request.createdAt
                          ).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          {request.item.name}
                        </TableCell>
                        <TableCell className="text-white">
                          {request.quantity}
                        </TableCell>
                        <TableCell className="text-white">
                          {request.unit.name}
                        </TableCell>
                        <TableCell className="text-white">
                          {request.requestedBy.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={statusVariants[request.status]}
                          >
                            {request.status}
                          </Badge>
                        </TableCell>

                        {canViewDetails && (
                          <TableCell>
                            <div className="flex gap-2">
                              {request.purpose === 'AULA' && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <BookOpen className="h-4 w-4 text-white/70" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Uso em Aula
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {request.purpose === 'PROJETO' && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Briefcase className="h-4 w-4 text-white/70" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Uso em Projeto
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {request.observation && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-white/70" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      {request.observation}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        )}

                        <TableCell className="text-right">
                          {actions.length > 0 ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-white/10"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-white" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {actions}
                              </DropdownMenuContent>
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
                    <TableCell
                      colSpan={canViewDetails ? 8 : 7}
                      className="text-center text-white/60 h-24"
                    >
                      Nenhuma solicitação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RequestsPage;