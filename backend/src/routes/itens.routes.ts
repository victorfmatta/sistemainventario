import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Rota para criar um novo item em uma unidade: POST /api/items
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 1. Pega os dados do corpo da requisição
    const { name, description, quantity, unitId } = req.body;

    // 2. Validação básica dos dados
    if (!name || !quantity || !unitId) {
      return res.status(400).json({ message: 'Nome, quantidade e ID da unidade são obrigatórios.' });
    }

    // 3. Verifica se a unidade existe (boa prática)
    const unitExists = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unitExists) {
      return res.status(404).json({ message: 'Unidade não encontrada.' });
    }

    // 4. Cria o novo item no banco de dados, associado à unidade
    const newItem = await prisma.item.create({
      data: {
        name,
        description,
        quantity: Number(quantity), // Garante que a quantidade seja um número
        unitId,
      },
    });

    // 5. Retorna o item recém-criado
    res.status(201).json(newItem);

  } catch (error) {
    console.error('Erro ao criar item:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor ao criar o item.' });
  }
});

export default router;
