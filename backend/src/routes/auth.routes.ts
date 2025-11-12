import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // 1. Importar a biblioteca JWT

const router = Router();
const prisma = new PrismaClient();

// Rota de Login: POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha inválida.' });
    }

    // --- INÍCIO DAS ALTERAÇÕES ---

    // 2. Verificar se a chave secreta do JWT está configurada no .env
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('A chave secreta do JWT não está configurada no arquivo .env');
      return res.status(500).json({ message: 'Erro interno do servidor: configuração de segurança ausente.' });
    }

    // 3. Criar o "payload" do token com informações essenciais do usuário
    const payload = {
      userId: user.id,
      role: user.role,
    };

    // 4. Gerar o token JWT, com validade de 7 dias
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '7d', // O token expirará em 7 dias
    });

    // 5. Enviar o token e os dados do usuário na resposta
    res.status(200).json({
      message: 'Login bem-sucedido!',
      token: token, // O token de autenticação
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // --- FIM DAS ALTERAÇÕES ---

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
  }
});

export default router;
