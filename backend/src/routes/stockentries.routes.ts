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
    const { userId } = req.user!;

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
                },
            });

            // 2. Processar itens
            for (const item of items) {
                if (!item.itemId || !item.quantity || item.quantity <= 0) {
                    throw new Error(`Item inválido: ${JSON.stringify(item)}`);
                }

                // Criar o registro do item na entrada
                await tx.stockEntryItem.create({
                    data: {
                        stockEntryId: entry.id,
                        itemId: item.itemId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice || 0,
                    },
                });

                // Atualizar o estoque do item
                await tx.item.update({
                    where: { id: item.itemId },
                    data: {
                        quantity: {
                            increment: item.quantity,
                        },
                        // Opcional: Atualizar preço de custo médio ou último preço aqui se desejado no futuro
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
router.get('/', authMiddleware, directorOnly, async (req, res) => {
    try {
        const entries = await prisma.stockEntry.findMany({
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
            take: 50, // Limite inicial de 50 registros para não pesar
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

export default router;
