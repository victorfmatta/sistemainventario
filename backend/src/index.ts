import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

// 1. Importar os arquivos de rota
import authRoutes from './routes/auth.routes';
import unitRoutes from './routes/units.routes';
import itemRoutes from './routes/itens.routes'; // <-- NOVA IMPORTAÇÃO

// Cria uma instância do aplicativo Express
const app = express();

// Define a porta em que o servidor vai rodar
const PORT = 3001;

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Olá! O servidor do inventário está no ar!' });
});

// 2. Registrar as rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/items', itemRoutes); // <-- NOVO REGISTRO DE ROTA

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}` );
});
