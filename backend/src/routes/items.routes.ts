import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Rota para LISTAR todos os itens do Estoque Central: GET /api/items
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });

    const items = await prisma.item.findMany({
      where: { companyId }, // Filtra por empresa
      orderBy: { name: 'asc' },
    });
    res.status(200).json(items);
  } catch (error) {
    console.error('Erro ao listar itens do estoque central:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

// Rota para CRIAR um novo item no Estoque Central: POST /api/items
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    // Permitir criação apenas para DIRETOR
    if (req.user?.role !== 'DIRETOR') {
      return res.status(403).json({ message: 'Apenas usuário com papel de DIRETOR pode criar itens.' });
    }

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });

    const { name, description, unitOfMeasure, internalCode, quantity } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ message: 'Nome e quantidade são obrigatórios.' });
    }

    const newItem = await prisma.item.create({
      data: {
        name,
        description,
        unitOfMeasure,
        internalCode,
        quantity: Number(quantity),
        company: { connect: { id: companyId } } // Vincula à empresa
      },
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Erro ao criar item no estoque central:', error);
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ message: 'Já existe um item com este nome nesta empresa.' });
    }
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

// Rota para ATUALIZAR um item no Estoque Central: PUT /api/items/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unitOfMeasure, internalCode, quantity } = req.body;

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        unitOfMeasure,
        internalCode,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
      },
    });

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Erro ao atualizar item do estoque central:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

// Rota para EXCLUIR um item do Estoque Central: DELETE /api/items/:id
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Verificações explícitas antes de tentar excluir
    const [unitItemsCount, requestsCount, stockEntryItemsCount] = await Promise.all([
      prisma.unitItem.count({ where: { itemId: id } }),
      prisma.request.count({ where: { itemId: id } }),
      prisma.stockEntryItem.count({ where: { itemId: id } }),
    ]);

    const reasons: string[] = [];
    if (unitItemsCount > 0) reasons.push(`${unitItemsCount} referência(s) em inventários de unidade`);
    if (requestsCount > 0) reasons.push(`${requestsCount} solicitação(ões)`);
    if (stockEntryItemsCount > 0) reasons.push(`${stockEntryItemsCount} item(ns) em entradas de estoque`);

    if (reasons.length > 0) {
      return res.status(400).json({
        message: `Não é possível excluir o item pois ele possui: ${reasons.join(', ')}. Remova ou ajuste essas referências antes de tentar novamente.`,
      });
    }

    await prisma.item.delete({ where: { id } });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao excluir item do estoque central:', error);

    if ((error as any).code === 'P2003' || /foreign key/i.test(error.message || '')) {
      return res.status(400).json({ message: 'Não é possível excluir o item porque ele está sendo referenciado por outros registros.' });
    }

    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

export default router;