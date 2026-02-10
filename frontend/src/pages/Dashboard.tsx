import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/auth.context";
import { 
  LoaderCircle, 
  Package, 
  DollarSign, 
  Users, 
  Building2, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight,
  Truck,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api"; // <--- IMPORTANTE

const Dashboard = () => {
  const { user } = useAuth(); // token não é mais necessário aqui
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para o filtro de período (Padrão: 30 dias)
  const [period, setPeriod] = useState("30d");

  // Estados de dados
  const [unitsCount, setUnitsCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [stockValue, setStockValue] = useState<number | null>(null);
  
  const [movements, setMovements] = useState<{ 
    labels: string[]; 
    entries: number[]; 
    requests: number[]; 
    sent: number[] 
  } | null>(null);
  
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any | null>(null);

  useEffect(() => {
    // Redirecionamento de segurança:
    // Se não for DIRETOR, manda para "Minhas Unidades"
    if (user?.role && user.role !== 'DIRETOR') {
      navigate('/my-units');
      return;
    }

    const fetchData = async () => {
      try {
        // Substituído fetch por api.Promise.all
        const [summaryRes, movementsRes, entriesRes, pendingRes, lowStockRes, unitsRes, usersRes] = await Promise.all([
          api(`/dashboard/summary?period=${period}`),
          api(`/dashboard/movements?period=${period}`),
          api('/stock-entries'),
          api('/dashboard/pending-requests'),
          api('/dashboard/low-stock?threshold=5'),
          api('/units'),
          api('/users'),
        ]);

        if (summaryRes.ok) {
          const s = await summaryRes.json();
          setTotalItems(s.totalItems ?? 0);
          setStockValue(s.stockValue ?? 0);
        }
        if (entriesRes && entriesRes.ok) {
          const entries = await entriesRes.json();
          setRecentEntries(entries.slice(0, 5));
        }
        if (movementsRes.ok) {
          const m = await movementsRes.json();
          setMovements(m);
        }
        if (pendingRes.ok) {
          setPendingRequests(await pendingRes.json());
        }
        if (lowStockRes.ok) {
          setLowStock(await lowStockRes.json());
        }
        if (unitsRes.ok) {
          const units = await unitsRes.json();
          setUnitsCount(units.length);
        }
        if (usersRes.ok) {
          const users = await usersRes.json();
          setUsersCount(users.length);
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, navigate, period]); // Removido token das dependências

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-brand-blue/30 via-background to-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-brand-blue/30 via-background to-background">
      <AppSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <TooltipProvider>
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Cabeçalho */}
            <header>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-white/60 mt-1">Visão geral da gestão de estoque</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-brand-blue/40 border-brand-blue/30 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/60">Total de Itens</p>
                    <h3 className="text-2xl font-bold text-white mt-2">{totalItems ?? '-'}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-blue/40 border-brand-blue/30 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/60">Valor em Estoque</p>
                    <h3 className="text-2xl font-bold text-white mt-2">
                      R$ {stockValue ? stockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-blue/40 border-brand-blue/30 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/60">Unidades Ativas</p>
                    <h3 className="text-2xl font-bold text-white mt-2">{unitsCount ?? '-'}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-blue/40 border-brand-blue/30 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/60">Usuários</p>
                    <h3 className="text-2xl font-bold text-white mt-2">{usersCount ?? '-'}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção Principal Dividida */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Coluna da Esquerda (1/3) */}
              <div className="space-y-6 lg:col-span-1">
                
                {/* Alertas */}
                <Card className="bg-brand-blue/40 border-brand-blue/30 backdrop-blur-sm h-auto">
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <CardTitle className="text-lg font-semibold text-white">Alertas de Reposição</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lowStock && (lowStock.lowUnitItems?.length || lowStock.lowGlobalItems?.length) ? (
                      <ul className="space-y-3 mt-2">
                        {(lowStock.lowUnitItems || []).slice(0, 3).map((it: any) => (
                          <li key={`u-${it.id}`} className="flex justify-between items-center text-sm p-2 rounded bg-white/5 border border-white/10">
                            <span className="text-white/80 truncate max-w-[150px]">{it.itemName}</span>
                            <span className="text-red-400 font-bold text-xs bg-red-900/20 px-2 py-1 rounded">
                              {it.unitName}: {it.quantity} un
                            </span>
                          </li>
                        ))}
                         {(lowStock.lowGlobalItems || []).slice(0, 3).map((it: any) => (
                          <li key={`g-${it.id}`} className="flex justify-between items-center text-sm p-2 rounded bg-white/5 border border-white/10">
                            <span className="text-white/80 truncate max-w-[150px]">Central - {it.itemName}</span>
                            <span className="text-red-400 font-bold text-xs bg-red-900/20 px-2 py-1 rounded">
                              {it.totalQuantity} un
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-white/40 text-sm italic">Nenhum alerta de estoque baixo.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Movimentos com Filtro de Tempo */}
                <Card className="bg-brand-blue/40 border-brand-blue/30 backdrop-blur-sm">
                  <CardHeader>
                    {/* Cabeçalho Flex para Título e Select */}
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-white">Movimentos</CardTitle>
                      
                      <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[100px] h-8 bg-white/5 border-white/10 text-white text-xs focus:ring-brand-blue-soft">
                          <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="bg-brand-blue border-white/10 text-white">
                          <SelectItem value="7d">7 dias</SelectItem>
                          <SelectItem value="15d">15 dias</SelectItem>
                          <SelectItem value="30d">30 dias</SelectItem>
                          <SelectItem value="60d">60 dias</SelectItem>
                          <SelectItem value="90d">90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Entradas */}
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center space-x-3 cursor-help">
                              <div className="p-2 bg-emerald-500/20 rounded">
                                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                              </div>
                              <span className="text-white/70 hover:text-white transition-colors">Entradas</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="right" 
                            sideOffset={15} 
                            className="bg-brand-blue border-white/10 text-white z-[100]"
                          >
                            <p>Registro de novos materiais que entraram no estoque.</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-xl font-bold text-white">{movements?.entries.reduce((a, b) => a + b, 0) || 0}</span>
                      </div>
                      
                      {/* Envios */}
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                         <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center space-x-3 cursor-help">
                              <div className="p-2 bg-indigo-500/20 rounded">
                                <Truck className="h-4 w-4 text-indigo-400" />
                              </div>
                              <span className="text-white/70 hover:text-white transition-colors">Envios</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="right" 
                            sideOffset={15} 
                            className="bg-brand-blue border-white/10 text-white z-[100]"
                          >
                            <p>Solicitações despachadas para unidades (em trânsito).</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-xl font-bold text-white">{movements?.sent?.reduce((a, b) => a + b, 0) || 0}</span>
                      </div>

                      {/* Concluídos */}
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <div className="flex items-center space-x-3 cursor-help">
                              <div className="p-2 bg-blue-500/20 rounded">
                                <CheckCircle className="h-4 w-4 text-blue-400" />
                              </div>
                              <span className="text-white/70 hover:text-white transition-colors">Concluídos</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="right" 
                            sideOffset={15} 
                            className="bg-brand-blue border-white/10 text-white z-[100]"
                          >
                            <p>Solicitações entregues e confirmadas pelas unidades.</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-xl font-bold text-white">{movements?.requests.reduce((a, b) => a + b, 0) || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna da Direita (2/3) */}
              <div className="space-y-6 lg:col-span-2">
                
                {/* Pedidos Pendentes */}
                <Card className="bg-brand-blue/40 border-brand-blue/30 backdrop-blur-sm">
                  <CardHeader className="bg-brand-blue/50 border-b border-brand-blue/30">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-amber-400" />
                      <CardTitle className="text-lg font-semibold text-white">Pedidos Pendentes por Unidade</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                     {pendingRequests.filter(p => p.pending > 0).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingRequests.filter(p => p.pending > 0).map((p) => (
                          <div key={p.unitId} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                            <div>
                              <p className="font-medium text-white">{p.unitName}</p>
                              <p className="text-xs text-white/50">Aguardando aprovação</p>
                            </div>
                            <div className="flex items-center">
                              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30">
                                {p.pending} pedidos
                              </span>
                              
                              {/* Botão Ver agora funcional */}
                              <button 
                                onClick={() => navigate('/requests')}
                                className="ml-4 text-xs bg-brand-blue text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-brand-blue-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-in-out font-medium"
                              >
                                Ver
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mb-3">
                          <Package className="h-6 w-6 text-emerald-500" />
                        </div>
                        <p className="text-white font-medium">Tudo em dia!</p>
                        <p className="text-white/40 text-sm">Não há pedidos aguardando aprovação.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Últimas Entradas */}
                <Card className="bg-brand-blue/40 border-brand-blue/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Últimas Entradas de Estoque</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white/50 uppercase border-b border-white/10">
                          <tr>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3">Itens</th>
                            <th className="px-4 py-3">Responsável</th>
                            <th className="px-4 py-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {recentEntries.length > 0 ? (
                            recentEntries.map((e: any) => (
                              <tr key={e.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">
                                  {new Date(e.entryDate || e.issueDate || e.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3 text-white/70">
                                  {e._count?.items || '-'} itens
                                </td>
                                <td className="px-4 py-3 text-white/70">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-brand-blue/80 flex items-center justify-center text-xs text-white font-bold">
                                      {(e.registeredBy?.name || 'U').charAt(0)}
                                    </div>
                                    {e.registeredBy?.name || '—'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span 
                                    onClick={() => navigate('/stock-history')}
                                    className="text-xs text-blue-400 cursor-pointer hover:underline hover:text-blue-300 transition-colors"
                                  >
                                    Detalhes
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-white/40">
                                Nenhuma entrada recente
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </TooltipProvider>
      </main>
    </div>
  );
};

export default Dashboard;