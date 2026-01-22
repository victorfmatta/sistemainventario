import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Apenas usuários autenticados
router.get('/summary', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { period } = req.query; // e.g. '30d'

    // Total de itens
    const items = await prisma.item.findMany({ select: { id: true, quantity: true } });
    const totalItems = items.reduce((s, it) => s + (it.quantity || 0), 0);

    // Valor estimado
    const priceAgg = await prisma.$queryRaw`SELECT itemId, AVG(unitPrice) as avgPrice FROM StockEntryItem GROUP BY itemId`;
    const avgPriceMap: Record<string, number> = {};
    (priceAgg as any[]).forEach((r) => {
      avgPriceMap[r.itemId] = Number(r.avgPrice || 0);
    });

    const stockValue = items.reduce((s, it) => s + (it.quantity || 0) * (avgPriceMap[it.id] || 0), 0);

    // Contagens simples para o resumo (opcional, dependendo se o frontend usa)
    let startDate: Date | null = null;
    if (typeof period === 'string' && period.endsWith('d')) {
      const days = parseInt(period.slice(0, -1), 10) || 30;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    const entriesWhere: any = {};
    const requestsWhere: any = { status: 'RECEBIDO' };
    if (startDate) {
      entriesWhere.entryDate = { gte: startDate };
      requestsWhere.createdAt = { gte: startDate };
    }

    const entriesCount = await prisma.stockEntry.count({ where: entriesWhere });
    const requestsReceivedCount = await prisma.request.count({ where: requestsWhere });

    res.json({ totalItems, stockValue, entriesCount, requestsReceivedCount });
  } catch (error) {
    console.error('Dashboard summary error', error);
    res.status(500).json({ message: 'Erro ao gerar resumo do dashboard.' });
  }
});

router.get('/movements', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const period = (req.query.period as string) || '30d';
    const days = period.endsWith('d') ? parseInt(period.slice(0, -1), 10) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    // Entradas
    const entries = await prisma.stockEntry.findMany({ 
      where: { entryDate: { gte: startDate } }, 
      select: { entryDate: true } 
    });

    // Pedidos (Considerando 'RECEBIDO' como concluído/pedido entregue)
    const requests = await prisma.request.findMany({ 
      where: { status: 'RECEBIDO', createdAt: { gte: startDate } }, 
      select: { createdAt: true } 
    });

    // Envios (NOVO: status 'ENVIADO')
    const sentRequests = await prisma.request.findMany({ 
        where: { status: 'ENVIADO', createdAt: { gte: startDate } }, 
        select: { createdAt: true } 
    });

    const labels: string[] = [];
    const entriesData: number[] = [];
    const requestsData: number[] = [];
    const sentData: number[] = []; // Array para envios

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      labels.push(key);
      entriesData.push(0);
      requestsData.push(0);
      sentData.push(0);
    }

    const indexOf = (isoDate: string) => labels.indexOf(isoDate);

    entries.forEach((e) => {
      const key = e.entryDate.toISOString().slice(0, 10);
      const idx = indexOf(key);
      if (idx >= 0) entriesData[idx] += 1;
    });

    requests.forEach((r) => {
      const key = r.createdAt.toISOString().slice(0, 10);
      const idx = indexOf(key);
      if (idx >= 0) requestsData[idx] += 1;
    });

    sentRequests.forEach((s) => {
        const key = s.createdAt.toISOString().slice(0, 10);
        const idx = indexOf(key);
        if (idx >= 0) sentData[idx] += 1;
    });

    // Retorna entries, requests (Recebidos) e sent (Enviados)
    res.json({ labels, entries: entriesData, requests: requestsData, sent: sentData });
  } catch (error) {
    console.error('Dashboard movements error', error);
    res.status(500).json({ message: 'Erro ao gerar movimentos.' });
  }
});

router.get('/pending-requests', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    // Busca agrupada por Unidade e Status
    const raw = await prisma.$queryRaw`
      SELECT unitId, status, COUNT(*) as count 
      FROM Request 
      WHERE status IN ('SOLICITADO','ENVIADO') 
      GROUP BY unitId, status
    `;
    
    const map: Record<string, any> = {};
    for (const row of raw as any[]) {
      const unitId = row.unitId as string;
      if (!map[unitId]) map[unitId] = { unitId, solicitado: 0, enviado: 0 };
      
      // Mapeia os status
      if (row.status === 'SOLICITADO') map[unitId].solicitado = Number(row.count);
      if (row.status === 'ENVIADO') map[unitId].enviado = Number(row.count);
    }

    const unitIds = Object.keys(map);
    // Busca nomes das unidades
    const units = await prisma.unit.findMany({ 
      where: { id: { in: unitIds } }, 
      select: { id: true, name: true } 
    });

    // Formata retorno: { unitName, pending (solicitados), sent (enviados) }
    // Obs: No frontend atual usamos .pending para exibir. 
    // Podemos somar ou exibir separado. Aqui retornarei ambos.
    const result = units.map(u => ({ 
      unitId: u.id, 
      unitName: u.name, 
      pending: map[u.id]?.solicitado || 0, // 'pending' geralmente é o que requer ação do diretor (aprovar)
      enviado: map[u.id]?.enviado || 0 
    }));

    res.json(result);
  } catch (error) {
    console.error('Pending requests error', error);
    res.status(500).json({ message: 'Erro ao buscar pedidos pendentes.' });
  }
});

router.get('/low-stock', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const threshold = Number(req.query.threshold || 5);

    const lowUnitItems = await prisma.unitItem.findMany({
      where: { quantity: { lte: threshold } },
      include: { item: true, unit: true },
    });

    const lowGlobalItems = await prisma.item.findMany({ where: { quantity: { lte: threshold } } });

    res.json({ lowUnitItems, lowGlobalItems });
  } catch (error) {
    console.error('Low stock error', error);
    res.status(500).json({ message: 'Erro ao buscar itens com baixo estoque.' });
  }
});

export default router;