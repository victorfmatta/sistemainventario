import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// =====================================
// Middleware: Apenas DIRETOR
// =====================================
const directorOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: any
) => {
  if (req.user?.role !== 'DIRETOR') {
    return res
      .status(403)
      .json({ message: 'Acesso negado. Apenas diretores podem realizar esta ação.' });
  }
  next();
};

// =====================================
// CRIAR UNIDADE (Diretor)
// =====================================
// Adicionado ': AuthenticatedRequest' aqui vvv
router.post('/', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  const companyId = req.user?.companyId;

  if (!companyId) {
    return res.status(400).json({ message: 'Empresa não selecionada.' });
  }

  if (!name) {
    return res.status(400).json({
      message: 'O nome da unidade é obrigatório.',
    });
  }

  try {
    const newUnit = await prisma.unit.create({
      data: { 
        name,
        company: { connect: { id: companyId } } 
      },
    });

    res.status(201).json(newUnit);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Já existe uma unidade com este nome nesta empresa.',
      });
    }

    res.status(500).json({
      message: 'Erro ao criar a unidade.',
    });
  }
});

// =====================================
// ATUALIZAR UNIDADE (Diretor)
// =====================================
router.put('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, coordinatorId } = req.body;
  
  if (!name && coordinatorId === undefined) {
    return res.status(400).json({
      message:
        'É necessário fornecer um nome ou um ID de coordenador para atualizar.',
    });
  }

  try {
    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        name,
        coordinatorId,
      },
    });

    res.status(200).json(updatedUnit);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao atualizar a unidade.',
    });
  }
});

// =====================================
// DELETAR UNIDADE (Diretor)
// =====================================
router.delete('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      // Remove vínculo dos usuários com a unidade
      await tx.user.updateMany({
        where: { unitId: id },
        data: { unitId: null },
      });

      // Remove a unidade
      await tx.unit.delete({
        where: { id },
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar unidade:', error);
    res.status(500).json({
      message:
        'Erro ao deletar a unidade. Verifique as dependências no banco.',
    });
  }
});

// =====================================
// LISTAR UNIDADES
// =====================================
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Agora o TypeScript sabe que 'req.user' existe!
    const { userId, role, companyId } = req.user!;
    
    if (!companyId) {
       return res.status(400).json({ message: "Contexto de empresa obrigatório." });
    }

    let whereClause: Prisma.UnitWhereInput = {
        companyId: companyId 
    };

    if (role === 'COORDENADOR') {
      whereClause = { ...whereClause, coordinatorId: userId };
    }

    if (role === 'INSTRUTOR') {
      const instructor = await prisma.user.findUnique({
        where: { id: userId },
        select: { unitId: true },
      });

      whereClause = instructor?.unitId
        ? { ...whereClause, id: instructor.unitId }
        : { id: '-1' };
    }

    const units = await prisma.unit.findMany({
      where: whereClause,
      include: {
        coordinator: {
          select: {
            id: true,
            name: true,
          },
        },
        instructors: {
          where: { role: 'INSTRUTOR' },
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.status(200).json(units);
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    res.status(500).json({
      message: 'Ocorreu um erro no servidor ao buscar unidades.',
    });
  }
});

// =====================================
// BUSCAR UMA UNIDADE ESPECÍFICA
// =====================================
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          orderBy: {
            item: { name: 'asc' },
          },
          include: {
            item: true,
          },
        },
      },
    });

    if (!unit) {
      return res.status(404).json({
        message: 'Unidade não encontrada.',
      });
    }

    res.status(200).json(unit);
  } catch (error) {
    console.error('Erro ao buscar detalhes da unidade:', error);
    res.status(500).json({
      message: 'Ocorreu um erro no servidor.',
    });
  }
});

export default router;