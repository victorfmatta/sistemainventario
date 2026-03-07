import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Middleware: Apenas DIRETOR
const directorOnly = (req: AuthenticatedRequest, res: any, next: any) => {
    if (req.user?.role !== 'DIRETOR') {
        return res.status(403).json({ message: 'Acesso negado. Apenas diretores podem realizar esta ação.' });
    }
    next();
};

// =====================================
// REGISTRAR ENTRADA DE ESTOQUE (COM TRANSAÇÃO)
// =====================================
router.post('/', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res) => {
    const { supplierId, invoiceNumber, issueDate, items } = req.body;
    const { userId, companyId } = req.user!;

    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'A entrada deve conter pelo menos um item.' });
    }

    try {
        const stockEntry = await prisma.$transaction(async (tx) => {
            // 1. Criar a Entrada
            const entry = await tx.stockEntry.create({
                data: {
                    supplierId: supplierId || null,
                    invoiceNumber,
                    issueDate: issueDate ? new Date(issueDate) : new Date(),
                    registeredById: userId,
                    companyId: companyId // CORREÇÃO: Usando o ID direto
                },
            });

            // 2. Processar itens
            for (const item of items) {
                if (!item.itemId || !item.quantity || item.quantity <= 0) {
                    throw new Error(`Item inválido: ${JSON.stringify(item)}`);
                }

                await tx.stockEntryItem.create({
                    data: {
                        stockEntryId: entry.id,
                        itemId: item.itemId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice || 0,
                    },
                });

                await tx.item.update({
                    where: { id: item.itemId },
                    data: {
                        quantity: {
                            increment: item.quantity,
                        },
                    },
                });
            }

            return entry;
        });

        res.status(201).json(stockEntry);
    } catch (error: any) {
        console.error('Erro na entrada de estoque:', error);
        res.status(500).json({ message: error.message || 'Erro ao registrar entrada de estoque.' });
    }
});

// =====================================
// LISTAR ENTRADAS
// =====================================
router.get('/', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ message: "Empresa não informada." });

        const entries = await prisma.stockEntry.findMany({
            where: { companyId }, // Filtra por empresa
            include: {
                supplier: {
                    select: { name: true },
                },
                registeredBy: {
                    select: { name: true },
                },
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { entryDate: 'desc' },
            take: 50,
        });
        res.status(200).json(entries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar histórico de entradas.' });
    }
});

// =====================================
// DETALHES DA ENTRADA
// =====================================
router.get('/:id', authMiddleware, directorOnly, async (req, res) => {
    const { id } = req.params;
    try {
        const entry = await prisma.stockEntry.findUnique({
            where: { id },
            include: {
                supplier: true,
                registeredBy: {
                    select: { name: true, email: true },
                },
                items: {
                    include: {
                        item: {
                            select: { name: true, internalCode: true, unitOfMeasure: true },
                        },
                    },
                },
            },
        });

        if (!entry) {
            return res.status(404).json({ message: 'Entrada não encontrada.' });
        }

        res.status(200).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar detalhes da entrada.' });
    }
});

// =====================================
// EXCLUIR ENTRADA
// =====================================
router.delete('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });

    try {
        const entry = await prisma.stockEntry.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!entry || entry.companyId !== companyId) {
            return res.status(404).json({ message: 'Entrada não encontrada.' });
        }

        await prisma.$transaction(async (tx) => {
            // Decrementa o saldo dos itens relacionados
            for (const item of entry.items) {
                const current = await tx.item.findUnique({ where: { id: item.itemId }, select: { quantity: true } });
                const newQty = Math.max(0, (current?.quantity || 0) - item.quantity);
                await tx.item.update({ where: { id: item.itemId }, data: { quantity: newQty } });
            }

            // Exclui a entrada (itens são removidos por cascata)
            await tx.stockEntry.delete({ where: { id } });
        });

        return res.json({ message: 'Entrada removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir entrada:', error);
        return res.status(500).json({ message: 'Erro ao excluir entrada.' });
    }
});

export default router;