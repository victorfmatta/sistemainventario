import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    companyId?: string; // Campo opcional que será preenchido se o header for enviado
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    // 1. Validar Token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_jwt') as { userId: string; role: string };
    
    // Inicializa o objeto user no request
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    // 2. Validar Acesso à Empresa (Multi-tenancy)
    // O Frontend deve enviar 'x-company-id' quando estiver operando em uma empresa específica
    const companyIdHeader = req.headers['x-company-id'] as string;

    if (companyIdHeader) {
      // Verifica no banco se este usuário pertence a esta empresa
      const userHasAccess = await prisma.user.count({
        where: {
          id: decoded.userId,
          companies: {
            some: {
              id: companyIdHeader
            }
          }
        }
      });

      if (userHasAccess === 0) {
        return res.status(403).json({ message: 'Acesso negado a esta empresa.' });
      }

      // Se tem acesso, injetamos o ID da empresa no contexto do usuário
      req.user.companyId = companyIdHeader;
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};