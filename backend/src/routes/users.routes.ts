import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// Middleware de autorização: Verifica se o usuário é Diretor OU Coordenador
const canManageUsers = (req: AuthenticatedRequest, res: any, next: any) => {
  const role = req.user?.role;
  if (role !== 'DIRETOR' && role !== 'COORDENADOR') {
    return res.status(403).json({ message: 'Acesso negado. Ação permitida apenas para Diretores ou Coordenadores.' });
  }
  next();
};

// Middleware de leitura: Diretor, Coordenador e Auditor podem listar usuários
const canViewUsers = (req: AuthenticatedRequest, res: any, next: any) => {
  const role = req.user?.role;
  if (role !== 'DIRETOR' && role !== 'COORDENADOR' && role !== 'AUDITOR') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  next();
};

// Middleware específico para Diretores
const directorOnly = (req: AuthenticatedRequest, res: any, next: any) => {
    if (req.user?.role !== 'DIRETOR') {
      return res.status(403).json({ message: 'Acesso negado. Apenas diretores podem realizar esta ação.' });
    }
    next();
};

// Rota para LISTAR usuários
router.get('/', authMiddleware, canViewUsers, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, role } = req.user!;
    let whereClause: Prisma.UserWhereInput = {};

    if (role === 'AUDITOR') {
      // Auditor vê todos os usuários, sem filtro extra
    } else if (role === 'AUDITOR') {
      // Auditor vê todos os usuários, sem filtro extra
    } else if (role === 'COORDENADOR') {
      const managedUnits = await prisma.unit.findMany({
        where: { coordinatorId: userId },
        select: { id: true },
      });
      const managedUnitIds = managedUnits.map(unit => unit.id);

      whereClause = {
        role: 'INSTRUTOR',
        OR: [
          { createdById: userId },
          { unitId: { in: managedUnitIds } },
        ],
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        unit: { select: { id: true, name: true } },
        managedUnits: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
});

// --- ROTA DE CRIAÇÃO CORRIGIDA (FINAL) ---
router.post('/', authMiddleware, canManageUsers, async (req: AuthenticatedRequest, res) => {
  const { name, email, password, role: roleToCreate, companyId } = req.body;
  const { role: creatorRole, userId: creatorId } = req.user!;

  if (!name || !email || !password || !roleToCreate) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  if (creatorRole === 'COORDENADOR' && roleToCreate !== 'INSTRUTOR') {
    return res.status(403).json({ message: 'Coordenadores podem criar apenas usuários do tipo Instrutor.' });
  }
  if (creatorRole === 'DIRETOR' && !['COORDENADOR', 'INSTRUTOR', 'AUDITOR'].includes(roleToCreate)) {
    return res.status(400).json({ message: 'Cargo inválido.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: roleToCreate,
        createdById: creatorId,
        
        // --- CORREÇÃO AQUI ---
        // Usamos 'connect' pois a empresa JÁ EXISTE.
        // O Prisma vai criar o vínculo na tabela de relacionamento automaticamente.
        companies: companyId ? {
            connect: { id: companyId }
        } : undefined
      },
      select: { id: true, name: true, email: true, role: true }
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    // @ts-ignore
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'O e-mail fornecido já está em uso.' });
    }
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ message: 'Erro ao criar usuário.' });
  }
});

// Rota para ATUALIZAR um usuário
router.put('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res) => {
    const { id: idToUpdate } = req.params;
    const { name, email, role: newRole } = req.body;
    const requesterId = req.user!.userId;

    if (!name && !email && !newRole) {
        return res.status(400).json({ message: 'Dados insuficientes para atualização.' });
    }

    if (idToUpdate === requesterId && newRole && newRole !== 'DIRETOR') {
        return res.status(403).json({ message: 'Você não pode alterar seu próprio cargo.' });
    }

    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const currentUser = await tx.user.findUnique({ where: { id: idToUpdate } });

            if (currentUser?.role === 'COORDENADOR' && newRole && newRole !== 'COORDENADOR') {
                await tx.unit.updateMany({
                    where: { coordinatorId: idToUpdate },
                    data: { coordinatorId: null },
                });
            }

            const user = await tx.user.update({
                where: { id: idToUpdate },
                data: { name, email, role: newRole },
                select: { id: true, name: true, email: true, role: true }
            });

            return user;
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        // @ts-ignore
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Email já em uso.' });
        }
        res.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
});

// Rota para DELETAR um usuário
router.delete('/:id', authMiddleware, canManageUsers, async (req: AuthenticatedRequest, res) => {
    const { id: idToDelete } = req.params;
    const { userId: requesterId, role: requesterRole } = req.user!;

    if (idToDelete === requesterId) {
        return res.status(400).json({ message: 'Você não pode excluir a si mesmo.' });
    }

    try {
        const userToDelete = await prisma.user.findUnique({ where: { id: idToDelete } });
        if (!userToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (requesterRole === 'COORDENADOR' && userToDelete.role !== 'INSTRUTOR') {
            return res.status(403).json({ message: 'Coordenadores podem excluir apenas Instrutores.' });
        }

        await prisma.user.delete({ where: { id: idToDelete } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar usuário.' });
    }
});

// Middleware específico para Coordenadores
const coordinatorOnly = (req: AuthenticatedRequest, res: any, next: any) => {
  if (req.user?.role !== 'COORDENADOR') {
    return res.status(403).json({ message: 'Acesso negado. Apenas coordenadores podem realizar esta ação.' });
  }
  next();
};

// Rota para ASSOCIAR um instrutor a uma unidade
router.put('/:userId/assign-unit', authMiddleware, coordinatorOnly, async (req: AuthenticatedRequest, res) => {
  const { userId: instructorId } = req.params;
  const { unitId } = req.body;
  const { userId: coordinatorId } = req.user!;

  if (!unitId) {
    return res.status(400).json({ message: 'O ID da unidade é obrigatório.' });
  }

  try {
    const unit = await prisma.unit.findFirst({
      where: { id: unitId, coordinatorId: coordinatorId },
    });

    if (!unit) {
      return res.status(403).json({ message: 'Acesso negado. Unidade não gerenciada por você.' });
    }

    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor || instructor.role !== 'INSTRUTOR') {
      return res.status(404).json({ message: 'Usuário não é um instrutor válido.' });
    }

    const updatedInstructor = await prisma.user.update({
      where: { id: instructorId },
      data: { unitId: unitId },
      select: { id: true, name: true, email: true, role: true, unit: { select: { name: true } } }
    });

    res.status(200).json(updatedInstructor);

  } catch (error) {
    console.error("Erro ao associar unidade:", error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

export default router;