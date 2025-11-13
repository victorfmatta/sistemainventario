import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import unitsRoutes from './routes/units.routes';
import itemsRoutes from './routes/items.routes';
import requestsRoutes from './routes/requests.routes';
import usersRoutes from './routes/users.routes'; // 1. Importar a nova rota

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/users', usersRoutes); // 2. Adicionar a nova rota

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}` );
});
