import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estendemos a interface Request do Express para poder adicionar nosso payload do usuário
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Pega o token do cabeçalho 'Authorization'
  const authHeader = req.headers.authorization;

  // 2. Se não houver cabeçalho, não há token. Acesso negado.
  if (!authHeader) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  // O cabeçalho vem no formato "Bearer TOKEN". Vamos separar o token.
  const token = authHeader.split(' ')[1];

  // 3. Se não houver token após o "Bearer", acesso negado.
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token mal formatado.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('Chave secreta do JWT não configurada.');
    }

    // 4. Verifica se o token é válido usando nossa chave secreta
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; role: string };

    // 5. Se o token for válido, adicionamos os dados do usuário à requisição
    req.user = decoded;

    // 6. Passa para a próxima função (a rota que o usuário queria acessar)
    next();
  } catch (error) {
    // Se o token for inválido (expirado, etc.), acesso negado.
    return res.status(401).json({ message: 'Token inválido.' });
  }
};
