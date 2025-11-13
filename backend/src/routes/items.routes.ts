import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// --- INÍCIO DA REATORAÇÃO ---

// Rota para LISTAR todos os itens do Estoque Central: GET /api/items
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(items);
  } catch (error) {
    console.error('Erro ao listar itens do estoque central:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

// Rota para CRIAR um novo item no Estoque Central: POST /api/items
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, quantity } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ message: 'Nome e quantidade são obrigatórios.' });
    }

    const newItem = await prisma.item.create({
      data: {
        name,
        description,
        quantity: Number(quantity),
      },
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Erro ao criar item no estoque central:', error);
    // Adiciona verificação para erro de nome único
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ message: 'Já existe um item com este nome no estoque.' });
    }
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

// Rota para ATUALIZAR um item no Estoque Central: PUT /api/items/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity } = req.body;

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
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
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Transação para garantir que o item só seja excluído se não estiver em uso
    await prisma.$transaction(async (tx) => {
      const itemInUse = await tx.unitItem.findFirst({ where: { itemId: id } });
      if (itemInUse) {
        throw new Error('Não é possível excluir o item, pois ele já faz parte do inventário de uma ou mais unidades.');
      }
      
      // O Prisma já impede a exclusão se houver solicitações ativas,
      // mas podemos adicionar uma verificação explícita se necessário.

      await tx.item.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao excluir item do estoque central:', error);
    res.status(400).json({ message: error.message || 'Ocorreu um erro no servidor.' });
  }
});

// --- FIM DA REATORAÇÃO ---

export default router;
