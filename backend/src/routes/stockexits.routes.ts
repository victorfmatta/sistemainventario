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
// REGISTRAR SAÍDA DE ESTOQUE (COM TRANSAÇÃO)
// =====================================
router.post('/', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res) => {
    const { reason, description, target, unitId, items } = req.body;
    const { userId, companyId } = req.user!;

    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });

    if (!reason) return res.status(400).json({ message: "Motivo da saída é obrigatório." });

    if (!target || !['CENTRAL', 'UNIT'].includes(target)) {
        return res.status(400).json({ message: "Destino deve ser 'CENTRAL' ou 'UNIT'." });
    }

    if (target === 'UNIT' && !unitId) {
        return res.status(400).json({ message: "Selecione a unidade para registrar a saída." });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'A saída deve conter pelo menos um item.' });
    }

    try {
        const stockExit = await prisma.$transaction(async (tx) => {
            // Validar unidade se necessário
            if (target === 'UNIT') {
                const unit = await tx.unit.findFirst({
                    where: { id: unitId, companyId },
                });
                if (!unit) {
                    throw new Error('Unidade não encontrada nesta empresa.');
                }
            }

            // 1. Criar a Saída
            const exit = await tx.stockExit.create({
                data: {
                    reason,
                    description: description || null,
                    target,
                    unitId: target === 'UNIT' ? unitId : null,
                    registeredById: userId,
                    companyId,
                },
            });

            // 2. Processar itens
            for (const item of items) {
                if (!item.itemId || !item.quantity || item.quantity <= 0) {
                    throw new Error(`Item inválido: ${JSON.stringify(item)}`);
                }

                if (target === 'CENTRAL') {
                    // Debitar do estoque central (Item.quantity)
                    const currentItem = await tx.item.findUnique({
                        where: { id: item.itemId },
                        select: { quantity: true, name: true },
                    });

                    if (!currentItem) {
                        throw new Error(`Item não encontrado.`);
                    }

                    if (currentItem.quantity < item.quantity) {
                        throw new Error(
                            `Estoque insuficiente para "${currentItem.name}". Disponível: ${currentItem.quantity}, Solicitado: ${item.quantity}`
                        );
                    }

                    await tx.item.update({
                        where: { id: item.itemId },
                        data: {
                            quantity: { decrement: item.quantity },
                        },
                    });
                } else {
                    // Debitar do inventário da unidade (UnitItem.quantity)
                    const unitItem = await tx.unitItem.findUnique({
                        where: {
                            unitId_itemId: { unitId, itemId: item.itemId },
                        },
                        select: { id: true, quantity: true },
                    });

                    if (!unitItem) {
                        const itemInfo = await tx.item.findUnique({
                            where: { id: item.itemId },
                            select: { name: true },
                        });
                        throw new Error(
                            `Item "${itemInfo?.name || item.itemId}" não encontrado no inventário desta unidade.`
                        );
                    }

                    if (unitItem.quantity < item.quantity) {
                        const itemInfo = await tx.item.findUnique({
                            where: { id: item.itemId },
                            select: { name: true },
                        });
                        throw new Error(
                            `Estoque insuficiente para "${itemInfo?.name}" na unidade. Disponível: ${unitItem.quantity}, Solicitado: ${item.quantity}`
                        );
                    }

                    await tx.unitItem.update({
                        where: { id: unitItem.id },
                        data: {
                            quantity: { decrement: item.quantity },
                        },
                    });
                }

                // Criar registro do item na saída
                await tx.stockExitItem.create({
                    data: {
                        stockExitId: exit.id,
                        itemId: item.itemId,
                        quantity: item.quantity,
                    },
                });
            }

            return exit;
        });

        res.status(201).json(stockExit);
    } catch (error: any) {
        console.error('Erro na saída de estoque:', error);
        res.status(400).json({ message: error.message || 'Erro ao registrar saída de estoque.' });
    }
});

// =====================================
// LISTAR SAÍDAS
// =====================================
router.get('/', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ message: "Empresa não informada." });

        const exits = await prisma.stockExit.findMany({
            where: { companyId },
            include: {
                unit: { select: { id: true, name: true } },
                registeredBy: { select: { name: true } },
                items: {
                    include: {
                        item: { select: { id: true, name: true, internalCode: true } },
                    },
                },
            },
            orderBy: { exitDate: 'desc' },
            take: 50,
        });
        res.status(200).json(exits);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar histórico de saídas.' });
    }
});

// =====================================
// EXCLUIR SAÍDA (Reverter Estoque)
// =====================================
router.delete('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { restore } = req.query; // ?restore=true ou false
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });

    const shouldRestore = restore === 'true'; // Se 'true' devolve, senão só apaga

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Buscar a saída original com seus itens
            const exit = await tx.stockExit.findUnique({
                where: { id },
                include: { items: true },
            });

            if (!exit || exit.companyId !== companyId) {
                throw new Error('Saída não encontrada.');
            }

            // 2. Reverter debitos (Devolver ao estoque) - APENAS SE SOLICITADO
            if (shouldRestore) {
                for (const item of exit.items) {
                    if (exit.target === 'CENTRAL') {
                        await tx.item.update({
                            where: { id: item.itemId },
                            data: { quantity: { increment: item.quantity } },
                        });
                    } else if (exit.target === 'UNIT' && exit.unitId) {
                        // Tenta encontrar o item na unidade
                        const unitItem = await tx.unitItem.findUnique({
                            where: { unitId_itemId: { unitId: exit.unitId, itemId: item.itemId } },
                        });
                        
                        if (unitItem) {
                            await tx.unitItem.update({
                                where: { id: unitItem.id },
                                data: { quantity: { increment: item.quantity } },
                            });
                        } else {
                            // Se não existe mais, recriar
                            await tx.unitItem.create({
                                data: {
                                    unitId: exit.unitId,
                                    itemId: item.itemId,
                                    quantity: item.quantity,
                                },
                            });
                        }
                    }
                }
            }

            // 3. Excluir registro (itens deletados via cascade)
            await tx.stockExit.delete({ where: { id } });
        });

        const msg = shouldRestore 
            ? 'Saída excluída e estoque estornado com sucesso.' 
            : 'Registro de saída excluído (estoque mantido).';
            
        res.status(200).json({ message: msg });
    } catch (error: any) {
        console.error('Erro ao excluir saída:', error);
        res.status(500).json({ message: error.message || 'Erro ao excluir saída.' });
    }
});

// =====================================
// ATUALIZAR SAÍDA (Estorno + Novo Débito)
// =====================================
router.put('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { reason, description, target, unitId, items } = req.body; // Novos dados
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });
    
    // Validações básicas iguais ao CREATE
    if (!reason || !target || (target === 'UNIT' && !unitId) || !items || items.length === 0) {
        return res.status(400).json({ message: "Dados inválidos para atualização." });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Buscar saída ANTERIOR
            const oldExit = await tx.stockExit.findUnique({
                where: { id },
                include: { items: true },
            });

            if (!oldExit || oldExit.companyId !== companyId) {
                throw new Error('Saída original não encontrada.');
            }

            // 2. ESTORNO DO ESTOQUE (Baseado na saída ANTERIOR)
            for (const oldItem of oldExit.items) {
                if (oldExit.target === 'CENTRAL') {
                    await tx.item.update({
                        where: { id: oldItem.itemId },
                        data: { quantity: { increment: oldItem.quantity } },
                    });
                } else if (oldExit.target === 'UNIT' && oldExit.unitId) {
                    const unitItem = await tx.unitItem.findUnique({
                        where: { unitId_itemId: { unitId: oldExit.unitId, itemId: oldItem.itemId } },
                    });
                    if (unitItem) {
                        await tx.unitItem.update({
                            where: { id: unitItem.id },
                            data: { quantity: { increment: oldItem.quantity } },
                        });
                    } else {
                         await tx.unitItem.create({
                            data: {
                                unitId: oldExit.unitId,
                                itemId: oldItem.itemId,
                                quantity: oldItem.quantity,
                            },
                        });
                    }
                }
            }

            // 3. Limpar itens antigos (cascade deletaria, mas vamos atualizar a exit primeiro)
            await tx.stockExitItem.deleteMany({ where: { stockExitId: id } });

            // 4. Atualizar registro da Saída
            await tx.stockExit.update({
                where: { id },
                data: {
                    reason,
                    description: description || null,
                    target,
                    unitId: target === 'UNIT' ? unitId : null,
                },
            });

            // 5. APLICAR NOVO DÉBITO (Baseado nos NOVOS dados)
             for (const item of items) {
                if (!item.itemId || !item.quantity || item.quantity <= 0) {
                    throw new Error(`Item inválido na atualização.`);
                }
                
                // Verificar se é o mesmo item que retornou? Não importa, o estoque já subiu.
                // Agora o estoque deve ter (qtd_anterior + qtd_estornada).
                // Precisamos verificar se tem saldo para a NOVA quantidade.

                if (target === 'CENTRAL') {
                    const currentItem = await tx.item.findUnique({ where: { id: item.itemId } });
                    if (!currentItem || currentItem.quantity < item.quantity) {
                         throw new Error(`Estoque insuficiente no Central para o item (id: ${item.itemId}) após recálculo.`);
                    }
                    await tx.item.update({
                        where: { id: item.itemId },
                        data: { quantity: { decrement: item.quantity } },
                    });
                } else {
                    const unitItem = await tx.unitItem.findUnique({
                        where: { unitId_itemId: { unitId, itemId: item.itemId } },
                        include: { item: true }
                    });
                    if (!unitItem || unitItem.quantity < item.quantity) {
                         throw new Error(`Estoque insuficiente na Unidade para o item (id: ${item.itemId}) após recálculo.`);
                    }
                    await tx.unitItem.update({
                        where: { id: unitItem.id },
                        data: { quantity: { decrement: item.quantity } },
                    });
                }

                // Recriar item da saída
                await tx.stockExitItem.create({
                    data: {
                        stockExitId: id,
                        itemId: item.itemId,
                        quantity: item.quantity,
                    },
                });
            }
        });

        res.status(200).json({ message: 'Saída atualizada com sucesso.' });
    } catch (error: any) {
        console.error('Erro ao atualizar saída:', error);
        res.status(500).json({ message: error.message || 'Erro ao atualizar saída.' });
    }
});

export default router;
