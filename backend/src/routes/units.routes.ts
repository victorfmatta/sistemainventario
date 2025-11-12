import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

// 1. Importar nosso middleware de autenticação
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Rota para buscar todas as unidades: GET /api/units
// 2. Usamos o 'authMiddleware' ANTES da lógica da rota.
// Isso garante que só usuários autenticados podem acessar esta rota.
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Por enquanto, vamos apenas retornar todas as unidades.
    // No futuro, poderíamos filtrar baseado no cargo do usuário (req.user.role)
    const units = await prisma.unit.findMany({
      orderBy: {
        name: 'asc', // Ordenar por nome em ordem alfabética
      },
    });

    res.status(200).json(units);

  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor ao buscar unidades.' });
  }
});

// Futuramente, podemos adicionar outras rotas aqui, como:
// router.post('/', authMiddleware, (req, res) => { /* ...código para criar unidade... */ });

export default router;
