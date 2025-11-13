import { Router, Request } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware'; // Importando o tipo correto

const router = Router();
const prisma = new PrismaClient();

// --- INÍCIO DAS NOVAS ROTAS DE GERENCIAMENTO ---

// Middleware para verificar se o usuário é Diretor
const directorOnly = (req: AuthenticatedRequest, res: any, next: any) => {
  if (req.user?.role !== 'DIRETOR') {
    return res.status(403).json({ message: 'Acesso negado. Apenas diretores podem realizar esta ação.' });
  }
  next();
};

// Rota para CRIAR uma nova unidade (Apenas Diretor)
router.post('/', authMiddleware, directorOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'O nome da unidade é obrigatório.' });
  }
  try {
    const newUnit = await prisma.unit.create({
      data: { name },
    });
    res.status(201).json(newUnit);
  } catch (error) {
    // @ts-ignore
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Já existe uma unidade com este nome.' });
    }
    res.status(500).json({ message: 'Erro ao criar a unidade.' });
  }
});

// Rota para ATUALIZAR uma unidade (ex: associar um coordenador) (Apenas Diretor)
router.put('/:id', authMiddleware, directorOnly, async (req, res) => {
  const { id } = req.params;
  const { name, coordinatorId } = req.body; // Recebe nome e/ou ID do coordenador

  if (!name && !coordinatorId) {
    return res.status(400).json({ message: 'É necessário fornecer um nome ou um ID de coordenador para atualizar.' });
  }

  try {
    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        name, // Atualiza o nome se fornecido
        coordinatorId, // Associa ou desassocia o coordenador (pode ser null)
      },
    });
    res.status(200).json(updatedUnit);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar a unidade.' });
  }
});

// Rota para DELETAR uma unidade (Apenas Diretor)
router.delete('/:id', authMiddleware, directorOnly, async (req, res) => {
  const { id } = req.params;
  try {
    // Validação: Não permitir excluir unidade se ela tiver itens no inventário ou solicitações
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: { inventoryItems: true, requests: true },
    });

    if (unit?.inventoryItems.length || 0 > 0) {
      return res.status(400).json({ message: 'Não é possível excluir a unidade. Esvazie o inventário local primeiro.' });
    }
    if (unit?.requests.length || 0 > 0) {
      return res.status(400).json({ message: 'Não é possível excluir a unidade. Existem solicitações associadas a ela.' });
    }

    await prisma.unit.delete({ where: { id } });
    res.status(204).send(); // 204 No Content
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar a unidade.' });
  }
});

// --- FIM DAS NOVAS ROTAS DE GERENCIAMENTO ---


// Rota para buscar unidades com base no cargo do usuário: GET /api/units
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, role } = req.user!;
    let whereClause: Prisma.UnitWhereInput = {};

    if (role === 'COORDENADOR') {
      whereClause = { coordinatorId: userId };
    } else if (role === 'INSTRUTOR') {
      const instructorUser = await prisma.user.findUnique({ where: { id: userId } });
      whereClause = instructorUser?.unitId ? { id: instructorUser.unitId } : { id: '-1' };
    }

    const units = await prisma.unit.findMany({
      where: whereClause,
      // Incluindo o nome do coordenador para exibir na interface
      include: {
        coordinator: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(units);
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor ao buscar unidades.' });
  }
});

// Rota para buscar UMA unidade específica (sem alterações)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          orderBy: { item: { name: 'asc' } },
          include: { item: true },
        },
      },
    });
    if (!unit) {
      return res.status(404).json({ message: 'Unidade não encontrada.' });
    }
    res.status(200).json(unit);
  } catch (error) {
    console.error('Erro ao buscar detalhes da unidade:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

export default router;
