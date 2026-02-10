import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Rota GET para buscar solicitações com base no cargo e filtros
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, role, companyId } = req.user!;
    const { status, unitId, search } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "Contexto de empresa obrigatório." });
    }

    let whereClause: Prisma.RequestWhereInput = {
      companyId: companyId
    };

    if (role === 'COORDENADOR') {
      const managedUnits = await prisma.unit.findMany({
        where: { coordinatorId: userId },
        select: { id: true },
      });
      const managedUnitIds = managedUnits.map(unit => unit.id);
      whereClause = {
        ...whereClause,
        unitId: { in: managedUnitIds },
      };
    } else if (role === 'INSTRUTOR') {
      const instructorUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { unitId: true },
      });
      if (instructorUser?.unitId) {
        whereClause = {
          ...whereClause,
          unitId: instructorUser.unitId,
        };
      } else {
        whereClause = { ...whereClause, id: '-1' };
      }
    }

    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    if (unitId && typeof unitId === 'string') {
      if (role === 'DIRETOR') {
        whereClause.unitId = unitId;
      }
    }

    if (search && typeof search === 'string') {
      whereClause.item = {
        name: {
          contains: search,
        },
      };
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        item: { select: { name: true } },
        requestedBy: { select: { name: true } },
        unit: { select: { name: true } },
      },
    });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor ao buscar as solicitações.' });
  }
});

// Rota POST para criar uma nova solicitação
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId, quantity, unitId, purpose, observation } = req.body;
    const { userId, companyId } = req.user!;

    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });
    if (!itemId || !quantity || !unitId || !userId) {
      return res.status(400).json({ message: 'Dados da solicitação incompletos.' });
    }

    const newRequest = await prisma.request.create({
      data: {
        quantity: Number(quantity),
        status: 'SOLICITADO',
        purpose,
        observation,
        requestedById: userId,
        itemId,
        unitId,
        companyId: companyId // CORREÇÃO: Usando o ID direto
      },
    });
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    res.status(500).json({ message: 'Ocorreu um erro no servidor ao criar a solicitação.' });
  }
});

// Rota PUT para atualizar o status
router.put('/:id/status', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const userRole = req.user?.role;

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.request.findUnique({ where: { id } });
      if (!request) {
        throw new Error('Solicitação não encontrada.');
      }

      if (userRole === 'DIRETOR' || userRole === 'COORDENADOR') {
        if (newStatus === 'ENVIADO' && request.status === 'SOLICITADO') {
          const centralStockItem = await tx.item.findUnique({ where: { id: request.itemId } });
          if (!centralStockItem || centralStockItem.quantity < request.quantity) {
            throw new Error('Estoque central insuficiente para atender a esta solicitação.');
          }
          await tx.item.update({
            where: { id: request.itemId },
            data: { quantity: { decrement: request.quantity } },
          });

        } else if (newStatus !== 'CANCELADO') {
          throw new Error('Ação não permitida para este cargo ou status atual.');
        }
      } else if (userRole === 'INSTRUTOR') {
        if (newStatus === 'RECEBIDO' && request.status === 'ENVIADO') {
          await tx.unitItem.upsert({
            where: { unitId_itemId: { unitId: request.unitId, itemId: request.itemId } },
            update: { quantity: { increment: request.quantity } },
            create: {
              unitId: request.unitId,
              itemId: request.itemId,
              quantity: request.quantity,
            },
          });
        } else {
          throw new Error('Ação não permitida para este cargo ou status atual.');
        }
      } else {
        throw new Error('Cargo de usuário desconhecido.');
      }

      const updatedRequest = await tx.request.update({
        where: { id },
        data: { status: newStatus },
      });

      return updatedRequest;
    });

    res.status(200).json(result);

  } catch (error: any) {
    console.error('Erro ao atualizar status da solicitação:', error.message);
    res.status(400).json({ message: error.message });
  }
});

export default router;