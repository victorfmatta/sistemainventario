import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Rota de Login: POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    // Buscamos o usuário INCLUINDO as empresas às quais ele tem acesso
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            cnpj: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha inválida.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('A chave secreta do JWT não está configurada no arquivo .env');
      return res.status(500).json({ message: 'Erro interno do servidor: configuração de segurança ausente.' });
    }

    // O payload continua leve, apenas identificação
    const payload = {
      userId: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '7d',
    });

    // Retornamos o token E a lista de empresas permitidas
    res.status(200).json({
      message: 'Login bem-sucedido!',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companies: user.companies // Lista de empresas para o frontend gerenciar
      },
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

export default router;