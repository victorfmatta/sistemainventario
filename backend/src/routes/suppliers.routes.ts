import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

const directorOnly = (req: AuthenticatedRequest, res: any, next: any) => {
    if (req.user?.role !== 'DIRETOR') {
        return res.status(403).json({ message: 'Acesso negado. Apenas diretores podem realizar esta ação.' });
    }
    next();
};

// =====================================
// CRIAR FORNECEDOR
// =====================================
router.post('/', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res: Response) => {
    const { name, businessName, cnpj, contact, address } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(400).json({ message: "Empresa não informada." });
    if (!name) return res.status(400).json({ message: 'O nome fantasia é obrigatório.' });

    try {
        const newSupplier = await prisma.supplier.create({
            data: {
                name,
                businessName,
                cnpj,
                contact,
                address,
                company: { connect: { id: companyId } }
            },
        });
        res.status(201).json(newSupplier);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Já existe um fornecedor com este CNPJ nesta empresa.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar fornecedor.' });
    }
});

// =====================================
// LISTAR FORNECEDORES
// =====================================
router.get('/', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ message: "Empresa não informada." });

        const suppliers = await prisma.supplier.findMany({
            where: { companyId },
            orderBy: { name: 'asc' },
        });
        res.status(200).json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar fornecedores.' });
    }
});

// =====================================
// BUSCAR FORNECEDOR POR ID
// =====================================
router.get('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                stockEntries: {
                    orderBy: { entryDate: 'desc' },
                    take: 5,
                }
            }
        });

        if (!supplier) {
            return res.status(404).json({ message: 'Fornecedor não encontrado.' });
        }

        res.status(200).json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar fornecedor.' });
    }
});

// =====================================
// ATUALIZAR FORNECEDOR
// =====================================
router.put('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, businessName, cnpj, contact, address } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'O nome fantasia é obrigatório.' });
    }

    try {
        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: {
                name,
                businessName,
                cnpj,
                contact,
                address,
            },
        });
        res.status(200).json(updatedSupplier);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Já existe um fornecedor com este CNPJ.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar fornecedor.' });
    }
});

// =====================================
// DELETAR FORNECEDOR
// =====================================
router.delete('/:id', authMiddleware, directorOnly, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.supplier.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'Não é possível excluir este fornecedor pois existem entradas de estoque vinculadas a ele.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir fornecedor.' });
    }
});

export default router;