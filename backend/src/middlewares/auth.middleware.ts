import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// --- INÍCIO DA ALTERAÇÃO ---
// Adicione 'export' aqui para que outros arquivos possam usar este tipo
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}
// --- FIM DA ALTERAÇÃO ---

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_jwt');
    req.user = decoded as { userId: string; role: string; };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};
