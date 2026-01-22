import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import unitsRoutes from './routes/units.routes';
import itemsRoutes from './routes/items.routes';
import requestsRoutes from './routes/requests.routes';
import usersRoutes from './routes/users.routes';
import suppliersRoutes from './routes/suppliers.routes';
import stockEntriesRoutes from './routes/stockentries.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/stock-entries', stockEntriesRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});
